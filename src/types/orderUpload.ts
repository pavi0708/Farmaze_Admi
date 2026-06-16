// Order Upload Types
// Senior Frontend Engineer Implementation

export type UploadedOrderSourceType = 'TEXT' | 'DOCUMENT';
export type UploadedOrderStatus = 'PENDING_REVIEW' | 'CONVERTED_TO_ORDER' | 'REJECTED';

export interface UploadedOrder {
  id: string;
  client_id: string;
  raw_text?: string;
  document_url?: string;
  file_name?: string;
  file_size?: number;
  content_type?: string;
  s3_key?: string;
  source_type: UploadedOrderSourceType;
  status: UploadedOrderStatus;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface UploadedOrderWithClientInfo extends UploadedOrder {
  client_name?: string;
  client_email?: string;
  preview: string;
}

// API Request Types
export interface TextOrderUploadRequest {
  client_id: string;
  raw_text: string;
  uploaded_by: string;
  order_date?: string; // Optional order date in YYYY-MM-DD format
}

// Note: DocumentOrderUploadRequest is not needed because the backend
// extracts client_id and uploaded_by from JWT token, not from form data.
// Document uploads only send the file via FormData.

// API Response Types
export interface OrderUploadResponse {
  success: boolean;
  uploaded_order_id: string;
  status: string;
  message: string;
  document_url?: string;
}

export interface UploadErrorResponse {
  success: false;
  error: string;
  code?: string;
}

// Component Props Types
export interface TextOrderUploadProps {
  onUploadSuccess: (response: OrderUploadResponse) => void;
  onUploadError: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

export interface DocumentOrderUploadProps {
  onUploadSuccess: (response: OrderUploadResponse) => void;
  onUploadError: (error: string) => void;
  disabled?: boolean;
  className?: string;
  acceptedFileTypes?: string[];
  maxFileSize?: number; // in bytes
}

export interface OrderUploadSectionProps {
  onUploadSuccess?: (response: OrderUploadResponse) => void;
  className?: string;
  showTextUpload?: boolean;
  showDocumentUpload?: boolean;
}

// Validation Types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface FileValidationResult extends ValidationResult {
  file?: File;
  fileInfo?: {
    name: string;
    size: number;
    type: string;
    lastModified: number;
  };
}

// Upload State Types
export type UploadState = 'idle' | 'uploading' | 'success' | 'error';

export interface UploadProgress {
  state: UploadState;
  progress?: number; // 0-100
  message?: string;
  error?: string;
}

// Constants
export const ALLOWED_FILE_TYPES = {
  'application/pdf': '.pdf',
  'image/jpeg': '.jpg,.jpeg',
  'image/jpg': '.jpg',
  'image/png': '.png',
} as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_TEXT_LENGTH = 10000; // 10KB

export const UPLOAD_ERROR_CODES = {
  AUTH_ERROR: 'Authentication required',
  CLIENT_ACCESS_REQUIRED: 'Client access required',
  VALIDATION_ERROR: 'Invalid input data',
  FILE_VALIDATION_ERROR: 'Invalid file',
  FILE_PROCESSING_ERROR: 'File processing failed',
  CLIENT_NOT_FOUND: 'Client not found',
  CLIENT_INACTIVE: 'Client account inactive',
  DATABASE_ERROR: 'Server error occurred',
  STORAGE_ERROR: 'File upload failed',
  NETWORK_ERROR: 'Network connection failed',
} as const;

// Utility Types
export type UploadErrorCode = keyof typeof UPLOAD_ERROR_CODES;

export interface ApiError {
  message: string;
  code?: UploadErrorCode;
  details?: any;
}

// Form State Types
export interface TextUploadFormState {
  rawText: string;
  isValid: boolean;
  errors: string[];
  isDirty: boolean;
}

export interface DocumentUploadFormState {
  selectedFile: File | null;
  dragActive: boolean;
  isValid: boolean;
  errors: string[];
  preview?: string;
}
