// Types for the smart order matching system

export interface MatchedProduct {
  id: string;
  inputText: string;
  matchedName: string | null;
  matchedSku: string | null;
  quantity: number;
  unit: string;
  confidence: number; // 0-100
  status: 'matched' | 'partial' | 'unmatched';
  alternatives?: { name: string; sku: string; confidence: number }[];
  unitPrice?: number;
  productId?: string;
}

export interface MatchingResult {
  items: MatchedProduct[];
  totalMatched: number;
  totalPartial: number;
  totalUnmatched: number;
  estimatedCost: number;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  productId?: string;
  sku?: string;
  source: 'prediction' | 'text-match' | 'ocr-match' | 'browse' | 'template';
  status: 'resolved' | 'unmatched';
  confidence?: number;
  inputText?: string;
}
