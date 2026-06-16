// Shared matching utilities extracted from TextImportTab and OCRUploadTab

import analyticsApi from '@/api/analyticsApi';
import type { MatchedProduct } from './types';

/**
 * Transform the analytics API processTextOrder response into MatchedProduct[] format.
 * Shared by TextImportTab, OCRUploadTab, and AddItemsBar.
 */
export function transformApiResponse(
  apiResponse: Awaited<ReturnType<typeof analyticsApi.processTextOrder>>,
  idPrefix: string = 'matched'
): MatchedProduct[] {
  const items: MatchedProduct[] = [];

  if (apiResponse.matchedItems) {
    apiResponse.matchedItems.forEach((item, idx) => {
      items.push({
        id: `${idPrefix}-${idx}`,
        inputText: `${item.productName} ${item.quantity}${item.unit}`,
        matchedName: item.productName,
        matchedSku: item.sku || null,
        quantity: item.quantity,
        unit: item.unit,
        confidence: 95,
        status: 'matched',
        unitPrice: item.unitPrice,
        productId: item.productId,
      });
    });
  }

  if (apiResponse.unmatchedItems) {
    apiResponse.unmatchedItems.forEach((item, idx) => {
      items.push({
        id: `${idPrefix}-unmatched-${idx}`,
        inputText: item.text,
        matchedName: null,
        matchedSku: null,
        quantity: item.quantity,
        unit: item.unit,
        confidence: 0,
        status: 'unmatched',
      });
    });
  }

  return items;
}

/**
 * Match raw text via the analytics API and return MatchedProduct[] with stats.
 * Used by OCRUploadTab (after OCR extraction) and AddItemsBar text mode.
 */
export async function matchTextViaAPI(
  text: string,
  idPrefix: string = 'matched'
): Promise<{ items: MatchedProduct[]; totalInputLines: number }> {
  const apiResponse = await analyticsApi.processTextOrder(text);
  const items = transformApiResponse(apiResponse, idPrefix);
  const totalInputLines = apiResponse.stats?.totalItems || items.length;
  return { items, totalInputLines };
}
