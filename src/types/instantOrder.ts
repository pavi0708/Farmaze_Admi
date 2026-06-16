// Types for the instant text/image ordering feature
// Used by useInstantOrder hook, ProductMatchPreview, and ExtractedTextEditor

export interface MatchOption {
  option_id: number;
  product_id: string;
  product_name: string;
  sku: string;
  unit_name: string;
  unit_price: number;
  total_price: number;
  match_score: number; // 0-100
}

export interface MatchedItem {
  index: number;
  name: string;         // original parsed name from user input
  quantity: number;
  unit: string;
  options: MatchOption[];
  selected_option_id: number; // user's current selection (default: 1)
}

export interface UnmatchedItem {
  index: number;
  name: string;
  quantity: number;
  unit: string;
}

export interface InstantMatchResult {
  analysis: {
    total_items: number;
    matched_count: number;
    unmatched_count: number;
  };
  matched_items: MatchedItem[];
  unmatched_items: UnmatchedItem[];
  display_text?: string; // markdown text for chat backward compatibility
}

export type ProcessingStep =
  | 'idle'         // initial state, showing text/file input
  | 'extracting'   // OCR extracting text from image
  | 'matching'     // matching products via MCP
  | 'editing_ocr'  // showing extracted OCR text for user editing
  | 'preview'      // showing matched products preview table
  | 'error';       // error state with retry option
