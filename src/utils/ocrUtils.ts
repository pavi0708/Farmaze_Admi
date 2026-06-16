// OCR utility for extracting text from order images
// Uses the analytics backend (Claude Vision) instead of Supabase + OpenAI

import { analyticsAxios } from '@/api/analyticsAxios';

/**
 * Extract text from an order image using Claude Vision via analytics backend.
 *
 * @param file - Image file (JPG, PNG, WebP)
 * @returns Extracted text with one product per line in "ProductName QuantityUnit" format
 */
export async function extractTextFromImage(file: File): Promise<string> {
  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Only JPG, PNG, and WebP images are supported for OCR');
  }

  // Validate file size (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image must be under 10MB');
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await analyticsAxios.post(
    '/api/v1/analytics/ocr/extract-text',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000, // 60s timeout for vision model
    }
  );

  const extractedText = response.data?.extracted_text?.trim();

  if (!extractedText) {
    throw new Error('No text could be extracted from the image');
  }

  return extractedText;
}

/**
 * Check if a file is an image (supported for OCR)
 */
export function isImageFile(file: File): boolean {
  return ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type);
}

/**
 * Check if a file is a PDF
 */
export function isPDFFile(file: File): boolean {
  return file.type === 'application/pdf';
}
