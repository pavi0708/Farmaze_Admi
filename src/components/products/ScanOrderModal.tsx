import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, Camera, X, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ExtractedProduct {
  name: string;
  quantity: number;
  unit: string;
}

interface SkippedProduct {
  name: string;
  reason: string;
}

interface ExtractedData {
  weight_based?: ExtractedProduct[];
  count_based?: ExtractedProduct[];
  skipped?: SkippedProduct[];
}

interface ScanOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductsExtracted: (products: ExtractedProduct[]) => void;
}

const ScanOrderModal: React.FC<ScanOrderModalProps> = ({
  isOpen,
  onClose,
  onProductsExtracted
}) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedProducts, setExtractedProducts] = useState<ExtractedProduct[]>([]);
  const [extractedData, setExtractedData] = useState<ExtractedData>({});
  const [showResults, setShowResults] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [progressStage, setProgressStage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const handleImageSelect = (file: File) => {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error("Image size must be less than 10MB");
      return;
    }

    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    setShowResults(false);
    setExtractedProducts([]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:image/...;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleScanOrder = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    setProgress(0);
    setProgressMessage('Connecting to processing service...');
    setProgressStage('connecting');
    
    try {
      const imageBase64 = await convertImageToBase64(selectedImage);
      
      // Get the project reference from environment or use a direct URL
      // Replace 'your-project-ref' with your actual Supabase project reference
      const projectRef = 'hidcxkasdmziyfdwmeap'; // This should be your actual project reference
      
      // Create WebSocket connection to streaming function
      const wsUrl = `wss://${projectRef}.functions.supabase.co/functions/v1/scan-order-stream`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setProgressMessage('Connection established, starting scan...');
        setProgress(5);
        
        // Send the image for processing
        ws.send(JSON.stringify({
          type: 'scan_order',
          imageBase64: imageBase64
        }));
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received WebSocket message:', data);
          
          switch (data.type) {
            case 'progress':
              setProgress(data.progress);
              setProgressMessage(data.message);
              setProgressStage(data.stage);
              break;
              
            case 'complete':
              setProgress(100);
              setProgressMessage(data.message);
              setExtractedProducts(data.products);
              setExtractedData({
                weight_based: data.weight_based || [],
                count_based: data.count_based || [],
                skipped: data.skipped || []
              });
              setShowResults(true);
              setIsProcessing(false);
              toast.success(data.message || `Extracted ${data.products.length} products`);
              ws.close();
              break;
              
            case 'error':
              throw new Error(data.message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast.error('Connection error occurred');
        setIsProcessing(false);
      };
      
      ws.onclose = () => {
        console.log('WebSocket connection closed');
        wsRef.current = null;
      };
      
    } catch (error) {
      console.error('Error scanning order:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to scan order');
      setIsProcessing(false);
    }
  };

  const handleAddToCart = () => {
    onProductsExtracted(extractedProducts);
    onClose();
    toast.success(`Added ${extractedProducts.length} products to your list`);
  };

  const handleClose = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setExtractedProducts([]);
    setExtractedData({});
    setShowResults(false);
    setIsProcessing(false);
    setProgress(0);
    setProgressMessage('');
    setProgressStage('');
    // Close WebSocket if open
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Scan Order List
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!imagePreview && (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Upload Order List Image</h3>
              <p className="text-sm text-gray-500 mb-4">
                Take a photo or upload an image of your handwritten order list
              </p>
              <Button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-primary hover:bg-primary/90"
              >
                Select Image
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          )}

          {imagePreview && !showResults && (
            <div className="space-y-4">
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Order list preview" 
                  className="w-full max-h-64 object-contain rounded-lg border"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setImagePreview(null);
                    setSelectedImage(null);
                  }}
                  className="absolute top-2 right-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose Different Image
                </Button>
                <Button
                  onClick={handleScanOrder}
                  disabled={isProcessing}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-2" />
                      Scan Order List
                    </>
                  )}
                </Button>
              </div>
              
              {isProcessing && (
                <div className="space-y-3 p-4 bg-blue-50 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-900">
                      {progressMessage}
                    </span>
                    <span className="text-sm text-blue-600">
                      {progress}%
                    </span>
                  </div>
                  <Progress value={progress} className="w-full" />
                  <div className="text-xs text-blue-700 capitalize">
                    Stage: {progressStage}
                  </div>
                </div>
              )}
            </div>
          )}

          {showResults && extractedProducts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <h3 className="text-lg font-medium">Order Extracted Successfully!</h3>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                <h4 className="font-medium mb-3">Extracted Products ({extractedProducts.length})</h4>
                <div className="space-y-4">
                  {/* Weight-based items */}
                  {extractedData.weight_based && extractedData.weight_based.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-sm text-blue-700 mb-2">Weight-based Items</h5>
                       <div className="space-y-2">
                         {extractedData.weight_based.map((product, index) => (
                           <div key={`weight-${index}`} className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded border border-blue-200">
                             <span className="font-medium">{product.name}</span>
                             <div className="text-right">
                               <span className="text-sm text-blue-700 font-semibold">
                                 {product.quantity} {product.unit}
                               </span>
                               {(product as any).original_unit && (product as any).original_unit !== product.unit && (
                                 <div className="text-xs text-muted-foreground">
                                   (was: {(product as any).original_unit})
                                 </div>
                               )}
                             </div>
                           </div>
                         ))}
                      </div>
                    </div>
                  )}

                   {/* Count-based items */}
                   {extractedData.count_based && extractedData.count_based.length > 0 && (
                     <div>
                       <h5 className="font-semibold text-sm text-green-700 mb-2">Count-based Items</h5>
                       <div className="space-y-2">
                         {extractedData.count_based.map((product, index) => (
                           <div key={`count-${index}`} className="flex justify-between items-center py-2 px-3 bg-green-50 rounded border border-green-200">
                             <span className="font-medium">{product.name}</span>
                             <div className="text-right">
                               <span className="text-sm text-green-700 font-semibold">
                                 {product.quantity} {product.unit}
                               </span>
                               {(product as any).original_unit && (product as any).original_unit !== product.unit && (
                                 <div className="text-xs text-muted-foreground">
                                   (was: {(product as any).original_unit})
                                 </div>
                               )}
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}

                   {/* Skipped items */}
                   {extractedData.skipped && extractedData.skipped.length > 0 && (
                     <div>
                       <h5 className="font-semibold text-sm text-orange-700 mb-2">Skipped Items ({extractedData.skipped.length})</h5>
                       <div className="space-y-2">
                         {extractedData.skipped.map((product, index) => (
                           <div key={`skipped-${index}`} className="flex justify-between items-center py-2 px-3 bg-orange-50 rounded border border-orange-200">
                             <span className="font-medium text-orange-800">{product.name}</span>
                             <span className="text-xs text-orange-600 capitalize">
                               {product.reason.replace('-', ' ')}
                             </span>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowResults(false);
                    setExtractedProducts([]);
                    setExtractedData({});
                  }}
                >
                  Scan Again
                </Button>
                <Button
                  onClick={handleAddToCart}
                  className="bg-primary hover:bg-primary/90"
                >
                  Add to Cart ({extractedProducts.length} items)
                </Button>
              </div>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  );
};

export default ScanOrderModal;