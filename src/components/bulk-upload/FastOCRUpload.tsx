import React, { useState, useCallback } from 'react';
import { Upload, Zap, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import FastOCRParser from '@/utils/fastOCR.js';

interface FastOCRUploadProps {
  onOrderExtracted: (items: any[]) => void;
  onError: (error: string) => void;
}

const FastOCRUpload: React.FC<FastOCRUploadProps> = ({ onOrderExtracted, onError }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [ocrResult, setOcrResult] = useState<any>(null);

  const fastOCR = new FastOCRParser(import.meta.env.VITE_OPENAI_API_KEY);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      onError('Please select a valid image file (JPG, PNG, etc.)');
      return;
    }

    setUploadedFile(file);
    setOcrResult(null);
  }, [onError]);

  const processImage = async () => {
    if (!uploadedFile) return;

    setIsProcessing(true);

    try {
      const result = await fastOCR.parseOrderImage(uploadedFile);
      setOcrResult(result);

      // Format for order creation
      const orderItems = fastOCR.formatForOrder(result);
      onOrderExtracted(orderItems);

    } catch (error) {
      console.error('Fast OCR failed:', error);
      onError(`OCR processing failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetUpload = () => {
    setUploadedFile(null);
    setOcrResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Fast OCR Parser
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* File Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="fast-ocr-upload"
                disabled={isProcessing}
              />
              <label htmlFor="fast-ocr-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium">Upload Order Image</p>
                <p className="text-sm text-gray-500">
                  Single image processing - instant results
                </p>
              </label>
            </div>

            {/* Uploaded File */}
            {uploadedFile && (
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">{uploadedFile.name}</span>
                <span className="text-xs text-gray-500">
                  ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
            )}

            {/* Process Button */}
            <div className="flex gap-2">
              <Button
                onClick={processImage}
                disabled={!uploadedFile || isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Extract Products
                  </>
                )}
              </Button>
              
              {uploadedFile && (
                <Button variant="outline" onClick={resetUpload} disabled={isProcessing}>
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {ocrResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Extraction Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center p-3 bg-blue-50 rounded">
                  <div className="font-bold text-lg">{ocrResult.total_products}</div>
                  <div className="text-gray-600">Total Products</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded">
                  <div className="font-bold text-lg">{ocrResult.products_with_quantity}</div>
                  <div className="text-gray-600">With Quantities</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded">
                  <div className="font-bold text-lg">{ocrResult.processing_time_ms}ms</div>
                  <div className="text-gray-600">Processing Time</div>
                </div>
              </div>

              {/* Product List Preview */}
              <div className="max-h-60 overflow-y-auto border rounded p-3">
                <h4 className="font-medium mb-2">Extracted Products:</h4>
                <div className="space-y-1 text-sm">
                  {ocrResult.products.slice(0, 10).map((product: any, index: number) => (
                    <div key={index} className="flex justify-between">
                      <span>{product.name}</span>
                      <span className="text-gray-500">
                        {product.quantity > 0 ? `${product.quantity} ${product.unit}` : 'No qty'}
                      </span>
                    </div>
                  ))}
                  {ocrResult.products.length > 10 && (
                    <div className="text-gray-500 text-center pt-2">
                      ... and {ocrResult.products.length - 10} more products
                    </div>
                  )}
                </div>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Successfully extracted {ocrResult.products_with_quantity} products with quantities. 
                  Ready to create order!
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Speed Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">⚡ Fast OCR Features</CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-1">
          <p>• Direct GPT-4 Vision processing - no image preprocessing</p>
          <p>• Single API call - no parallel splitting overhead</p>
          <p>• Optimized for speed - typically under 10 seconds</p>
          <p>• Handles complex table structures automatically</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default FastOCRUpload;
