// Order Tabs Component - Instant AI Matching Version
// 2 tabs: Product Order List + Import Order (instant text matching / image OCR)
// Replaces the old PENDING_REVIEW flow with instant preview + cart integration

import React, { useState, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ShoppingCart,
  Upload,
  Calendar,
  CheckCircle,
  AlertCircle,
  FileUp,
  X,
  Wand2,
  Loader2,
  ImageIcon,
  RotateCcw,
} from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

import OrderListTable from '../products/OrderListTable';
import ProductMatchPreview from './ProductMatchPreview';
import ExtractedTextEditor from './ExtractedTextEditor';
import { useInstantOrder } from '@/hooks/useInstantOrder';
import { useCart } from '@/context/CartContext';
import { isImageFile, isPDFFile } from '@/utils/ocrUtils';
import { uploadDocumentOrder, validateFile } from '@/api/orderUploadApi';
import type { OrderUploadResponse } from '@/types/orderUpload';

interface OrderTabsProps {
  products: any[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onRequestNewProduct: () => void;
  onScanOrder: () => void;
  onScanOrderClick: () => void;
  recommendations: any[];
  showRecommendations: boolean;
  onToggleRecommendations: () => void;
  useRecommendationsAsDefault: boolean;
  allProducts: any[];
  isLoadingAllProducts: boolean;
  onProductAdded: () => void;
  onUploadSuccess?: (response: OrderUploadResponse) => void;
  orderDate?: Date;
  onOrderDateChange?: (date: Date | undefined) => void;
}

export const OrderTabs: React.FC<OrderTabsProps> = ({
  products,
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  onRequestNewProduct,
  onScanOrder,
  onScanOrderClick,
  recommendations,
  showRecommendations,
  onToggleRecommendations,
  useRecommendationsAsDefault,
  allProducts,
  isLoadingAllProducts,
  onProductAdded,
  onUploadSuccess,
  orderDate,
  onOrderDateChange,
}) => {
  const [activeTab, setActiveTab] = useState('product-list');

  // Import Order State
  const [textContent, setTextContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isPdfUploading, setIsPdfUploading] = useState(false);

  // Instant order hook - manages matching state machine
  const {
    step,
    matchResult,
    extractedText,
    error: matchError,
    matchTextOrder,
    processImageOrder,
    matchExtractedText,
    reset: resetInstantOrder,
  } = useInstantOrder(allProducts);

  // Cart integration
  const { addToCart } = useCart();

  const handleFileSelect = (file: File) => {
    const validation = validateFile(file);
    if (!validation.isValid) {
      setLocalError(validation.errors?.[0] || 'Invalid file');
      return;
    }
    setSelectedFile(file);
    setLocalError(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  // Main action: Match products (replaces old handleUpload)
  const handleMatchProducts = async () => {
    const hasText = textContent.trim().length > 0;
    const hasFile = selectedFile !== null;

    if (!hasText && !hasFile) {
      setLocalError('Please paste order text or upload a file');
      return;
    }

    setLocalError(null);

    // Format order date if provided
    const formattedOrderDate = orderDate
      ? orderDate.toISOString().split('T')[0]
      : undefined;

    if (hasText) {
      // Text → instant MCP matching
      await matchTextOrder(textContent, formattedOrderDate);
    } else if (hasFile) {
      if (isImageFile(selectedFile!)) {
        // Image → OCR → edit → matching
        await processImageOrder(selectedFile!);
      } else if (isPDFFile(selectedFile!)) {
        // PDF → fallback to PENDING_REVIEW (seed demo limitation)
        setIsPdfUploading(true);
        try {
          const response = await uploadDocumentOrder(
            selectedFile!,
            () => {},
            formattedOrderDate
          );
          toast.success('PDF sent for admin review', {
            description:
              'PDF orders are reviewed by our team. Image orders (JPG/PNG) get instant matching!',
          });
          setTextContent('');
          setSelectedFile(null);
          onUploadSuccess?.(response);
        } catch (err: any) {
          setLocalError(err.message || 'Upload failed');
          toast.error('Upload failed');
        } finally {
          setIsPdfUploading(false);
        }
      }
    }
  };

  // Handle "Add All to Cart" from ProductMatchPreview
  const handleAddAllToCart = (
    items: Array<{
      product_id: string;
      product_name: string;
      sku: string;
      unit: string;
      price: number;
      quantity: number;
    }>
  ) => {
    items.forEach((item) => {
      addToCart(
        {
          id: item.product_id,
          name: item.product_name,
          unit: item.unit,
          quantity: 0,
          availability: 'in_stock',
          sku: item.sku,
          price: item.price,
        },
        item.quantity
      );
    });

    toast.success(`${items.length} item${items.length > 1 ? 's' : ''} added to cart!`, {
      description: 'Go to Cart to review and place your order.',
      action: {
        label: 'View Cart',
        onClick: () => {
          window.location.href = '/cart';
        },
      },
    });

    // Reset everything
    resetInstantOrder();
    setTextContent('');
    setSelectedFile(null);
  };

  // Handle cancel / start over
  const handleReset = () => {
    resetInstantOrder();
    setLocalError(null);
  };

  // Combined error from local state + hook
  const displayError = localError || matchError;

  // Whether we're in a processing state
  const isProcessing = step === 'matching' || step === 'extracting' || isPdfUploading;

  return (
    <div className="w-full space-y-4">
      {/* Date Picker at top */}
      <div className="flex items-end gap-4">
        <div>
          <Label className="text-sm font-medium mb-2 block">
            <Calendar className="inline mr-2 h-4 w-4" />
            Order Date (Optional)
          </Label>
          <DatePicker
            date={orderDate}
            onDateChange={onOrderDateChange}
            placeholder="Select date"
            className="w-[180px]"
          />
        </div>
        {orderDate && (
          <p className="text-xs text-gray-500 pb-2">
            Order for {orderDate.toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="product-list" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Product Order List
          </TabsTrigger>
          <TabsTrigger value="import-order" className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            Instant Import
          </TabsTrigger>
        </TabsList>

        {/* Product Order List Tab */}
        <TabsContent value="product-list" className="mt-0">
          <OrderListTable
            products={products}
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            selectedCategory={selectedCategory}
            onCategoryChange={onCategoryChange}
            onRequestNewProduct={onRequestNewProduct}
            onScanOrder={onScanOrder}
            onScanOrderClick={onScanOrderClick}
            recommendations={recommendations}
            showRecommendations={showRecommendations}
            onToggleRecommendations={onToggleRecommendations}
            useRecommendationsAsDefault={useRecommendationsAsDefault}
            allProducts={allProducts}
            isLoadingAllProducts={isLoadingAllProducts}
            onProductAdded={onProductAdded}
          />
        </TabsContent>

        {/* Import Order Tab — Instant AI Matching */}
        <TabsContent value="import-order" className="mt-0">
          {/* STATE: Preview — show matched products table */}
          {step === 'preview' && matchResult && (
            <ProductMatchPreview
              matchResult={matchResult}
              onAddToCart={handleAddAllToCart}
              onCancel={handleReset}
            />
          )}

          {/* STATE: Editing OCR — show extracted text for user review */}
          {step === 'editing_ocr' && (
            <ExtractedTextEditor
              extractedText={extractedText}
              onConfirm={(editedText) => {
                const formattedOrderDate = orderDate
                  ? orderDate.toISOString().split('T')[0]
                  : undefined;
                matchExtractedText(editedText, formattedOrderDate);
              }}
              onCancel={handleReset}
            />
          )}

          {/* STATE: Processing — show spinner */}
          {(step === 'matching' || step === 'extracting') && (
            <Card>
              <CardContent className="p-12 flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 text-green-600 animate-spin" />
                <div className="text-center">
                  <p className="font-medium text-lg">
                    {step === 'extracting'
                      ? 'Extracting text from image...'
                      : 'Matching products...'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {step === 'extracting'
                      ? 'Using AI to read your order image'
                      : 'Finding the best product matches for your order'}
                  </p>
                </div>

                {/* Step indicators */}
                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    variant={step === 'extracting' ? 'default' : 'outline'}
                    className={
                      step === 'extracting'
                        ? 'bg-green-600'
                        : step === 'matching'
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : ''
                    }
                  >
                    {step === 'extracting' ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    )}
                    1. Extract
                  </Badge>
                  <span className="text-gray-300">→</span>
                  <Badge
                    variant={step === 'matching' ? 'default' : 'outline'}
                    className={step === 'matching' ? 'bg-green-600' : ''}
                  >
                    {step === 'matching' ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : null}
                    2. Match
                  </Badge>
                  <span className="text-gray-300">→</span>
                  <Badge variant="outline">3. Preview</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STATE: Error — show error with retry */}
          {step === 'error' && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {matchError || 'Something went wrong. Please try again.'}
                  </AlertDescription>
                </Alert>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleReset}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STATE: Idle — show input form (text paste / file upload) */}
          {step === 'idle' && (
            <Card>
              <CardContent className="p-6 space-y-6">
                {/* Header hint */}
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-green-50 rounded-lg p-3 border border-green-100">
                  <Wand2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>
                    Paste your order text or upload an image — AI will instantly
                    match products for you. No waiting for admin review!
                  </span>
                </div>

                {/* Text Input Section */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Paste Order Text</Label>
                  <Textarea
                    placeholder="Paste your order here...&#10;Example:&#10;Tomato 2kg&#10;Onion 1bag&#10;Potato 3box"
                    value={textContent}
                    onChange={(e) => {
                      setTextContent(e.target.value);
                      setLocalError(null);
                    }}
                    className="min-h-[120px]"
                    disabled={selectedFile !== null}
                  />
                </div>

                {/* OR Divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 border-t border-gray-200"></div>
                  <span className="text-sm text-gray-500 font-medium">OR</span>
                  <div className="flex-1 border-t border-gray-200"></div>
                </div>

                {/* File Upload Section */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Upload Order Image
                  </Label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
                      isDragOver
                        ? 'border-green-400 bg-green-50'
                        : selectedFile
                        ? 'border-green-400 bg-green-50'
                        : 'border-gray-300 hover:border-green-400'
                    } ${textContent.trim() ? 'opacity-50 pointer-events-none' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-3">
                        {isImageFile(selectedFile) ? (
                          <ImageIcon className="h-6 w-6 text-green-600" />
                        ) : (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        )}
                        <div className="text-left">
                          <p className="font-medium">{selectedFile.name}</p>
                          <p className="text-sm text-gray-500">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            {isImageFile(selectedFile) && (
                              <span className="text-green-600 ml-2">
                                — Instant AI matching
                              </span>
                            )}
                            {isPDFFile(selectedFile) && (
                              <span className="text-yellow-600 ml-2">
                                — Will be sent for review
                              </span>
                            )}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedFile(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <FileUp className="h-8 w-8 text-gray-400 mx-auto" />
                        <p className="text-sm text-gray-600">
                          Drag & drop or{' '}
                          <button
                            type="button"
                            className="text-green-600 hover:underline"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            browse
                          </button>
                        </p>
                        <p className="text-xs text-gray-400">
                          JPG, PNG (instant AI matching) or PDF (admin review)
                          — max 10MB
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileSelect(file);
                          }}
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Error */}
                {displayError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{displayError}</AlertDescription>
                  </Alert>
                )}

                {/* Match Products Button */}
                <Button
                  onClick={handleMatchProducts}
                  disabled={
                    isProcessing || (!textContent.trim() && !selectedFile)
                  }
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  {isPdfUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading PDF...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Match Products
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrderTabs;
