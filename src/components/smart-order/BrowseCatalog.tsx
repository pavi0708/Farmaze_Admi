import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2,
  Plus,
  Check,
  ShoppingCart,
} from 'lucide-react';
import { toast } from 'sonner';
import { recommendationsApi } from '@/api/recommendationsApi';
import type { OrderItem } from './types';

interface SearchResult {
  id: string;
  name: string;
  unit_name: string;
  unit_price: number;
  sku?: string;
  category_name?: string;
}

interface BrowseCatalogProps {
  orderItems: OrderItem[];
  onItemsFromBrowse: (item: {
    id: string;
    name: string;
    unit: string;
    unitPrice: number;
    sku?: string;
    quantity: number;
  }) => void;
}

const BrowseCatalog: React.FC<BrowseCatalogProps> = ({
  orderItems,
  onItemsFromBrowse,
}) => {
  const [browseQuery, setBrowseQuery] = useState('');
  const [allProducts, setAllProducts] = useState<SearchResult[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [browseQtyInputs, setBrowseQtyInputs] = useState<Record<string, string>>({});

  // Fetch products on mount
  useEffect(() => {
    if (allProducts.length > 0) return;
    let cancelled = false;
    setIsLoadingProducts(true);
    recommendationsApi
      .getMyRecommendations(new Date().getFullYear(), 200)
      .then((res) => {
        if (cancelled) return;
        const products: SearchResult[] = (res.products || []).map(
          (p: any) => ({
            id: p.id,
            name: p.name,
            unit_name: p.unit_name || '',
            unit_price: 0,
            sku: p.sku,
            category_name: p.category_name || '',
          })
        );
        setAllProducts(products);
      })
      .catch(() => {
        if (!cancelled) toast.error('Failed to load products.');
      })
      .finally(() => {
        if (!cancelled) setIsLoadingProducts(false);
      });
    return () => { cancelled = true; };
  }, [allProducts.length]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    allProducts.forEach(p => {
      if (p.category_name) cats.add(p.category_name);
    });
    return Array.from(cats).sort();
  }, [allProducts]);

  const addedProductIds = useMemo(() => {
    return new Set(orderItems.filter(i => i.productId).map(i => i.productId));
  }, [orderItems]);

  const filteredProducts = useMemo(() => {
    let products = allProducts;
    if (selectedCategory) {
      products = products.filter(p => p.category_name === selectedCategory);
    }
    const q = browseQuery.trim().toLowerCase();
    if (q) {
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.sku && p.sku.toLowerCase().includes(q))
      );
    }
    return products;
  }, [browseQuery, allProducts, selectedCategory]);

  const handleSelectBrowseResult = useCallback(
    (result: SearchResult, quantity: number) => {
      onItemsFromBrowse({
        id: result.id,
        name: result.name,
        unit: result.unit_name,
        unitPrice: result.unit_price,
        sku: result.sku,
        quantity,
      });
      setBrowseQtyInputs(prev => {
        const next = { ...prev };
        delete next[result.id];
        return next;
      });
      toast.success(`Added ${quantity} ${result.unit_name} of "${result.name}"`);
    },
    [onItemsFromBrowse]
  );

  if (isLoadingProducts) {
    return (
      <div className="flex items-center gap-2.5 py-10 justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-sm font-rubik text-muted-foreground">Loading products...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search + category filters */}
      <div className="px-4 pt-3 pb-2 space-y-2 shrink-0">
        <Input
          placeholder="Search products..."
          value={browseQuery}
          onChange={(e) => setBrowseQuery(e.target.value)}
          className="h-9 text-xs font-rubik rounded-xl border-border"
          autoFocus
        />
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 rounded-full text-xs font-rubik font-medium transition-all ${
              !selectedCategory
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              className={`px-3 py-1 rounded-full text-xs font-rubik font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground font-rubik">
          {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
          {browseQuery && ` matching "${browseQuery}"`}
          {selectedCategory && ` in ${selectedCategory}`}
        </p>
      </div>

      {/* Product rows — same layout as UnifiedOrderList */}
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px px-2 py-2">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => {
              const isAdded = addedProductIds.has(product.id);
              const qtyValue = browseQtyInputs[product.id] || '';
              const qtyNum = parseFloat(qtyValue);
              const canAdd = !isNaN(qtyNum) && qtyNum > 0;

              return (
                <div
                  key={product.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-150 ${
                    isAdded
                      ? 'border-primary/30 bg-primary/[0.04]'
                      : 'border-border/60 bg-card hover:bg-muted/30'
                  }`}
                >
                  {/* Name + unit */}
                  <div className="flex-1 min-w-0">
                    <span className="text-[13px] font-rubik font-medium text-foreground block truncate">
                      {product.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-rubik leading-none">
                      {product.unit_name}
                    </span>
                  </div>

                  {isAdded ? (
                    <span className="flex items-center gap-1 text-[11px] font-rubik font-medium text-primary shrink-0">
                      <Check className="h-3 w-3" />
                      Added
                    </span>
                  ) : (
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="number"
                        placeholder="Qty"
                        value={qtyValue}
                        onChange={(e) =>
                          setBrowseQtyInputs(prev => ({ ...prev, [product.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && canAdd) {
                            handleSelectBrowseResult(product, qtyNum);
                          }
                        }}
                        className="w-14 text-center border border-border rounded-md px-1.5 py-1 text-xs font-rubik tabular-nums bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      />
                      <button
                        disabled={!canAdd}
                        onClick={() => canAdd && handleSelectBrowseResult(product, qtyNum)}
                        className="h-7 w-7 rounded-md border border-border hover:bg-primary/10 flex items-center justify-center transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ShoppingCart className="h-3.5 w-3.5 text-primary" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 col-span-2">
              <p className="text-xs text-muted-foreground font-rubik">
                {browseQuery ? 'No matching products' : 'No products available'}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default BrowseCatalog;
