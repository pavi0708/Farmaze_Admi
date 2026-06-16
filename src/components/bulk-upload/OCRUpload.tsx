import React, { useState, useCallback } from 'react';
import { Upload, Image, CheckCircle, AlertCircle, Loader2, Split } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import OCRIntegration, { OCRResult, OCRItem } from '@/utils/ocrIntegration';

interface OCRUploadProps {
  onOrderExtracted: (items: any[]) => void;
  onError: (error: string) => void;
}

const OCRUpload: React.FC<OCRUploadProps> = ({ onOrderExtracted, onError }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [ocrResults, setOcrResults] = useState<OCRResult[]>([]);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  const ocrIntegration = new OCRIntegration();

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      onError('Please select valid image files (JPG, PNG, etc.)');
      return;
    }

    setUploadedFiles(imageFiles);
    setOcrResults([]);
  }, [onError]);

  const processImages = async () => {
    if (uploadedFiles.length === 0) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setCurrentStep('Initializing OCR processing...');

    try {
      const results: OCRResult[] = [];
      
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        setCurrentStep(`Processing ${file.name} (${i + 1}/${uploadedFiles.length})`);
        setProcessingProgress((i / uploadedFiles.length) * 90);

        const result = await ocrIntegration.processOrderImage(file);
        results.push(result);
      }

      setCurrentStep('Merging results...');
      setProcessingProgress(95);

      // Merge all results
      const allItems: OCRItem[] = [];
      results.forEach(result => {
        allItems.push(...result.merged_items);
      });

      // Validate results
      const validation = ocrIntegration.validateOCRResult(allItems);
      if (!validation.valid) {
        onError(`Validation failed: ${validation.errors.join(', ')}`);
        return;
      }

      // Convert to order format
      const orderItems = ocrIntegration.convertToOrderFormat({ 
        merged_items: allItems 
      } as OCRResult);

      setOcrResults(results);
      setCurrentStep('Complete!');
      setProcessingProgress(100);

      // Pass to parent component
      onOrderExtracted(orderItems);

    } catch (error) {
      console.error('OCR processing failed:', error);
      onError(`OCR processing failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetUpload = () => {
    setUploadedFiles([]);
    setOcrResults([]);
    setProcessingProgress(0);
    setCurrentStep('');
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Split className="h-5 w-5" />
            Parallel OCR Processing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* File Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="ocr-upload"
                disabled={isProcessing}
              />
              <label htmlFor="ocr-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium">Upload Order Images</p>
                <p className="text-sm text-gray-500">
                  Select multiple images for batch processing
                </p>
              </label>
            </div>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Uploaded Files:</h4>
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <Image className="h-4 w-4" />
                    <span className="text-sm">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Process Button */}
            <div className="flex gap-2">
              <Button
                onClick={processImages}
                disabled={uploadedFiles.length === 0 || isProcessing}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Split className="h-4 w-4 mr-2" />
                    Process with Parallel OCR
                  </>
                )}
              </Button>
              
              {uploadedFiles.length > 0 && (
                <Button variant="outline" onClick={resetUpload} disabled={isProcessing}>
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processing Progress */}
      {isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{currentStep}</span>
                <span>{processingProgress}%</span>
              </div>
              <Progress value={processingProgress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      {ocrResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              OCR Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ocrResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">Image {index + 1}</h4>
                    <span className="text-xs text-gray-500">
                      {result.processing_time_ms}ms
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Items:</span> {result.total_items}
                    </div>
                    <div>
                      <span className="font-medium">Products:</span> {result.summary.unique_products}
                    </div>
                    <div>
                      <span className="font-medium">Total Value:</span> ₹{result.summary.total_value.toFixed(2)}
                    </div>
                  </div>

                  {/* Section Breakdown */}
                  <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-blue-50 p-2 rounded">
                      <div className="font-medium">Left Section</div>
                      <div>{result.sections.left.items.length} items</div>
                    </div>
                    <div className="bg-green-50 p-2 rounded">
                      <div className="font-medium">Right Section</div>
                      <div>{result.sections.right.items.length} items</div>
                    </div>
                  </div>
                </div>
              ))}

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Successfully processed {ocrResults.length} image(s) using parallel OCR. 
                  Total items extracted: {ocrResults.reduce((sum, r) => sum + r.total_items, 0)}
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">⚡ Performance Tips</CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-1">
          <p>• Images are automatically resized to 1200px width for faster processing</p>
          <p>• Each image is split into left/right halves and processed in parallel</p>
          <p>• Results are cached to avoid reprocessing identical images</p>
          <p>• Uses GPT-4o-mini with structured JSON schema for speed and accuracy</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default OCRUpload;
