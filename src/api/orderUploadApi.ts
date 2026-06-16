// Order Upload API Client
// Senior Frontend Engineer Implementation

import { AxiosError, AxiosProgressEvent } from 'axios';
import apiClient from './authApi'; // Import the shared API instance
import {
  TextOrderUploadRequest,
  OrderUploadResponse,
  UploadErrorResponse,
  ApiError,
  UploadErrorCode,
  UPLOAD_ERROR_CODES,
} from '../types/orderUpload';

// Error handling utility
function handleApiError(error: AxiosError): ApiError {
  if (!error.response) {
    return {
      message: 'Network connection failed. Please check your internet connection.',
      code: 'NETWORK_ERROR',
    };
  }

  const { status, data } = error.response;
  const errorData = data as UploadErrorResponse;

  // Map HTTP status codes to user-friendly messages
  switch (status) {
    case 400:
      return {
        message: errorData.error || 'Invalid request. Please check your input.',
        code: (errorData.code as UploadErrorCode) || 'VALIDATION_ERROR',
        details: errorData,
      };
    case 401:
      return {
        message: 'Please log in to upload orders.',
        code: 'AUTH_ERROR',
        details: errorData,
      };
    case 403:
      return {
        message: 'You do not have permission to perform this action.',
        code: 'CLIENT_ACCESS_REQUIRED',
        details: errorData,
      };
    case 404:
      return {
        message: 'Resource not found.',
        code: 'CLIENT_NOT_FOUND',
        details: errorData,
      };
    case 413:
      return {
        message: 'File is too large. Maximum size is 10MB.',
        code: 'FILE_VALIDATION_ERROR',
        details: errorData,
      };
    case 500:
      return {
        message: 'Server error occurred. Please try again later.',
        code: 'DATABASE_ERROR',
        details: errorData,
      };
    default:
      return {
        message: errorData.error || 'An unexpected error occurred.',
        code: 'DATABASE_ERROR',
        details: errorData,
      };
  }
}

// Progress callback type
export type ProgressCallback = (progress: number) => void;

/**
 * Upload text order
 */
export async function uploadTextOrder(
  rawText: string,
  onProgress?: ProgressCallback,
  orderDate?: string
): Promise<OrderUploadResponse> {
  try {
    // Simulate progress for text upload (instantaneous)
    onProgress?.(50);

    const request: Omit<TextOrderUploadRequest, 'client_id' | 'uploaded_by'> = {
      raw_text: rawText.trim(),
      ...(orderDate && { order_date: orderDate })
    };

    const response = await apiClient.post<OrderUploadResponse>(
      '/b2bclients/orders/upload-text',
      request
    );

    onProgress?.(100);
    return response.data;
  } catch (error) {
    onProgress?.(0);
    throw error;
  }
}

/**
 * Upload document order
 * Note: client_id and uploaded_by are extracted from JWT token by backend middleware,
 * so we only need to send the file in FormData
 */
export async function uploadDocumentOrder(
  file: File,
  onProgress?: ProgressCallback,
  orderDate?: string
): Promise<OrderUploadResponse> {
  try {
    const formData = new FormData();
    formData.append('document', file);
    if (orderDate) {
      formData.append('order_date', orderDate);
    }

    const response = await apiClient.post<OrderUploadResponse>(
      '/b2bclients/orders/upload-document',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress?.(progress);
          }
        },
      }
    );

    return response.data;
  } catch (error) {
    onProgress?.(0);
    throw error;
  }
}

/**
 * Validate text content before upload
 */
export function validateTextContent(text: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const trimmedText = text.trim();

  if (!trimmedText) {
    errors.push('Please enter order details');
  } else if (trimmedText.length < 5) {
    errors.push('Order details must be at least 5 characters long');
  } else if (trimmedText.length > 10000) {
    errors.push('Order details must be less than 10,000 characters');
  }

  // Check for at least one product-like entry
  const lines = trimmedText.split('\n').filter(line => line.trim());
  if (lines.length === 0) {
    errors.push('Please enter at least one product');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push('File size must be less than 10MB');
  }

  if (file.size === 0) {
    errors.push('File is empty');
  }

  // Check file type
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  if (!allowedTypes.includes(file.type)) {
    errors.push('Only PDF, JPG, and PNG files are allowed');
  }

  // Check file extension as backup
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
  const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!allowedExtensions.includes(fileExtension)) {
    errors.push('File must have a valid extension (.pdf, .jpg, .jpeg, .png)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file type icon
 */
export function getFileTypeIcon(file: File): string {
  const type = file.type.toLowerCase();
  if (type === 'application/pdf') return '📄';
  if (type.startsWith('image/')) return '🖼️';
  return '📎';
}

/**
 * Create preview URL for image files
 */
export function createFilePreview(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: ApiError): string {
  if (error.code && UPLOAD_ERROR_CODES[error.code]) {
    return UPLOAD_ERROR_CODES[error.code];
  }
  return error.message || 'An unexpected error occurred';
}

// Export types for use in components
export type { ApiError };
