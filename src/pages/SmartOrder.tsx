import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Zap,
  CalendarIcon,
  Store,
  Package,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { Branch } from '@/components/smart-order/BranchSelector';
import ContextLine from '@/components/smart-order/ContextLine';
import AddItemsBar, { type AddMode } from '@/components/smart-order/AddItemsBar';
import UnifiedOrderList from '@/components/smart-order/UnifiedOrderList';
import BrowseCatalog from '@/components/smart-order/BrowseCatalog';
import OrderActionBar from '@/components/smart-order/OrderActionBar';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import analyticsApi, { ProductSuggestion, SuggestionContext } from '@/api/analyticsApi';
import { Branch as ApiBranch } from '@/api/branchApi';
import { useSmartOrder } from '@/hooks/useSmartOrder';
import QuickReorderStrip from '@/components/smart-order/QuickReorderStrip';
import CutoffBanner from '@/components/smart-order/CutoffBanner';

function mapApiBranches(apiBranches: ApiBranch[]): Branch[] {
  return apiBranches
    .filter(b => b.is_active)
    .map(b => ({
      id: b.id,
      name: b.branch_name,
      location: b.branch_code || b.address?.city || '',
    }));
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ── Branch List (left panel) ─────────────────────────────────────────────────

const BranchList: React.FC<{
  branches: Branch[];
  selectedBranchId: string | null;
  predictions: Record<string, string>;
  orderItemCounts: Record<string, number>;
  onSelectBranch: (id: string) => void;
}> = ({ branches, selectedBranchId, predictions, orderItemCounts, onSelectBranch }) => {
  function countItems(text: string): number {
    return text.split('\n').map((l) => l.trim()).filter(Boolean).length;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3.5 border-b border-border/60">
        <h2 className="text-[13px] font-semibold font-playfair tracking-tight">Branches</h2>
        <p className="text-[11px] text-muted-foreground font-rubik mt-0.5">
          Select branch to order
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="py-1 px-1.5">
          {branches.map((branch) => {
            const isSelected = selectedBranchId === branch.id;
            const predText = predictions[branch.id] || '';
            const predCount = countItems(predText);
            const orderCount = orderItemCounts[branch.id] || 0;

            // FAR-74: createOrder calls clearItems() which zeroes orderCount for the active branch.
            // Fall back to predCount so the badge never shows 0 when predictions are available.
            // Non-active branches always use predCount — their branchItems are unaffected.
            const displayCount = isSelected && orderCount > 0 ? orderCount : predCount;

            return (
              <div
                key={branch.id}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-all duration-200 rounded-xl my-0.5",
                  isSelected
                    ? "bg-primary/10 border-l-4 border-primary"
                    : "hover:bg-muted/50"
                )}
                onClick={() => onSelectBranch(branch.id)}
              >
                <div className={cn(
                  "p-1.5 rounded-lg shrink-0 transition-colors duration-200",
                  isSelected ? "bg-primary/10" : "bg-muted/60"
                )}>
                  <Store className={cn(
                    "h-3.5 w-3.5 transition-colors duration-200",
                    isSelected ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={cn(
                    "text-[13px] font-rubik truncate transition-all duration-200",
                    isSelected ? "font-semibold text-foreground" : "font-medium text-foreground/80"
                  )}>
                    {branch.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground font-rubik">
                      {branch.location}
                    </span>
                    <span className={cn(
                      "text-[10px] font-rubik flex items-center gap-0.5 px-1.5 py-px rounded-full",
                      isSelected ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"
                    )}>
                      <Package className="h-2.5 w-2.5" />
                      {displayCount}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

// ── Main Page ────────────────────────────────────────────────────────────────

const SmartOrder: React.FC = () => {
  const [predictions, setPredictions] = useState<Record<string, string>>({});
  const [rawSuggestions, setRawSuggestions] = useState<ProductSuggestion[]>([]);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [suggestionContext, setSuggestionContext] = useState<SuggestionContext | null>(null);
  const [activeMode, setActiveMode] = useState<AddMode>('ai');

  const { orderDate, setOrderDate, addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (!orderDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      setOrderDate(tomorrow);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    isLoggedIn,
    branches: apiBranches,
    selectedBranch: authSelectedBranch,
    setSelectedBranch: setAuthSelectedBranch,
  } = useAuth();

  const smartOrder = useSmartOrder();

  const BRANCHES = React.useMemo(() => mapApiBranches(apiBranches), [apiBranches]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

  useEffect(() => {
    if (authSelectedBranch && !selectedBranchId) {
      setSelectedBranchId(authSelectedBranch.id);
      smartOrder.switchBranch(authSelectedBranch.id);
    } else if (BRANCHES.length > 0 && !selectedBranchId) {
      setSelectedBranchId(BRANCHES[0].id);
      smartOrder.switchBranch(BRANCHES[0].id);
    }
  }, [authSelectedBranch, BRANCHES]);

  const handleSelectBranch = (branchId: string) => {
    setSelectedBranchId(branchId);
    smartOrder.switchBranch(branchId);
    const apiBranch = apiBranches.find(b => b.id === branchId);
    if (apiBranch) setAuthSelectedBranch(apiBranch);
  };

  const tomorrowDay = DAYS[(new Date().getDay() + 1) % 7];
  const tomorrowDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });
  })();

  const predictionsLoadedRef = useRef(false);

  const loadPredictions = useCallback(async (forceRefresh = false) => {
    if (!isLoggedIn) return;
    if (!forceRefresh && predictionsLoadedRef.current) return;

    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    loadingTimerRef.current = setTimeout(() => setIsLoadingPredictions(true), 300);
    try {
      if (forceRefresh) {
        analyticsApi._suggestionCache.delete(`${tomorrowDay}:`);
      }

      const result = await analyticsApi.getProductSuggestionsForDay(tomorrowDay);
      const filtered = (result.suggestions || [])
        .filter((s: ProductSuggestion) => s.suggested_quantity != null && s.suggested_quantity > 0);
      setRawSuggestions(filtered);

      // Context is included in the main response too
      if (result && (result as Record<string, unknown>).context) {
        setSuggestionContext((result as Record<string, unknown>).context as SuggestionContext);
      }

      const predictionText = filtered
        .map((s: ProductSuggestion) => {
          const qty = Math.round((s.suggested_quantity || 0) * 10) / 10;
          const unit = s.unit || s.product_unit || 'kg';
          return `${s.product_name || s.name} ${qty}${unit}`;
        })
        .join('\n');

      // Share same predictions across all branches
      const predMap: Record<string, string> = {};
      for (const b of BRANCHES) {
        predMap[b.id] = predictionText || '';
      }
      setPredictions(predMap);
      predictionsLoadedRef.current = true;

      try {
        const withCtx = await analyticsApi.getProductSuggestionsWithContext(tomorrowDay);
        setSuggestionContext(withCtx.context);
      } catch { /* optional */ }

      if (filtered.length > 0) {
        const predItems = filtered.map((s: ProductSuggestion) => ({
          name: s.product_name || s.name || '',
          qty: Math.round((s.suggested_quantity || 0) * 10) / 10,
          unit: s.unit || s.product_unit || 'kg',
          productId: s.product_id || s.id,
        }));
        smartOrder.addItemsFromPredictions(predItems);
      }
    } catch (error) {
      console.error('Error loading predictions:', error);
      predictionsLoadedRef.current = true;
    } finally {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
      setIsLoadingPredictions(false);
    }
  }, [isLoggedIn, tomorrowDay, BRANCHES, smartOrder.addItemsFromPredictions]);

  // Load predictions once on mount (not per branch)
  useEffect(() => {
    if (isLoggedIn && BRANCHES.length > 0) loadPredictions();
  }, [isLoggedIn, BRANCHES.length, loadPredictions]);

  const handleRefreshPredictions = useCallback(() => {
    smartOrder.clearItems();
    predictionsLoadedRef.current = false;
    loadPredictions(true);
  }, [smartOrder, loadPredictions]);

  const orderItemCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    Object.entries(smartOrder.branchItems).forEach(([branchId, items]) => {
      counts[branchId] = items.length;
    });
    return counts;
  }, [smartOrder.branchItems]);

  // FAR-74: Re-seed the active branch when createOrder clears it (or after a refresh)
  // without navigating away. Depends on the scalar active-branch count instead of
  // the whole branchItems map so the effect doesn't re-evaluate when other branches change.
  const activeBranchItemCount = selectedBranchId ? orderItemCounts[selectedBranchId] ?? 0 : 0;
  useEffect(() => {
    if (!selectedBranchId) return;
    if (rawSuggestions.length === 0) return;
    if (activeBranchItemCount > 0) return;

    const predItems = rawSuggestions.map((s: ProductSuggestion) => ({
      name: s.product_name || s.name || '',
      qty: Math.round((s.suggested_quantity || 0) * 10) / 10,
      unit: s.unit || s.product_unit || 'kg',
      productId: s.product_id || s.id,
    }));
    smartOrder.addItemsFromPredictions(predItems);
  }, [selectedBranchId, rawSuggestions, activeBranchItemCount, smartOrder.addItemsFromPredictions]);

  // Text/Image tabs expand the bar; AI/Browse show the product list below
  const isExpandedTab = activeMode === 'text' || activeMode === 'image';

  return (
    <div className="container mx-auto px-4 py-5 max-w-7xl flex flex-col xl:h-[calc(100vh-56px)]">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-2 sm:gap-4 shrink-0 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 bg-gradient-to-br from-primary/15 to-primary/5 rounded-2xl shrink-0 shadow-sm">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-semibold font-playfair text-foreground leading-tight tracking-tight truncate">
              Smart Order
            </h1>
            <p className="text-xs text-muted-foreground font-rubik truncate mt-0.5">
              AI-predicted orders for {tomorrowDay}, {tomorrowDate}
            </p>
          </div>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 sm:h-9 gap-1.5 text-xs font-rubik px-3 rounded-xl border-border hover:border-primary/30 hover:bg-card shadow-sm transition-all duration-200",
                !orderDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{orderDate ? format(orderDate, "PPP") : "Tomorrow"}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-xl shadow-xl border-border" align="end">
            <Calendar
              mode="single"
              selected={orderDate}
              onSelect={(date) => setOrderDate(date || undefined)}
              disabled={(date) => date < new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Cutoff countdown — only visible in the last 4 hours before 9 AM cutoff */}
      <CutoffBanner />

      {/* Main content */}
      <Card className="overflow-hidden flex-1 min-w-0 min-h-[500px] xl:min-h-0 rounded-2xl border-border shadow-sm">
        <div className="flex flex-col lg:flex-row h-full">
          {/* Left: Branch list */}
          <div className="w-full lg:w-56 shrink-0 border-b lg:border-b-0 lg:border-r border-border/50 bg-muted/20">
            <BranchList
              branches={BRANCHES}
              selectedBranchId={selectedBranchId}
              predictions={predictions}
              orderItemCounts={orderItemCounts}
              onSelectBranch={handleSelectBranch}
            />
          </div>

          {/* Right: Main content area */}
          <div className="flex-1 min-w-0 flex flex-col bg-card">
            {/* Context line */}
            <div className="px-4 pt-4">
              <ContextLine
                context={suggestionContext}
                itemCount={smartOrder.orderItems.length}
                tomorrowDay={tomorrowDay}
              />
            </div>

            {/* Quick Reorder strip */}
            <div className="px-4 pt-2">
              <QuickReorderStrip
                branchId={selectedBranchId}
                branchName={BRANCHES.find(b => b.id === selectedBranchId)?.name}
                onAddItems={(items) => {
                  smartOrder.addItemsFromPredictions(items);
                  toast.success(`${items.length} item${items.length !== 1 ? 's' : ''} added from last order`);
                }}
              />
            </div>

            {/* AddItemsBar — always visible tabs */}
            <div className={`px-4 pt-3 ${isExpandedTab ? 'flex-1 min-h-0 flex flex-col' : ''}`}>
              <AddItemsBar
                onItemsMatched={smartOrder.addItemsFromMatching}
                onAddToCartDirect={(items) => {
                  // Add matched items directly to cart and navigate
                  const matched = items.filter(i => i.status === 'matched' && i.productId);
                  if (matched.length === 0) {
                    toast.error('No matched items to add.');
                    return;
                  }
                  for (const item of matched) {
                    addToCart(
                      {
                        id: item.productId!,
                        name: item.matchedName || item.inputText,
                        unit: item.unit,
                        quantity: 0,
                        availability: 'in_stock',
                        price: item.unitPrice,
                        sku: item.matchedSku || undefined,
                      },
                      item.quantity
                    );
                  }
                  toast.success(`${matched.length} items added to cart`);
                  navigate('/cart');
                }}
                activeMode={activeMode}
                onActiveModeChange={setActiveMode}
                tomorrowDay={tomorrowDay}
                tomorrowDate={tomorrowDate}
                predictionCount={smartOrder.orderItems.filter(i => i.source === 'prediction').length}
                isLoadingPredictions={isLoadingPredictions}
                onRefreshPredictions={handleRefreshPredictions}
              />
            </div>

            {/* Product list — visible for AI and Browse tabs */}
            {activeMode === 'ai' && (
              <div className="flex-1 min-h-0 mt-3 overflow-hidden">
                {isLoadingPredictions ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                    <div className="p-3 bg-primary/5 rounded-2xl">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                    <span className="text-sm font-rubik">Loading predictions...</span>
                  </div>
                ) : (
                  <UnifiedOrderList
                    items={smartOrder.orderItems}
                    onUpdateQuantity={smartOrder.updateQuantity}
                    onSetQuantity={smartOrder.setQuantity}
                    onRemoveItem={smartOrder.removeItem}
                    onResolveUnmatched={smartOrder.resolveUnmatched}
                    rawSuggestions={rawSuggestions}
                  />
                )}
              </div>
            )}

            {activeMode === 'browse' && (
              <div className="flex-1 min-h-0 mt-3 overflow-hidden">
                <BrowseCatalog
                  orderItems={smartOrder.orderItems}
                  onItemsFromBrowse={smartOrder.addItemFromBrowse}
                />
              </div>
            )}

            {/* Action bar */}
            <OrderActionBar
              items={smartOrder.orderItems}
              unresolvedCount={smartOrder.unresolvedCount}
              onCreateOrder={smartOrder.createOrder}
              isCreating={smartOrder.isCreating}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SmartOrder;
