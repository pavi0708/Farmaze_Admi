import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  X,
  Search,
  Loader2,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import analyticsApi, { ProductSuggestion } from '@/api/analyticsApi';
import type { OrderItem } from './types';
import ProductReasoningTag from './ProductReasoningTag';

interface UnifiedOrderListProps {
  items: OrderItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onSetQuantity: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void;
  onResolveUnmatched: (id: string, resolved: {
    name: string;
    productId: string;
    sku?: string;
    unitPrice?: number;
    unit: string;
  }) => void;
  rawSuggestions?: ProductSuggestion[];
}

interface SearchResult {
  id: string;
  name: string;
  unit_name: string;
  unit_price: number;
  sku?: string;
}

const UnifiedOrderList: React.FC<UnifiedOrderListProps> = ({
  items,
  onUpdateQuantity,
  onSetQuantity,
  onRemoveItem,
  onResolveUnmatched,
  rawSuggestions = [],
}) => {
  // Build lookup map for per-product reasoning (by name, case-insensitive)
  const suggestionLookup = React.useMemo(() => {
    const map = new Map<string, ProductSuggestion>();
    for (const s of rawSuggestions) {
      const name = (s.product_name || s.name || '').toLowerCase();
      if (name) map.set(name, s);
    }
    return map;
  }, [rawSuggestions]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchInputs, setSearchInputs] = useState<Record<string, string>>({});
  const [searchResults, setSearchResults] = useState<Record<string, SearchResult[]>>({});
  const [searchingFor, setSearchingFor] = useState<string | null>(null);
  const [editingQty, setEditingQty] = useState<Record<string, string>>({});

  const handleSearch = useCallback(async (itemId: string, searchText: string) => {
    if (!searchText.trim()) return;
    setSearchingFor(itemId);
    try {
      const results = await analyticsApi.findSimilarProducts(searchText, 5);
      setSearchResults((prev) => ({ ...prev, [itemId]: results }));
    } catch {
      toast.error('Search failed. Please try again.');
      setSearchResults((prev) => ({ ...prev, [itemId]: [] }));
    } finally {
      setSearchingFor(null);
    }
  }, []);

  const handleSelectResult = useCallback(
    (itemId: string, result: SearchResult) => {
      onResolveUnmatched(itemId, {
        name: result.name,
        productId: result.id,
        sku: result.sku,
        unitPrice: result.unit_price,
        unit: result.unit_name,
      });
      setSearchResults((prev) => ({ ...prev, [itemId]: [] }));
      setSearchInputs((prev) => ({ ...prev, [itemId]: '' }));
      setExpandedId(null);
    },
    [onResolveUnmatched]
  );

  const handleClickUnmatched = useCallback(
    (item: OrderItem) => {
      if (item.status !== 'unmatched') return;
      const nextId = expandedId === item.id ? null : item.id;
      setExpandedId(nextId);
      if (nextId && !searchInputs[item.id]) {
        const cleanText = (item.inputText || item.name)
          .replace(/\d+\s*(kg|g|pcs|bunch|box|bag|packet|gram|kilo|ltr|ml|litre|dozen)?\s*$/i, '')
          .trim();
        setSearchInputs((prev) => ({ ...prev, [item.id]: cleanText }));
      }
    },
    [expandedId, searchInputs]
  );

  const handleQtyChange = useCallback((itemId: string, value: string) => {
    setEditingQty(prev => ({ ...prev, [itemId]: value }));
  }, []);

  const handleQtyBlur = useCallback((itemId: string) => {
    const val = editingQty[itemId];
    if (val !== undefined) {
      const num = parseFloat(val);
      if (!isNaN(num) && num > 0) {
        onSetQuantity(itemId, num);
      }
      setEditingQty(prev => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
    }
  }, [editingQty, onSetQuantity]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
        <div className="p-4 bg-muted/50 rounded-2xl">
          <Package className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <p className="text-sm font-rubik text-center text-muted-foreground/60">
          No items yet. Add items using the bar above.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border/40 px-2 py-2">
        <AnimatePresence initial={false}>
          {items.map((item, idx) => {
            const isUnmatched = item.status === 'unmatched';
            const isExpanded = expandedId === item.id;
            const displayQty = editingQty[item.id] !== undefined
              ? editingQty[item.id]
              : String(item.quantity);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.12 }}
                className={`rounded-lg border transition-all duration-150 ${
                  isUnmatched
                    ? 'border-amber-200 bg-amber-50/50 cursor-pointer'
                    : 'border-border/60 bg-card hover:bg-muted/30'
                }`}
                onClick={() => isUnmatched && handleClickUnmatched(item)}
              >
                {/* Main row — compact: name+unit left, qty input right */}
                <div className="flex items-center gap-2 px-3 py-2">
                  {/* Name + unit */}
                  <div
                    className="flex-1 min-w-0"
                    title={isUnmatched ? `Unmatched: "${item.inputText || item.name}" — click to search` : item.name}
                  >
                    <span
                      className={`text-[13px] font-rubik block truncate ${
                        isUnmatched ? 'text-amber-700 font-medium' : 'font-medium text-foreground'
                      }`}
                    >
                      {isUnmatched && (
                        <AlertTriangle className="h-3 w-3 text-amber-500 inline mr-1 -mt-0.5" />
                      )}
                      {item.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-rubik leading-none">
                      {item.unit}
                    </span>
                    {/* Per-product festival/weather reasoning */}
                    {(() => {
                      const suggestion = suggestionLookup.get(item.name.toLowerCase());
                      if (!suggestion) return null;
                      return (
                        <ProductReasoningTag
                          festivalEffects={suggestion.festival_effect}
                          weatherEffects={suggestion.weather_effect}
                        />
                      );
                    })()}
                  </div>

                  {/* Qty input */}
                  <input
                    type="number"
                    value={displayQty}
                    onChange={(e) => handleQtyChange(item.id, e.target.value)}
                    onBlur={() => handleQtyBlur(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleQtyBlur(item.id);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-16 text-center border border-border rounded-md px-1.5 py-1 font-medium font-rubik text-sm tabular-nums bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />

                  {/* Remove */}
                  <button
                    className="h-6 w-6 flex items-center justify-center text-muted-foreground/40 hover:text-rose-500 shrink-0 rounded-md hover:bg-rose-50 transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveItem(item.id);
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Expanded search for unmatched items */}
                {isExpanded && isUnmatched && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="px-3 py-2 border-t border-amber-100/60 space-y-2"
                  >
                    <div className="flex items-center gap-1.5">
                      <Input
                        placeholder="Search for product..."
                        value={searchInputs[item.id] || ''}
                        autoFocus
                        onChange={(e) =>
                          setSearchInputs((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && searchInputs[item.id]) {
                            handleSearch(item.id, searchInputs[item.id]);
                          }
                          if (e.key === 'Escape') setExpandedId(null);
                        }}
                        className="h-7 text-xs font-rubik flex-1 border-amber-200/60 rounded-lg focus:border-primary/50 focus:ring-primary/20"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 flex-shrink-0 rounded-lg hover:bg-amber-100/50"
                        disabled={searchingFor === item.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (searchInputs[item.id]) {
                            handleSearch(item.id, searchInputs[item.id]);
                          }
                        }}
                      >
                        {searchingFor === item.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                        ) : (
                          <Search className="h-3.5 w-3.5 text-primary/70" />
                        )}
                      </Button>
                    </div>

                    {searchResults[item.id] && searchResults[item.id].length > 0 && (
                      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                        {searchResults[item.id].map((result) => (
                          <button
                            key={result.id}
                            className="flex items-center justify-between w-full text-left text-xs font-rubik px-3 py-2 hover:bg-primary/[0.04] transition-all duration-150 border-b border-border/30 last:border-b-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectResult(item.id, result);
                            }}
                          >
                            <span className="text-foreground font-medium truncate">
                              {result.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-2">
                              {result.unit_name}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults[item.id] &&
                      searchResults[item.id].length === 0 &&
                      !searchingFor && (
                        <p className="text-[10px] text-amber-600/80 font-rubik">
                          No products found. Try a different search.
                        </p>
                      )}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ScrollArea>
  );
};

export default UnifiedOrderList;
