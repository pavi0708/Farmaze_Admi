import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Wand2,
  Loader2,
  FileText,
  Package,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Trash2,
  Search,
  ShoppingCart,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/context/CartContext';
import analyticsApi from '@/api/analyticsApi';
import type { MatchedProduct } from './types';

// ── Row stripe helper — same pattern on both panels ─────────────────────────
const rowStripeClass = (idx: number) =>
  idx % 2 === 1 ? 'bg-slate-100/70' : '';

// ── Transform API response to MatchedProduct[] format ────────────────────────
function transformApiResponse(apiResponse: Awaited<ReturnType<typeof analyticsApi.processTextOrder>>): MatchedProduct[] {
  const items: MatchedProduct[] = [];

  if (apiResponse.matchedItems) {
    apiResponse.matchedItems.forEach((item, idx) => {
      items.push({
        id: `matched-${idx}`,
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
        id: `unmatched-${idx}`,
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

// ── Text Input Panel (Left) ─────────────────────────────────────────────────

const TextInputPanel: React.FC<{
  rawText: string;
  onTextChange: (text: string) => void;
  onMatch: () => void;
  isMatching: boolean;
  inputLines: string[];
}> = ({ rawText, onTextChange, onMatch, isMatching, inputLines }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium font-rubik text-foreground">Your Order Text</span>
          {inputLines.length > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 rounded-full font-rubik">
              {inputLines.length} lines
            </Badge>
          )}
        </div>
        <Button
          onClick={onMatch}
          disabled={!rawText.trim() || isMatching}
          size="sm"
          className="h-7 text-xs font-rubik gap-1 button-modern bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isMatching ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Matching...
            </>
          ) : (
            <>
              <Wand2 className="h-3 w-3" />
              Match
            </>
          )}
        </Button>
      </div>

      <div className="flex-1 relative">
        {rawText ? (
          <div className="flex h-full">
            {/* Line numbers gutter with alternating stripes */}
            <div className="flex flex-col py-2 px-1.5 bg-muted/40 border-r border-border select-none">
              {inputLines.map((_, idx) => (
                <div
                  key={idx}
                  className={`text-[10px] text-muted-foreground/60 font-mono leading-[22px] text-right min-w-[20px] ${rowStripeClass(idx)}`}
                >
                  {idx + 1}
                </div>
              ))}
            </div>
            {/* Editable text with alternating line stripes via CSS gradient */}
            <Textarea
              value={rawText}
              onChange={(e) => onTextChange(e.target.value)}
              placeholder={`Paste your order list here...\n\nExample:\nTomato 5kg\nOnion 2bag\nPaneer 2kg`}
              className="flex-1 border-0 rounded-none resize-none font-mono text-xs leading-[22px] min-h-full focus-visible:ring-0 focus-visible:ring-offset-0 p-2"
              style={{
                backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 22px, rgb(241 245 249 / 0.7) 22px, rgb(241 245 249 / 0.7) 44px)',
                backgroundSize: '100% 44px',
                backgroundPosition: '0 0',
              }}
              disabled={isMatching}
            />
          </div>
        ) : (
          <Textarea
            value={rawText}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder={`Paste your order list here...\n\nExample:\nTomato 5kg\nOnion 2bag\nPaneer 2kg`}
            className="h-full border-0 rounded-none resize-none font-mono text-xs leading-[22px] focus-visible:ring-0 focus-visible:ring-offset-0 p-2"
            disabled={isMatching}
          />
        )}
      </div>

      <div className="px-3 py-1.5 border-t border-border bg-muted/20">
        <p className="text-[10px] text-muted-foreground font-rubik">
          Paste or type your order list, then click Match
        </p>
      </div>
    </div>
  );
};

// ── Search result type ──────────────────────────────────────────────────────
interface SearchResult {
  id: string;
  name: string;
  unit_name: string;
  unit_price: number;
  sku?: string;
}

// ── Matched Products Panel (Right) ──────────────────────────────────────────

const MatchedProductsPanel: React.FC<{
  items: MatchedProduct[];
  totalInputLines: number;
  onRemove: (id: string) => void;
  onSearchReplace: (id: string, product: SearchResult) => void;
  onSelectAlternative: (id: string, name: string) => void;
}> = ({ items, totalInputLines, onRemove, onSearchReplace, onSelectAlternative }) => {
  const [searchInputs, setSearchInputs] = useState<Record<string, string>>({});
  const [searchResults, setSearchResults] = useState<Record<string, SearchResult[]>>({});
  const [searchingFor, setSearchingFor] = useState<string | null>(null);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const matchedCount = items.filter((i) => i.status === 'matched').length;
  const unmatchedCount = items.filter((i) => i.status === 'unmatched').length;
  const partialCount = items.filter((i) => i.status === 'partial').length;
  const duplicatesConsolidated = totalInputLines > 0 && totalInputLines > items.length
    ? totalInputLines - items.length
    : 0;

  // Search for products and show dropdown
  const handleSearch = useCallback(async (itemId: string, searchText: string) => {
    if (!searchText.trim()) return;
    setSearchingFor(itemId);
    try {
      const similar = await analyticsApi.findSimilarProducts(searchText, 5);
      setSearchResults((prev) => ({ ...prev, [itemId]: similar }));
    } catch (err) {
      console.error('Search failed:', err);
      toast.error('Search failed. Please try again.');
      setSearchResults((prev) => ({ ...prev, [itemId]: [] }));
    } finally {
      setSearchingFor(null);
    }
  }, []);

  // Select a product from search results
  const handleSelectResult = useCallback((itemId: string, product: SearchResult) => {
    onSearchReplace(itemId, product);
    setSearchResults((prev) => ({ ...prev, [itemId]: [] }));
    setSearchInputs((prev) => ({ ...prev, [itemId]: '' }));
    setExpandedRow(null);
  }, [onSearchReplace]);

  return (
    <div className="flex flex-col h-full">
      {/* Panel header with stats */}
      <div className="px-3 py-2 border-b border-border bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium font-rubik text-foreground">Matched Products</span>
          </div>
          {items.length > 0 && (
            <div className="flex items-center gap-1.5">
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger>
                    <Badge className="bg-green-50 text-farmaze-green border-green-200 text-[10px] px-1.5 py-0 h-4 rounded-full">
                      {matchedCount}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent><p>{matchedCount} matched</p></TooltipContent>
                </Tooltip>
                {partialCount > 0 && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0 h-4 rounded-full">
                        {partialCount}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent><p>{partialCount} partial matches</p></TooltipContent>
                  </Tooltip>
                )}
                {unmatchedCount > 0 && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge className="bg-red-50 text-red-600 border-red-200 text-[10px] px-1.5 py-0 h-4 rounded-full">
                        {unmatchedCount}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent><p>{unmatchedCount} unmatched - needs attention</p></TooltipContent>
                  </Tooltip>
                )}
                {duplicatesConsolidated > 0 && (
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge className="bg-blue-50 text-blue-600 border-blue-200 text-[10px] px-1.5 py-0 h-4 rounded-full">
                        +{duplicatesConsolidated}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{duplicatesConsolidated} duplicate lines merged (quantities combined)</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
            </div>
          )}
        </div>
        {duplicatesConsolidated > 0 && (
          <p className="text-[10px] text-muted-foreground font-rubik mt-1">
            {totalInputLines} lines → {items.length} unique products ({duplicatesConsolidated} duplicates merged)
          </p>
        )}
      </div>

      {/* Line-by-line product list */}
      <div className="flex-1 overflow-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground py-12">
            <Package className="h-8 w-8" />
            <p className="text-xs font-rubik">Matched products will appear here</p>
          </div>
        ) : (
          <div className="flex h-full">
            {/* Serial number gutter with alternating stripes */}
            <div className="flex flex-col py-2 px-1.5 bg-muted/40 border-r border-border select-none flex-shrink-0">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className={`text-[10px] font-mono leading-[22px] text-right min-w-[20px] ${
                    item.status === 'unmatched'
                      ? 'text-red-400'
                      : item.status === 'partial'
                      ? 'text-amber-500'
                      : 'text-muted-foreground/60'
                  } ${rowStripeClass(idx)}`}
                >
                  {idx + 1}
                </div>
              ))}
            </div>

            {/* Product rows */}
            <div className="flex-1 flex flex-col py-2 px-2 min-w-0">
              {items.map((item, idx) => (
                <div key={item.id}>
                  {/* Main row with alternating stripe */}
                  <div
                    className={`flex items-center gap-1.5 leading-[22px] min-h-[22px] group cursor-default ${
                      item.status === 'unmatched'
                        ? 'bg-red-50/60'
                        : item.status === 'partial'
                        ? 'bg-amber-50/40'
                        : hoveredRow === item.id
                        ? 'bg-muted/30'
                        : rowStripeClass(idx)
                    }`}
                    onMouseEnter={() => setHoveredRow(item.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    onClick={() => {
                      if (item.status === 'unmatched' || item.status === 'partial') {
                        setExpandedRow(expandedRow === item.id ? null : item.id);
                        // Pre-fill search with the input text for unmatched items
                        if (item.status === 'unmatched' && !searchInputs[item.id]) {
                          setSearchInputs((prev) => ({ ...prev, [item.id]: item.inputText.replace(/\d+\s*(kg|g|pcs|bunch|box|bag|packet|gram|kilo|ltr|ml|litre|dozen)?\s*$/i, '').trim() }));
                        }
                      }
                    }}
                  >
                    {/* Status icon */}
                    {item.status === 'matched' && item.confidence >= 85 ? (
                      <CheckCircle className="h-3 w-3 text-farmaze-green flex-shrink-0" />
                    ) : item.status === 'partial' || (item.confidence >= 50 && item.confidence < 85) ? (
                      <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                    )}

                    {/* Product name */}
                    <span
                      className={`text-xs font-mono truncate flex-1 min-w-0 ${
                        item.status === 'matched'
                          ? 'text-foreground'
                          : item.status === 'partial'
                          ? 'text-amber-700'
                          : 'text-red-600'
                      }`}
                      title={
                        item.status === 'matched'
                          ? `${item.matchedName} — ${item.quantity}${item.unit}${item.unitPrice ? ` @ ₹${item.unitPrice}` : ''}`
                          : item.status === 'unmatched'
                          ? `Unmatched: "${item.inputText}" — click to search`
                          : `Partial: ${item.matchedName || item.inputText}`
                      }
                    >
                      {item.status === 'matched'
                        ? item.matchedName
                        : item.status === 'partial'
                        ? (item.matchedName || item.inputText) + ' ?'
                        : item.inputText + ' ✗'}
                    </span>

                    {/* Qty */}
                    <span className="text-[10px] font-mono text-muted-foreground flex-shrink-0 tabular-nums">
                      {item.quantity}{item.unit}
                    </span>

                    {/* Price */}
                    {item.unitPrice != null && item.unitPrice > 0 && (
                      <span className="text-[10px] font-mono text-muted-foreground/70 flex-shrink-0 tabular-nums hidden sm:inline">
                        ₹{item.unitPrice}
                      </span>
                    )}

                    {/* Delete on hover */}
                    <button
                      className="h-4 w-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(item.id);
                      }}
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  </div>

                  {/* Expanded search row for unmatched items — with dropdown results */}
                  {expandedRow === item.id && item.status === 'unmatched' && (
                    <div className="pl-[18px] py-1 bg-red-50/40 space-y-1">
                      <div className="flex items-center gap-1">
                        <Input
                          placeholder="Type product name..."
                          value={searchInputs[item.id] || ''}
                          autoFocus
                          onChange={(e) =>
                            setSearchInputs((prev) => ({ ...prev, [item.id]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && searchInputs[item.id]) {
                              handleSearch(item.id, searchInputs[item.id]);
                            }
                            if (e.key === 'Escape') setExpandedRow(null);
                          }}
                          className="h-6 text-[11px] font-rubik flex-1 border-red-200"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 flex-shrink-0"
                          disabled={searchingFor === item.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (searchInputs[item.id]) {
                              handleSearch(item.id, searchInputs[item.id]);
                            }
                          }}
                        >
                          {searchingFor === item.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Search className="h-3 w-3" />
                          )}
                        </Button>
                      </div>

                      {/* Search results dropdown */}
                      {searchResults[item.id] && searchResults[item.id].length > 0 && (
                        <div className="rounded border border-red-200 bg-white shadow-sm overflow-hidden">
                          {searchResults[item.id].map((result) => (
                            <button
                              key={result.id}
                              className="flex items-center justify-between w-full text-left text-[11px] font-rubik px-2 py-1.5 hover:bg-green-50 transition-colors border-b border-border/50 last:border-b-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectResult(item.id, result);
                              }}
                            >
                              <span className="text-foreground font-medium truncate">{result.name}</span>
                              <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">
                                {result.unit_name} · ₹{result.unit_price}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                      {searchResults[item.id] && searchResults[item.id].length === 0 && !searchingFor && (
                        <p className="text-[10px] text-red-500 font-rubik px-1">No products found. Try a different search.</p>
                      )}
                    </div>
                  )}

                  {/* Expanded alternatives for partial items */}
                  {expandedRow === item.id && item.status === 'partial' && item.alternatives && (
                    <div className="pl-[18px] py-1 bg-amber-50/40 space-y-0.5">
                      {item.alternatives.slice(0, 3).map((alt) => (
                        <button
                          key={alt.sku}
                          className="block w-full text-left text-[11px] font-rubik px-1.5 py-0.5 rounded hover:bg-amber-100 transition-colors text-amber-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectAlternative(item.id, alt.name);
                            setExpandedRow(null);
                          }}
                        >
                          {alt.name} <span className="text-[10px] text-amber-600">({alt.confidence}%)</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom summary */}
      {items.length > 0 && (
        <div className="px-3 py-1.5 border-t border-border bg-muted/20">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground font-rubik">
              <span className="font-semibold text-foreground">{matchedCount}</span>/{items.length} matched
              {unmatchedCount > 0 && (
                <span className="text-red-500 font-medium"> · {unmatchedCount} missed</span>
              )}
            </p>
            <div className="h-1 flex-1 max-w-[60px] bg-muted rounded-full overflow-hidden flex ml-2">
              {matchedCount > 0 && (
                <div
                  className="h-full bg-farmaze-green"
                  style={{ width: `${(matchedCount / items.length) * 100}%` }}
                />
              )}
              {unmatchedCount > 0 && (
                <div
                  className="h-full bg-red-400"
                  style={{ width: `${(unmatchedCount / items.length) * 100}%` }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Cart Bar ────────────────────────────────────────────────────────────────

const CartBar: React.FC<{
  items: MatchedProduct[];
  estimatedCost: number;
  onAddAllToCart: () => void;
  onSendToAdmin: () => void;
}> = ({ items, estimatedCost, onAddAllToCart, onSendToAdmin }) => {
  const totalItems = items.length;
  const matchedCount = items.filter(
    (i) => i.status === 'matched' || (i.status === 'partial' && i.matchedName)
  ).length;
  const unmatchedCount = totalItems - matchedCount;
  const allResolved = matchedCount === totalItems && totalItems > 0;

  if (totalItems === 0) return null;

  return (
    <div className="rounded-xl bg-white border border-border shadow-lg p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${totalItems > 0 ? Math.round((matchedCount / totalItems) * 100) : 0}%`,
                  backgroundColor: allResolved
                    ? 'hsl(var(--insight-positive-accent))'
                    : 'hsl(var(--primary))',
                }}
              />
            </div>
            <span className="text-sm font-rubik text-muted-foreground">
              <span className="font-semibold text-foreground">{matchedCount}</span> of{' '}
              <span className="font-semibold text-foreground">{totalItems}</span> matched
            </span>
          </div>

          {unmatchedCount > 0 && (
            <span className="text-xs font-rubik text-red-500 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {unmatchedCount} item{unmatchedCount !== 1 ? 's' : ''} unmatched
            </span>
          )}

          {estimatedCost > 0 && (
            <span className="text-sm font-rubik text-muted-foreground hidden sm:inline">
              Est. cost:{' '}
              <span className="font-semibold text-foreground">
                ₹{estimatedCost.toLocaleString('en-IN')}
              </span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSendToAdmin}
            className="font-rubik text-sm"
          >
            <Send className="h-4 w-4 mr-1.5" />
            Send to Admin
          </Button>
          <Button
            size="sm"
            onClick={onAddAllToCart}
            disabled={!allResolved}
            className="font-rubik text-sm button-modern bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <ShoppingCart className="h-4 w-4 mr-1.5" />
            Add All to Cart
          </Button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ──────────────────────────────────────────────────────────

const TextImportTab: React.FC = () => {
  const { addToCart } = useCart();
  const [rawText, setRawText] = useState('');
  const [isMatching, setIsMatching] = useState(false);
  const [matchedItems, setMatchedItems] = useState<MatchedProduct[]>([]);
  const [totalInputLines, setTotalInputLines] = useState(0);
  const [hasMatched, setHasMatched] = useState(false);

  const inputLines = rawText ? rawText.split('\n').filter((l) => l.trim()) : [];

  const handleMatch = useCallback(async () => {
    if (!rawText.trim()) return;
    setIsMatching(true);
    try {
      const apiResponse = await analyticsApi.processTextOrder(rawText);
      const results = transformApiResponse(apiResponse);
      setMatchedItems(results);
      setTotalInputLines(apiResponse.stats?.totalItems || results.length);
      setHasMatched(true);

      const stats = apiResponse.stats;
      if (stats) {
        const msg = `Matched ${stats.matchedItems}/${stats.totalItems} products`;
        if (stats.unmatchedItems > 0) {
          toast.info(`${msg}. ${stats.unmatchedItems} items need review.`);
        } else {
          toast.success(msg);
        }
      }
    } catch (err: any) {
      console.error('Text matching failed:', err);
      toast.error(err?.response?.data?.error || 'Matching failed. Please try again.');
    } finally {
      setIsMatching(false);
    }
  }, [rawText]);

  const handleRemove = useCallback((id: string) => {
    setMatchedItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const handleSelectAlternative = useCallback((id: string, name: string) => {
    setMatchedItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, matchedName: name, status: 'matched', confidence: 85 } : item
      )
    );
  }, []);

  // Updated: receives full product object from search results dropdown
  const handleSearchReplace = useCallback((id: string, product: SearchResult) => {
    setMatchedItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              matchedName: product.name,
              matchedSku: product.sku || null,
              productId: product.id,
              unitPrice: product.unit_price,
              status: 'matched' as const,
              confidence: 80,
            }
          : item
      )
    );
    toast.success(`Matched to "${product.name}"`);
  }, []);

  const handleAddAllToCart = useCallback(() => {
    const resolved = matchedItems.filter((i) => i.matchedName);
    resolved.forEach((item) => {
      addToCart({
        id: item.productId || item.matchedSku || item.id,
        name: item.matchedName!,
        quantity: item.quantity,
        unit: item.unit,
        availability: 'in_stock',
      });
    });
    toast.success(`${resolved.length} items added to cart`);
    setMatchedItems([]);
    setRawText('');
    setHasMatched(false);
  }, [matchedItems, addToCart]);

  const handleSendToAdmin = useCallback(() => {
    toast.success('Order sent to admin for review');
  }, []);

  const estimatedCost = matchedItems.reduce((sum, item) => {
    if (item.matchedName && item.unitPrice) {
      return sum + item.quantity * item.unitPrice;
    }
    return sum;
  }, 0);

  return (
    <div className="space-y-4">
      {/* Side-by-side panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3" style={{ minHeight: '420px' }}>
        {/* Left panel: Text input */}
        <div className="rounded-xl border border-border overflow-hidden bg-white flex flex-col">
          <TextInputPanel
            rawText={rawText}
            onTextChange={setRawText}
            onMatch={handleMatch}
            isMatching={isMatching}
            inputLines={inputLines}
          />
        </div>

        {/* Right panel: Matched products */}
        <div className="rounded-xl border border-border overflow-hidden bg-white flex flex-col">
          <MatchedProductsPanel
            items={matchedItems}
            totalInputLines={totalInputLines}
            onRemove={handleRemove}
            onSearchReplace={handleSearchReplace}
            onSelectAlternative={handleSelectAlternative}
          />
        </div>
      </div>

      {/* Bottom cart bar */}
      {hasMatched && matchedItems.length > 0 && (
        <CartBar
          items={matchedItems}
          estimatedCost={estimatedCost}
          onAddAllToCart={handleAddAllToCart}
          onSendToAdmin={handleSendToAdmin}
        />
      )}
    </div>
  );
};

// Re-export SearchResult type for OCR tab reuse
export type { SearchResult };
export default TextImportTab;
