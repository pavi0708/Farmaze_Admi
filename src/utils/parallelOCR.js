import sharp from 'sharp';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

class ParallelOCRProcessor {
  constructor(apiKey) {
    this.openai = new OpenAI({ apiKey });
    this.cacheDir = './ocr_cache';
    this.ensureCacheDir();
  }

  async ensureCacheDir() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create cache directory:', error);
    }
  }

  // Generate hash for caching
  async getImageHash(imagePath) {
    const buffer = await fs.readFile(imagePath);
    return crypto.createHash('md5').update(buffer).digest('hex');
  }

  // Check cache for existing results
  async getCachedResult(hash) {
    try {
      const cacheFile = path.join(this.cacheDir, `${hash}.json`);
      const cached = await fs.readFile(cacheFile, 'utf8');
      return JSON.parse(cached);
    } catch {
      return null;
    }
  }

  // Save result to cache
  async saveToCache(hash, result) {
    try {
      const cacheFile = path.join(this.cacheDir, `${hash}.json`);
      await fs.writeFile(cacheFile, JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('Failed to save to cache:', error);
    }
  }

  // Preprocess image: aggressive optimization for speed
  async preprocessImage(inputPath, outputPath, maxWidth = 800) {
    await sharp(inputPath)
      .resize({ width: maxWidth, withoutEnlargement: true })
      .jpeg({ quality: 70 }) // Lower quality for speed
      .toFile(outputPath);
    
    return outputPath;
  }

  // Split image into left and right halves
  async splitImage(imagePath) {
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    const { width, height } = metadata;
    
    const halfWidth = Math.floor(width / 2);
    
    // Create temporary files for left and right halves
    const leftPath = `${imagePath}_left.jpg`;
    const rightPath = `${imagePath}_right.jpg`;
    
    // Extract left half
    await image
      .clone()
      .extract({ left: 0, top: 0, width: halfWidth, height })
      .jpeg({ quality: 85 })
      .toFile(leftPath);
    
    // Extract right half
    await image
      .clone()
      .extract({ left: halfWidth, top: 0, width: width - halfWidth, height })
      .jpeg({ quality: 85 })
      .toFile(rightPath);
    
    return { leftPath, rightPath };
  }

  // OCR processing with structured JSON schema
  async processImageSection(imagePath, sectionName) {
    try {
      const imageBuffer = await fs.readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');
      
      const jsonSchema = {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                product_name: { type: "string" },
                quantity: { type: "number" },
                unit: { type: "string" },
                unit_price: { type: "number" },
                total_price: { type: "number" }
              },
              required: ["product_name", "quantity", "unit"]
            }
          },
          section: { type: "string" }
        },
        required: ["items", "section"]
      };

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Extract product order data from this ${sectionName} section of an order sheet. 
                
                Rules:
                - Extract product name, quantity, unit, unit price, and total price
                - Skip any rows with dashes (-) or empty values
                - Normalize units (kg, pkt, box, etc.)
                - Convert all prices to numbers
                - If unit price is missing, calculate from total_price / quantity
                - Return structured JSON only`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "order_extraction",
            schema: jsonSchema
          }
        },
        max_tokens: 2000
      });

      const result = JSON.parse(response.choices[0].message.content);
      result.section = sectionName;
      return result;

    } catch (error) {
      console.error(`Error processing ${sectionName} section:`, error);
      return { items: [], section: sectionName, error: error.message };
    }
  }

  // Main parallel processing function
  async processOrderImage(imagePath) {
    console.log('🚀 Starting parallel OCR processing...');
    const startTime = Date.now();
    
    // Check cache first
    const imageHash = await this.getImageHash(imagePath);
    const cached = await this.getCachedResult(imageHash);
    if (cached) {
      console.log('📦 Using cached result');
      return cached;
    }

    try {
      // Step 1: Preprocess image
      console.log('📸 Preprocessing image...');
      const processedPath = `${imagePath}_processed.jpg`;
      await this.preprocessImage(imagePath, processedPath);

      // Step 2: Split into left/right halves
      console.log('✂️ Splitting image into halves...');
      const { leftPath, rightPath } = await this.splitImage(processedPath);

      // Step 3: Process both halves in parallel
      console.log('⚡ Processing both halves in parallel...');
      const [leftResult, rightResult] = await Promise.all([
        this.processImageSection(leftPath, 'left'),
        this.processImageSection(rightPath, 'right')
      ]);

      // Step 4: Merge results
      console.log('🔗 Merging results...');
      const mergedResult = {
        timestamp: new Date().toISOString(),
        processing_time_ms: Date.now() - startTime,
        sections: {
          left: leftResult,
          right: rightResult
        },
        merged_items: [
          ...leftResult.items,
          ...rightResult.items
        ],
        total_items: leftResult.items.length + rightResult.items.length,
        summary: {
          total_quantity: 0,
          total_value: 0,
          unique_products: 0
        }
      };

      // Calculate summary
      const productMap = new Map();
      mergedResult.merged_items.forEach(item => {
        mergedResult.summary.total_quantity += item.quantity || 0;
        mergedResult.summary.total_value += item.total_price || 0;
        productMap.set(item.product_name, true);
      });
      mergedResult.summary.unique_products = productMap.size;

      // Step 5: Cleanup temporary files
      await this.cleanup([processedPath, leftPath, rightPath]);

      // Step 6: Cache result
      await this.saveToCache(imageHash, mergedResult);

      console.log(`✅ Processing completed in ${mergedResult.processing_time_ms}ms`);
      console.log(`📊 Extracted ${mergedResult.total_items} items from both sections`);
      
      return mergedResult;

    } catch (error) {
      console.error('❌ Error in parallel processing:', error);
      throw error;
    }
  }

  // Cleanup temporary files
  async cleanup(filePaths) {
    for (const filePath of filePaths) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }

  // Batch process multiple images
  async processBatch(imagePaths) {
    console.log(`🔄 Processing batch of ${imagePaths.length} images...`);
    
    const results = await Promise.allSettled(
      imagePaths.map(imagePath => this.processOrderImage(imagePath))
    );

    return results.map((result, index) => ({
      imagePath: imagePaths[index],
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }));
  }
}

// Export for use in other modules
export default ParallelOCRProcessor;

// CLI usage example
if (import.meta.url === `file://${process.argv[1]}`) {
  const processor = new ParallelOCRProcessor(process.env.OPENAI_API_KEY);
  
  if (process.argv.length < 3) {
    console.log('Usage: node parallelOCR.js <image_path>');
    process.exit(1);
  }
  
  const imagePath = process.argv[2];
  
  processor.processOrderImage(imagePath)
    .then(result => {
      console.log('\n📋 Final Result:');
      console.log(JSON.stringify(result, null, 2));
    })
    .catch(error => {
      console.error('❌ Processing failed:', error);
      process.exit(1);
    });
}
