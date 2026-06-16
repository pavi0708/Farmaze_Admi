
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, ShoppingBag, ArrowLeft, Plus, Minus, CheckCircle, Calendar, FileText, TrendingUp, TrendingDown, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";

// ── Price memory ─────────────────────────────────────────────────────────────
const PRICE_MEMORY_KEY = 'farmaze_price_memory';
interface PriceRecord { price: number; recordedAt: string }
function getPriceMemory(): Record<string, PriceRecord> {
  try { return JSON.parse(localStorage.getItem(PRICE_MEMORY_KEY) || '{}'); } catch { return {}; }
}
function savePriceMemory(records: Record<string, PriceRecord>) {
  try { localStorage.setItem(PRICE_MEMORY_KEY, JSON.stringify(records)); } catch { /* ignore */ }
}

function PriceDrift({ id, currentPrice }: { id: string; currentPrice: number }) {
  const mem = getPriceMemory();
  const prev = mem[id];
  if (!prev || Math.abs(prev.price - currentPrice) < 0.01) return null;
  const pct = ((currentPrice - prev.price) / prev.price) * 100;
  if (Math.abs(pct) < 1) return null;
  const up = pct > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ml-1 ${up ? 'text-red-500' : 'text-green-600'}`}>
      {up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
      {up ? '+' : ''}{pct.toFixed(0)}%
    </span>
  );
}

// ── CartItemRow sub-component ────────────────────────────────────────────────
import { CartItem } from '@/context/CartContext';

const CartItemRow: React.FC<{
  item: CartItem;
  onUpdate: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}> = ({ item, onUpdate, onRemove }) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
    <div className="flex items-center space-x-4">
      <div>
        <h3 className="font-medium">{item.name}</h3>
        <p className="text-sm text-gray-500 flex items-center flex-wrap gap-0.5">
          per {item.unit || 'item'}
          {item.price != null && item.price > 0 && (
            <>
              <span className="mx-0.5 text-gray-300">·</span>
              <span className="font-medium text-gray-700">₹{item.price}/{item.unit || 'unit'}</span>
              <PriceDrift id={item.id} currentPrice={item.price} />
            </>
          )}
        </p>
      </div>
    </div>
    <div className="flex items-center space-x-4">
      <div className="flex items-center">
        <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-l-md"
          onClick={() => onUpdate(item.id, item.quantity - 1)}>
          <Minus size={14} />
        </Button>
        <div className="h-8 px-3 flex items-center justify-center border-t border-b">
          {item.quantity}
        </div>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-r-md"
          onClick={() => onUpdate(item.id, item.quantity + 1)}>
          <Plus size={14} />
        </Button>
      </div>
      <Button variant="ghost" size="sm" onClick={() => onRemove(item.id)}
        className="text-gray-500 h-8 w-8 p-0">
        <Trash2 size={16} />
      </Button>
    </div>
  </div>
);

// ── Vendor heuristic ──────────────────────────────────────────────────────────
const VENDOR_RULES: { vendor: string; keywords: string[] }[] = [
  { vendor: 'Senthil Dairy',    keywords: ['milk', 'curd', 'ghee', 'paneer', 'cream', 'butter', 'cheese', 'dairy', 'lassi'] },
  { vendor: 'Anbu Fresh',       keywords: ['tomato', 'onion', 'potato', 'carrot', 'beans', 'cabbage', 'brinjal', 'spinach', 'coriander', 'curry leaves', 'greens', 'vegetable', 'veg', 'gourd', 'capsicum', 'ginger', 'garlic', 'chilli'] },
  { vendor: 'KG Rice & Mills',  keywords: ['rice', 'idli', 'urad', 'sona', 'toor', 'moong', 'dal', 'flour', 'atta', 'wheat', 'semolina', 'rava', 'poha', 'oats'] },
  { vendor: 'Pollachi Coconut', keywords: ['coconut', 'copra', 'tender'] },
  { vendor: 'Madurai Banana',   keywords: ['banana', 'leaf'] },
];
function getVendorForItem(name: string, category?: string): string {
  const hay = (name + ' ' + (category || '')).toLowerCase();
  for (const rule of VENDOR_RULES) {
    if (rule.keywords.some(k => hay.includes(k))) return rule.vendor;
  }
  return 'Farmaze Direct';
}
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import WasteAlertOverlay, { type WasteAlertItem } from "@/components/waste/WasteAlertOverlay";
import analyticsApi from "@/api/analyticsApi";
import { formatCurrencyDetailed } from "@/utils/formatters";

const Cart = () => {
  const { items, updateQuantity, removeFromCart, clearCart, getCartTotal, placeOrder, isPlacingOrder, orderDate, setOrderDate, orderNotes, setOrderNotes } = useCart();
  const { selectedBranch } = useAuth();
  const navigate = useNavigate();

  // ── Waste alert state (real API) ──────────────────────────────────────
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [wasteAlerts, setWasteAlerts] = useState<WasteAlertItem[]>([]);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Call waste check API when cart items change (debounced 500ms)
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (items.length === 0) {
      setWasteAlerts([]);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      try {
        const apiItems = items.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price || undefined,
        }));

        const result = await analyticsApi.checkOrderWaste(apiItems);

        if (result.alerts && result.alerts.length > 0) {
          const mapped: WasteAlertItem[] = result.alerts
            .filter((a: any) => !dismissedAlerts.has(a.product_id))
            .map((a: any) => ({
              id: a.product_id,
              productName: a.product_name,
              orderedQty: a.ordered_qty,
              suggestedQty: a.suggested_qty,
              unit: a.unit,
              averageQty: a.avg_daily_qty,
              deviationPercent: Math.round(a.deviation_pct),
              wasteCost: Math.round(a.excess_cost),
            }));
          setWasteAlerts(mapped);
        } else {
          setWasteAlerts([]);
        }
      } catch (error) {
        console.error('Error checking waste:', error);
        setWasteAlerts([]);
      }
    }, 500);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [items, dismissedAlerts]);

  const handleKeepQuantity = useCallback((alertId: string) => {
    setDismissedAlerts((prev) => new Set(prev).add(alertId));
  }, []);

  const handleUseSuggested = useCallback(
    (alertId: string, suggestedQty: number) => {
      updateQuantity(alertId, suggestedQty);
      setDismissedAlerts((prev) => new Set(prev).add(alertId));
      toast.success('Quantity updated to suggested amount');
    },
    [updateQuantity]
  );

  const handleDismissAlert = useCallback((alertId: string) => {
    setDismissedAlerts((prev) => new Set(prev).add(alertId));
  }, []);


  // Persist price memory whenever prices are known
  useEffect(() => {
    const priced = items.filter(i => i.price != null && i.price! > 0);
    if (priced.length === 0) return;
    const mem = getPriceMemory();
    const now = new Date().toISOString();
    let changed = false;
    for (const item of priced) {
      const existing = mem[item.id];
      if (!existing || existing.price !== item.price!) {
        mem[item.id] = { price: item.price!, recordedAt: now };
        changed = true;
      }
    }
    if (changed) savePriceMemory(mem);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map(i => `${i.id}:${i.price}`).join(',')]);

  // Vendor split grouping
  const vendorGroups = React.useMemo(() => {
    const groups: Record<string, typeof items> = {};
    for (const item of items) {
      const v = getVendorForItem(item.name, item.category);
      if (!groups[v]) groups[v] = [];
      groups[v].push(item);
    }
    return groups;
  }, [items]);

  const [viewByVendor, setViewByVendor] = useState(false);

  const cartTotal = getCartTotal();
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);


  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error("Your cart is empty. Add some items first!");
      return;
    }
    
    try {
      // Format order date if provided
      const formattedOrderDate = orderDate ? orderDate.toISOString().split('T')[0] : undefined;
      
      // Use the placeOrder function from CartContext with order date
      await placeOrder(formattedOrderDate);
      // Navigation is handled inside placeOrder function
    } catch (error) {
      console.error('Error in handleCheckout:', error);
    }
  };
  
  if (items.length === 0) {
    return (
      <div className="frame-container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center justify-center py-12">
            <ShoppingBag size={64} className="text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Your cart is empty</h2>
            <p className="text-gray-500 mb-6">Add some products to your cart and they will appear here</p>
            <Button 
              onClick={() => navigate('/smart-order')}
              className="bg-primary hover:bg-primary/90"
            >
              Browse Products
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="frame-container mx-auto px-4 py-8 mb-16">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center">
            Your Cart
            <span className="text-green-600 ml-2 text-lg font-medium">
              ({itemCount} {itemCount === 1 ? 'item' : 'items'})
            </span>
          </h1>
          {selectedBranch && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
              <MapPin size={13} className="text-primary" />
              Ordering for <span className="font-medium text-foreground">{selectedBranch.branch_name}</span>
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/smart-order')}
          className="flex items-center"
        >
          <ArrowLeft size={16} className="mr-2" />
          Continue Shopping
        </Button>
      </div>
      
      {/* Waste Alert Overlay */}
      <WasteAlertOverlay
        alerts={wasteAlerts}
        onKeepQuantity={handleKeepQuantity}
        onUseSuggested={handleUseSuggested}
        onDismiss={handleDismissAlert}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="p-4 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold">Order Items</h2>
              <div className="flex items-center gap-2">
                {Object.keys(vendorGroups).length > 1 && (
                  <button
                    onClick={() => setViewByVendor(v => !v)}
                    className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg border transition-colors ${
                      viewByVendor
                        ? 'border-primary/30 bg-primary/5 text-primary'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <Truck size={11} />
                    {viewByVendor ? 'Flat list' : 'By vendor'}
                  </button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCart}
                  className="text-red-500 hover:text-red-700 flex items-center"
                >
                  <Trash2 size={14} className="mr-1" />
                  Clear Cart
                </Button>
              </div>
            </div>

            <Separator className="mb-4" />

            {/* Flat list view */}
            {!viewByVendor && (
              <div className="space-y-4">
                {items.map((item) => (
                  <CartItemRow
                    key={item.id}
                    item={item}
                    onUpdate={updateQuantity}
                    onRemove={removeFromCart}
                  />
                ))}
              </div>
            )}

            {/* Grouped by vendor view */}
            {viewByVendor && (
              <div className="space-y-5">
                {Object.entries(vendorGroups).map(([vendor, vendorItems]) => (
                  <div key={vendor}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Truck size={11} className="text-primary shrink-0" />
                      <span className="text-[12px] font-semibold text-foreground">{vendor}</span>
                      <span className="text-[10px] text-muted-foreground">({vendorItems.length} item{vendorItems.length !== 1 ? 's' : ''})</span>
                    </div>
                    <div className="space-y-2 pl-4 border-l-2 border-primary/10">
                      {vendorItems.map((item) => (
                        <CartItemRow
                          key={item.id}
                          item={item}
                          onUpdate={updateQuantity}
                          onRemove={removeFromCart}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          <Card className="p-4 lg:sticky lg:top-20">
            <h2 className="font-semibold mb-4">Order Summary</h2>
            <Separator className="mb-4" />
            
            {/* Order Date Selection */}
            <div className="mb-6">
              <Label htmlFor="order-date" className="text-sm font-medium mb-2 block">
                <Calendar className="inline mr-2 h-4 w-4" />
                Order Date (Optional)
              </Label>
              <DatePicker
                date={orderDate}
                onDateChange={setOrderDate}
                placeholder="Select order date"
                className="w-full"
              />
              {orderDate && (
                <p className="text-xs text-gray-500 mt-1">
                  Order will be placed for {orderDate.toLocaleDateString()}
                </p>
              )}
            </div>
            
            {/* Order Notes */}
            <div className="mb-6">
              <Label htmlFor="order-notes" className="text-sm font-medium mb-2 block">
                <FileText className="inline mr-2 h-4 w-4" />
                Order Notes (Optional)
              </Label>
              <Textarea
                id="order-notes"
                placeholder="Add delivery instructions, special requests..."
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full resize-none"
                rows={3}
              />
            </div>

            {/* Vendor breakdown */}
            {items.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Truck size={11} />
                  Vendor breakdown
                </p>
                <div className="space-y-1">
                  {Object.entries(vendorGroups).map(([vendor, vendorItems]) => (
                    <div key={vendor} className="flex justify-between items-center text-xs py-1 border-b border-dashed border-gray-100 last:border-0">
                      <span className="text-gray-700 font-medium truncate pr-2">{vendor}</span>
                      <span className="text-gray-400 shrink-0">{vendorItems.length} item{vendorItems.length !== 1 ? 's' : ''}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  ~{Object.keys(vendorGroups).length} vendor order{Object.keys(vendorGroups).length !== 1 ? 's' : ''} will be sent
                </p>
              </div>
            )}

            <Separator className="mb-4" />

            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Items</span>
                <span>{itemCount}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{cartTotal > 0 ? formatCurrencyDetailed(cartTotal) : 'On confirmation'}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold text-base pt-1">
                <span>Total</span>
                <span>{cartTotal > 0 ? formatCurrencyDetailed(cartTotal) : 'On confirmation'}</span>
              </div>
              {cartTotal === 0 && (
                <p className="text-xs text-gray-500 pt-1">
                  Final price will be confirmed by your account manager.
                </p>
              )}
            </div>

            <Button
              className="w-full bg-primary hover:bg-primary/90 py-6 shadow-md"
              onClick={handleCheckout}
              disabled={isPlacingOrder}
            >
              {isPlacingOrder ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Placing Order...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" /> Place Order
                </>
              )}
            </Button>


          </Card>
        </div>
      </div>
    </div>
  );
};

export default Cart;
