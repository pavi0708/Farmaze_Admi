import ParallelOCRProcessor from './parallelOCR.js';
import { supabase } from '@/integrations/supabase/client';

interface OCRItem {
  product_name: string;
  quantity: number;
  unit: string;
  unit_price?: number;
  total_price?: number;
}

interface OCRResult {
  timestamp: string;
  processing_time_ms: number;
  sections: {
    left: { items: OCRItem[]; section: string };
    right: { items: OCRItem[]; section: string };
  };
  merged_items: OCRItem[];
  total_items: number;
  summary: {
    total_quantity: number;
    total_value: number;
    unique_products: number;
  };
}

class OCRIntegration {
  private processor: ParallelOCRProcessor;

  constructor() {
    // Get OpenAI API key from environment or Supabase
    const apiKey = process.env.OPENAI_API_KEY || this.getOpenAIKeyFromSupabase();
    this.processor = new ParallelOCRProcessor(apiKey);
  }

  private async getOpenAIKeyFromSupabase(): Promise<string> {
    try {
      // This would integrate with your existing credential system
      const { data } = await supabase.functions.invoke('get-client-credentials');
      return data?.openAIKey || '';
    } catch (error) {
      console.error('Failed to get OpenAI key:', error);
      throw new Error('OpenAI API key not available');
    }
  }

  // Process uploaded order image
  async processOrderImage(file: File): Promise<OCRResult> {
    try {
      // Convert File to temporary path for processing
      const tempPath = await this.saveFileTemporarily(file);
      
      // Process with parallel OCR
      const result = await this.processor.processOrderImage(tempPath);
      
      // Cleanup temporary file
      await this.cleanupTempFile(tempPath);
      
      return result;
    } catch (error) {
      console.error('OCR processing failed:', error);
      throw new Error(`OCR processing failed: ${error.message}`);
    }
  }

  // Convert OCR result to order format
  convertToOrderFormat(ocrResult: OCRResult): any[] {
    return ocrResult.merged_items.map(item => ({
      product_name: item.product_name,
      quantity: item.quantity,
      unit: item.unit,
      unit_price: item.unit_price || 0,
      total_price: item.total_price || (item.quantity * (item.unit_price || 0)),
      notes: `Extracted via OCR - ${new Date().toLocaleDateString()}`
    }));
  }

  // Validate OCR results before creating order
  validateOCRResult(items: OCRItem[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    items.forEach((item, index) => {
      if (!item.product_name || item.product_name.trim() === '') {
        errors.push(`Item ${index + 1}: Missing product name`);
      }
      
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Invalid quantity`);
      }
      
      if (!item.unit || item.unit.trim() === '') {
        errors.push(`Item ${index + 1}: Missing unit`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Process multiple images in batch
  async processBatchImages(files: File[]): Promise<OCRResult[]> {
    const tempPaths = await Promise.all(
      files.map(file => this.saveFileTemporarily(file))
    );

    try {
      const results = await this.processor.processBatch(tempPaths);
      return results
        .filter(result => result.success)
        .map(result => result.data);
    } finally {
      // Cleanup all temp files
      await Promise.all(tempPaths.map(path => this.cleanupTempFile(path)));
    }
  }

  private async saveFileTemporarily(file: File): Promise<string> {
    // Implementation would depend on your file handling setup
    // This is a placeholder for the actual file saving logic
    const tempPath = `/tmp/ocr_${Date.now()}_${file.name}`;
    
    // Convert File to buffer and save
    const buffer = await file.arrayBuffer();
    const fs = await import('fs/promises');
    await fs.writeFile(tempPath, Buffer.from(buffer));
    
    return tempPath;
  }

  private async cleanupTempFile(path: string): Promise<void> {
    try {
      const fs = await import('fs/promises');
      await fs.unlink(path);
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

export default OCRIntegration;
export type { OCRResult, OCRItem };
