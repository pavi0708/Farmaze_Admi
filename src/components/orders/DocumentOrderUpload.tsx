// Document Order Upload Component
// Senior Frontend Engineer Implementation

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  FileImage, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  X,
  Eye,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

import { 
  uploadDocumentOrder, 
  validateFile, 
  formatFileSize, 
  getFileTypeIcon,
  createFilePreview,
  getErrorMessage,
  type ProgressCallback,
  type ApiError 
} from '@/api/orderUploadApi';
import { 
  DocumentOrderUploadProps, 
  UploadState, 
  OrderUploadResponse 
} from '@/types/orderUpload';

interface DocumentUploadState {
  selectedFile: File | null;
  uploadState: UploadState;
  progress: number;
  error: string | null;
  validationErrors: string[];
  dragActive: boolean;
  preview: string | null;
  uploadedUrl: string | null;
}

const INITIAL_STATE: DocumentUploadState = {
  selectedFile: null,
  uploadState: 'idle',
  progress: 0,
  error: null,
  validationErrors: [],
  dragActive: false,
  preview: null,
  uploadedUrl: null,
};

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const DocumentOrderUpload: React.FC<DocumentOrderUploadProps> = ({
  onUploadSuccess,
  onUploadError,
  disabled = false,
  className = '',
  acceptedFileTypes = ACCEPTED_TYPES,
  maxFileSize = MAX_FILE_SIZE,
}) => {
  const [state, setState] = useState<DocumentUploadState>(INITIAL_STATE);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    const validation = validateFile(file);
    let preview: string | null = null;

    // Create preview for images
    if (file.type.startsWith('image/')) {
      try {
        preview = await createFilePreview(file);
      } catch (error) {
        console.warn('Failed to create file preview:', error);
      }
    }

    setState(prev => ({
      ...prev,
      selectedFile: file,
      validationErrors: validation.errors,
      error: null,
      preview,
      uploadState: 'idle',
      progress: 0,
    }));
  }, []);

  // Handle file input change
  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // Handle drag and drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setState(prev => ({ ...prev, dragActive: true }));
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState(prev => ({ ...prev, dragActive: false }));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState(prev => ({ ...prev, dragActive: false }));

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (file) {
      handleFileSelect(file);
    }
  }, [disabled, handleFileSelect]);

  // Handle upload progress
  const handleProgress: ProgressCallback = useCallback((progress: number) => {
    setState(prev => ({ ...prev, progress }));
  }, []);

  // Handle upload
  const handleUpload = useCallback(async () => {
    if (!state.selectedFile || disabled || state.uploadState === 'uploading') return;

    const validation = validateFile(state.selectedFile);
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
      const response = await uploadDocumentOrder(state.selectedFile, handleProgress);
      
      setState(prev => ({
        ...prev,
        uploadState: 'success',
        progress: 100,
        uploadedUrl: response.document_url || null,
      }));

      // Show success toast
      toast.success('Document uploaded successfully!', {
        description: 'Your order document is now pending admin review.',
        duration: 5000,
      });

      // Call success callback
      onUploadSuccess(response);

      // Reset form after success (but keep the uploaded file info for a bit)
      setTimeout(() => {
        setState(INITIAL_STATE);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 3000);

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
  }, [state.selectedFile, disabled, state.uploadState, handleProgress, onUploadSuccess, onUploadError]);

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

  // Handle remove file
  const handleRemoveFile = useCallback(() => {
    setState(INITIAL_STATE);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Handle browse files
  const handleBrowseFiles = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Cleanup preview URL
      if (state.preview) {
        URL.revokeObjectURL(state.preview);
      }
    };
  }, [state.preview]);

  const isUploading = state.uploadState === 'uploading';
  const isSuccess = state.uploadState === 'success';
  const hasError = state.uploadState === 'error' || state.error;
  const hasValidationErrors = state.validationErrors.length > 0;
  const canUpload = state.selectedFile && !hasValidationErrors && !isUploading && !disabled;

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileImage className="h-5 w-5 text-purple-600" />
          <CardTitle className="text-lg">Document Order Upload</CardTitle>
          {isSuccess && <CheckCircle className="h-5 w-5 text-green-600" />}
        </div>
        <CardDescription>
          Upload order documents (PDF, JPG, PNG). Maximum file size: 10MB.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFileTypes.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled || isUploading}
        />

        {/* Drop zone or file display */}
        {!state.selectedFile ? (
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
              ${state.dragActive ? 'border-purple-400 bg-purple-50' : 'border-gray-300 hover:border-gray-400'}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleBrowseFiles}
          >
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Upload className="h-6 w-6 text-purple-600" />
              </div>
              
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Drop your file here, or <span className="text-purple-600">browse</span>
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Supports PDF, JPG, PNG up to 10MB
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="border rounded-lg p-4 space-y-4">
            {/* File info */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {state.selectedFile.type === 'application/pdf' ? (
                  <FileText className="h-8 w-8 text-red-600" />
                ) : (
                  <FileImage className="h-8 w-8 text-blue-600" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {state.selectedFile.name}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>{formatFileSize(state.selectedFile.size)}</span>
                  <span>{state.selectedFile.type}</span>
                </div>
                
                {/* File status badges */}
                <div className="flex items-center gap-2 mt-2">
                  {isSuccess && (
                    <Badge className="bg-green-100 text-green-800 border-green-300">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Uploaded
                    </Badge>
                  )}
                  {hasValidationErrors && (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Invalid
                    </Badge>
                  )}
                </div>
              </div>

              {!isUploading && !isSuccess && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Image preview */}
            {state.preview && (
              <div className="mt-4">
                <div className="relative inline-block">
                  <img
                    src={state.preview}
                    alt="Preview"
                    className="max-w-full max-h-48 rounded-lg border"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-black/50 text-white">
                      Preview
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

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
              Document uploaded successfully! It's now pending admin review.
              {state.uploadedUrl && (
                <div className="mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(state.uploadedUrl!, '_blank')}
                    className="text-xs"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View Document
                  </Button>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Progress bar */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Uploading document...</span>
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
                Upload Document
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

          {!state.selectedFile && !isUploading && (
            <Button
              variant="outline"
              onClick={handleBrowseFiles}
              size="lg"
            >
              Browse Files
            </Button>
          )}
        </div>

        {/* Help text */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>📎 <strong>Supported formats:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>PDF documents (.pdf)</li>
            <li>Images: JPG, JPEG, PNG</li>
            <li>Maximum file size: 10MB</li>
            <li>Drag and drop or click to browse</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentOrderUpload;
