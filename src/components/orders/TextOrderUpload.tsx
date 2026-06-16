// Text Order Upload Component
// Senior Frontend Engineer Implementation

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/date-picker';
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Info,
  X,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';

import { 
  uploadTextOrder, 
  validateTextContent, 
  getErrorMessage,
  type ProgressCallback,
  type ApiError 
} from '@/api/orderUploadApi';
import { 
  TextOrderUploadProps, 
  UploadState, 
  OrderUploadResponse 
} from '@/types/orderUpload';

interface TextOrderUploadState {
  rawText: string;
  uploadState: UploadState;
  progress: number;
  error: string | null;
  validationErrors: string[];
  isDirty: boolean;
  characterCount: number;
  lineCount: number;
  orderDate: Date | undefined;
}

const INITIAL_STATE: TextOrderUploadState = {
  rawText: '',
  uploadState: 'idle',
  progress: 0,
  error: null,
  validationErrors: [],
  isDirty: false,
  characterCount: 0,
  lineCount: 0,
  orderDate: undefined,
};

const EXAMPLE_TEXT = `Tomato 2kg
Onion 1kg
Chilli 500g
Potato 3kg`;

export const TextOrderUpload: React.FC<TextOrderUploadProps> = ({
  onUploadSuccess,
  onUploadError,
  disabled = false,
  className = '',
}) => {
  const [state, setState] = useState<TextOrderUploadState>(INITIAL_STATE);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Update character and line counts
  const updateCounts = useCallback((text: string) => {
    const characterCount = text.length;
    const lineCount = text.split('\n').filter(line => line.trim()).length;
    return { characterCount, lineCount };
  }, []);

  // Handle text change with validation
  const handleTextChange = useCallback((value: string) => {
    const counts = updateCounts(value);
    const validation = validateTextContent(value);
    
    setState(prev => ({
      ...prev,
      rawText: value,
      isDirty: true,
      validationErrors: validation.errors,
      error: null,
      ...counts,
    }));
  }, [updateCounts]);

  // Handle upload progress
  const handleProgress: ProgressCallback = useCallback((progress: number) => {
    setState(prev => ({ ...prev, progress }));
  }, []);

  // Handle upload
  const handleUpload = useCallback(async () => {
    if (disabled || state.uploadState === 'uploading') return;

    const validation = validateTextContent(state.rawText);
    if (!validation.isValid) {
      setState(prev => ({
        ...prev,
        validationErrors: validation.errors,
        error: 'Please fix the validation errors before uploading.',
      }));
      return;
    }

    // Create abort controller for this upload
    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      uploadState: 'uploading',
      progress: 0,
      error: null,
      validationErrors: [],
    }));

    try {
      // Format order date if provided
      const formattedOrderDate = state.orderDate ? state.orderDate.toISOString().split('T')[0] : undefined;
      const response = await uploadTextOrder(state.rawText, handleProgress, formattedOrderDate);
      
      setState(prev => ({
        ...prev,
        uploadState: 'success',
        progress: 100,
      }));

      // Show success toast
      toast.success('Order uploaded successfully!', {
        description: 'Your order is now pending admin review.',
        duration: 5000,
      });

      // Call success callback
      onUploadSuccess(response);

      // Reset form after success
      setTimeout(() => {
        setState(INITIAL_STATE);
      }, 2000);

    } catch (error) {
      const apiError = error as ApiError;
      const errorMessage = getErrorMessage(apiError);

      setState(prev => ({
        ...prev,
        uploadState: 'error',
        progress: 0,
        error: errorMessage,
      }));

      // Show error toast
      toast.error('Upload failed', {
        description: errorMessage,
        duration: 5000,
      });

      // Call error callback
      onUploadError(errorMessage);
    } finally {
      abortControllerRef.current = null;
    }
  }, [state.rawText, disabled, state.uploadState, handleProgress, onUploadSuccess, onUploadError]);

  // Handle cancel upload
  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    setState(prev => ({
      ...prev,
      uploadState: 'idle',
      progress: 0,
    }));
  }, []);

  // Handle clear text
  const handleClear = useCallback(() => {
    setState(INITIAL_STATE);
    textareaRef.current?.focus();
  }, []);

  // Handle example text
  const handleUseExample = useCallback(() => {
    handleTextChange(EXAMPLE_TEXT);
    textareaRef.current?.focus();
  }, [handleTextChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const isUploading = state.uploadState === 'uploading';
  const isSuccess = state.uploadState === 'success';
  const hasError = state.uploadState === 'error' || state.error;
  const hasValidationErrors = state.validationErrors.length > 0;
  const canUpload = state.rawText.trim() && !hasValidationErrors && !isUploading && !disabled;

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg">Text Order Upload</CardTitle>
          {isSuccess && <CheckCircle className="h-5 w-5 text-green-600" />}
        </div>
        <CardDescription>
          Type or paste your order details. Each line should contain a product with quantity.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Example and Clear buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUseExample}
            disabled={isUploading}
            className="text-xs"
          >
            <Info className="h-3 w-3 mr-1" />
            Use Example
          </Button>
          
          {state.isDirty && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={isUploading}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Text area */}
        <div className="space-y-2">
          <Textarea
            ref={textareaRef}
            placeholder="Enter your order details here...&#10;&#10;Example:&#10;Tomato 2kg&#10;Onion 1kg&#10;Chilli 500g"
            value={state.rawText}
            onChange={(e) => handleTextChange(e.target.value)}
            disabled={isUploading || disabled}
            className={`min-h-[120px] resize-y ${
              hasValidationErrors ? 'border-red-300 focus:border-red-500' : ''
            } ${isSuccess ? 'border-green-300' : ''}`}
            maxLength={10000}
          />
          
          {/* Character and line count */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span>{state.characterCount}/10,000 characters</span>
              <span>{state.lineCount} lines</span>
            </div>
            
            {state.characterCount > 9000 && (
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                Approaching limit
              </Badge>
            )}
          </div>
        </div>

        {/* Order Date Selection */}
        <div className="space-y-2">
          <Label htmlFor="order-date" className="text-sm font-medium">
            <Calendar className="inline mr-2 h-4 w-4" />
            Order Date (Optional)
          </Label>
          <DatePicker
            date={state.orderDate}
            onDateChange={(date) => setState(prev => ({ ...prev, orderDate: date }))}
            placeholder="Select order date"
            minDate={new Date()}
            maxDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)} // 30 days from now
            disabled={isUploading || disabled}
            className="w-full"
          />
          {state.orderDate && (
            <p className="text-xs text-gray-500">
              Order will be placed for {state.orderDate.toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Validation errors */}
        {hasValidationErrors && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {state.validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Upload error */}
        {hasError && state.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        {/* Success message */}
        {isSuccess && (
          <Alert className="border-green-300 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Order uploaded successfully! It's now pending admin review.
            </AlertDescription>
          </Alert>
        )}

        {/* Progress bar */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Uploading...</span>
              <span className="text-gray-600">{state.progress}%</span>
            </div>
            <Progress value={state.progress} className="w-full" />
          </div>
        )}

        {/* Upload button */}
        <div className="flex items-center gap-2">
          <Button
            onClick={handleUpload}
            disabled={!canUpload}
            className="flex-1"
            size="lg"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Uploaded
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Text Order
              </>
            )}
          </Button>

          {isUploading && (
            <Button
              variant="outline"
              onClick={handleCancel}
              size="lg"
            >
              Cancel
            </Button>
          )}
        </div>

        {/* Help text */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>💡 <strong>Tips:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>Each line should contain one product</li>
            <li>Include quantity and unit (e.g., "Tomato 2kg")</li>
            <li>You can copy-paste from other documents</li>
            <li>Maximum 10,000 characters allowed</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default TextOrderUpload;
