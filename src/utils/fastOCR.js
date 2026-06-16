import OpenAI from 'openai';

class FastOCRParser {
  constructor(apiKey) {
    this.openai = new OpenAI({ apiKey });
  }

  // Direct vision parsing - no preprocessing, no splitting
  async parseOrderImage(imageFile) {
    console.log('🚀 Starting fast OCR parsing...');
    const startTime = Date.now();

    try {
      // Convert file to base64
      const base64Image = await this.fileToBase64(imageFile);
      
      // Simple JSON schema for speed
      const jsonSchema = {
        type: "object",
        properties: {
          products: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                quantity: { type: "number" },
                unit: { type: "string" }
              },
              required: ["name"]
            }
          }
        },
        required: ["products"]
      };

      // Single API call - no parallel processing overhead
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // Use full GPT-4o for best accuracy
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Extract ALL products from this order sheet. Include:
                - Product name (clean, standardized)
                - Quantity (as number, 0 if missing/dashed)
                - Unit (kg, gm, box, pkt, gaddi, etc.)
                
                Skip empty rows. Return JSON only.`
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
        max_tokens: 3000
      });

      const result = JSON.parse(response.choices[0].message.content);
      const processingTime = Date.now() - startTime;

      console.log(`✅ Fast OCR completed in ${processingTime}ms`);
      console.log(`📊 Extracted ${result.products.length} products`);

      return {
        products: result.products,
        processing_time_ms: processingTime,
        timestamp: new Date().toISOString(),
        total_products: result.products.length,
        products_with_quantity: result.products.filter(p => p.quantity > 0).length
      };

    } catch (error) {
      console.error('❌ Fast OCR failed:', error);
      throw new Error(`OCR parsing failed: ${error.message}`);
    }
  }

  // Convert File to base64
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1]; // Remove data:image/jpeg;base64, prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Format for order creation
  formatForOrder(ocrResult) {
    return ocrResult.products
      .filter(product => product.quantity > 0) // Only include items with quantities
      .map(product => ({
        product_name: product.name,
        quantity: product.quantity,
        unit: product.unit || 'kg',
        notes: `OCR extracted - ${new Date().toLocaleDateString()}`
      }));
  }
}

export default FastOCRParser;
