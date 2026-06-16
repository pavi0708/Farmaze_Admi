// useInstantOrder - State machine hook for instant text/image ordering
// Manages the flow: input → OCR (optional) → MCP matching → preview → cart

import { useState, useCallback } from 'react';
import { getMCPClientB2B } from '@/utils/mcpClientB2B';
import { extractTextFromImage } from '@/utils/ocrUtils';
import { matchProducts, parseProductList } from '@/utils/smartOrderUtils';
import analyticsApi from '@/api/analyticsApi';
import type {
  InstantMatchResult,
  ProcessingStep,
} from '@/types/instantOrder';

interface UseInstantOrderReturn {
  step: ProcessingStep;
  matchResult: InstantMatchResult | null;
  extractedText: string;
  error: string | null;
  matchTextOrder: (text: string, deliveryDate?: string) => Promise<void>;
  processImageOrder: (file: File) => Promise<void>;
  matchExtractedText: (editedText: string, deliveryDate?: string) => Promise<void>;
  reset: () => void;
}

/**
 * Convert the structured JSON from MCP response to InstantMatchResult
 */
function parseMCPResponse(responseText: string): InstantMatchResult {
  let data: any;
  try {
    data = JSON.parse(responseText);
  } catch (parseErr) {
    console.error('Failed to parse MCP response as JSON:', responseText?.substring(0, 200));
    throw new Error('Failed to parse matching response');
  }

  // Check for error responses (MCP offline, auth failure, etc.)
  if (data.error) {
    throw new Error(data.error || data.message || 'Matching service unavailable');
  }

  // Structured format from shared-order-utils.ts
  if (data.analysis && data.matched_items) {
    return {
      analysis: data.analysis,
      matched_items: data.matched_items,
      unmatched_items: data.unmatched_items || [],
      display_text: data.display_text,
    };
  }

  console.error('Unexpected MCP response format:', Object.keys(data));
  throw new Error('Unexpected response format from matching service');
}

/**
 * Convert local smartOrderUtils result to InstantMatchResult format
 */
function convertLocalMatchResult(
  localResult: ReturnType<typeof matchProducts>,
  allProducts: any[]
): InstantMatchResult {
  return {
    analysis: {
      total_items: localResult.total_items,
      matched_count: localResult.total_matched,
      unmatched_count: localResult.total_unmatched,
    },
    matched_items: localResult.matched_items.map((item, idx) => ({
      index: idx + 1,
      name: item.parsed.name,
      quantity: item.parsed.quantity,
      unit: item.parsed.unit,
      options: item.matches.map((match, optIdx) => ({
        option_id: optIdx + 1,
        product_id: match.product_id,
        product_name: match.product_name,
        sku: match.sku,
        unit_name: item.parsed.unit,
        unit_price: match.unit_price,
        total_price: match.total_price,
        match_score: Math.round(match.similarity_score * 100),
      })),
      selected_option_id: 1,
    })),
    unmatched_items: localResult.unmatched_items.map((item, idx) => ({
      index: localResult.total_matched + idx + 1,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
    })),
  };
}

/**
 * Convert REST API response to InstantMatchResult format
 */
async function matchViaRESTAPI(text: string): Promise<InstantMatchResult> {
  const apiResponse = await analyticsApi.processTextOrder(text);

  return {
    analysis: {
      total_items: apiResponse.stats.totalItems,
      matched_count: apiResponse.stats.matchedItems,
      unmatched_count: apiResponse.stats.unmatchedItems,
    },
    matched_items: apiResponse.matchedItems.map((item, idx) => ({
      index: idx + 1,
      name: item.productName,
      quantity: item.quantity,
      unit: item.unit,
      options: [
        {
          option_id: 1,
          product_id: item.productId,
          product_name: item.productName,
          sku: item.sku,
          unit_name: item.unit,
          unit_price: item.unitPrice,
          total_price: item.unitPrice * item.quantity,
          match_score: 95,
        },
      ],
      selected_option_id: 1,
    })),
    unmatched_items: apiResponse.unmatchedItems.map((item, idx) => ({
      index: apiResponse.stats.matchedItems + idx + 1,
      name: item.productName,
      quantity: item.quantity,
      unit: item.unit,
    })),
  };
}

export function useInstantOrder(allProducts?: any[]): UseInstantOrderReturn {
  const [step, setStep] = useState<ProcessingStep>('idle');
  const [matchResult, setMatchResult] = useState<InstantMatchResult | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStep('idle');
    setMatchResult(null);
    setExtractedText('');
    setError(null);
  }, []);

  /**
   * Match text order via MCP, with local fallback
   */
  const matchTextOrder = useCallback(
    async (text: string, deliveryDate?: string) => {
      setStep('matching');
      setError(null);

      try {
        // Try MCP matching first
        const mcpClient = getMCPClientB2B();

        if (!mcpClient.isConnected()) {
          await mcpClient.connect();
        }

        const result = await mcpClient.createSmartOrder(text, deliveryDate);

        // Check for error responses before parsing
        if (result?.error) {
          throw new Error(result.error || result.message || 'MCP matching failed');
        }

        // Parse the structured JSON response
        const responseText =
          result?.content?.[0]?.text || result?.text || JSON.stringify(result);
        const parsed = parseMCPResponse(responseText);

        setMatchResult(parsed);
        setStep('preview');
      } catch (mcpError) {
        console.warn('MCP matching failed, trying REST API fallback:', mcpError);

        // Fallback 1: REST API (analytics backend text-order/process)
        try {
          const restResult = await matchViaRESTAPI(text);
          setMatchResult(restResult);
          setStep('preview');
          return;
        } catch (restError) {
          console.warn('REST API fallback also failed, trying local fallback:', restError);
        }

        // Fallback 2: Local matching (in-browser)
        if (allProducts && allProducts.length > 0) {
          try {
            const parsedProducts = parseProductList(text);
            if (parsedProducts.length === 0) {
              throw new Error('No valid products found in the text');
            }
            const localResult = matchProducts(parsedProducts, allProducts);
            const converted = convertLocalMatchResult(localResult, allProducts);

            setMatchResult(converted);
            setStep('preview');
          } catch (localError: any) {
            setError(localError.message || 'Matching failed');
            setStep('error');
          }
        } else {
          setError(
            mcpError instanceof Error
              ? mcpError.message
              : 'Product matching failed. Please try again.'
          );
          setStep('error');
        }
      }
    },
    [allProducts]
  );

  /**
   * Process image: OCR extract → show editor
   */
  const processImageOrder = useCallback(async (file: File) => {
    setStep('extracting');
    setError(null);

    try {
      const text = await extractTextFromImage(file);
      setExtractedText(text);
      setStep('editing_ocr');
    } catch (err: any) {
      setError(err.message || 'Failed to extract text from image');
      setStep('error');
    }
  }, []);

  /**
   * Match text after OCR editing (same as matchTextOrder)
   */
  const matchExtractedText = useCallback(
    async (editedText: string, deliveryDate?: string) => {
      await matchTextOrder(editedText, deliveryDate);
    },
    [matchTextOrder]
  );

  return {
    step,
    matchResult,
    extractedText,
    error,
    matchTextOrder,
    processImageOrder,
    matchExtractedText,
    reset,
  };
}
