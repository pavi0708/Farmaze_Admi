import { useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCart } from '@/context/CartContext';
import type { OrderItem, MatchedProduct } from '@/components/smart-order/types';
import { PredictionItem } from '@/components/smart-order/PredictionsSidebar';

let nextId = 1;
function generateId(): string {
  return `order-item-${Date.now()}-${nextId++}`;
}

export function useSmartOrder() {
  // Store items per branch: Map<branchId, OrderItem[]>
  const [branchItems, setBranchItems] = useState<Record<string, OrderItem[]>>({});
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const { addToCart } = useCart();

  // Current branch's items
  const orderItems = useMemo(() => {
    if (!activeBranchId) return [];
    return branchItems[activeBranchId] || [];
  }, [branchItems, activeBranchId]);

  // Switch branch: save current, restore target
  const switchBranch = useCallback((branchId: string) => {
    setActiveBranchId(branchId);
  }, []);

  // Internal setter that targets the active branch
  const setItems = useCallback((updater: (prev: OrderItem[]) => OrderItem[]) => {
    if (!activeBranchId) return;
    setBranchItems(prev => ({
      ...prev,
      [activeBranchId]: updater(prev[activeBranchId] || []),
    }));
  }, [activeBranchId]);

  // ── Add from predictions ──
  const addItemsFromPredictions = useCallback((predictions: PredictionItem[]) => {
    if (!activeBranchId) return;
    setBranchItems(prev => {
      const current = prev[activeBranchId] || [];
      const newItems: OrderItem[] = [];
      for (const pred of predictions) {
        const existing = current.find(
          (item) =>
            item.name.toLowerCase() === pred.name.toLowerCase() &&
            item.source === 'prediction'
        );
        if (!existing && !newItems.find(n => n.name.toLowerCase() === pred.name.toLowerCase())) {
          newItems.push({
            id: generateId(),
            name: pred.name,
            quantity: pred.qty,
            unit: pred.unit,
            productId: pred.productId,
            source: 'prediction',
            status: 'resolved',
          });
        }
      }
      return { ...prev, [activeBranchId]: [...current, ...newItems] };
    });
  }, [activeBranchId]);

  // ── Add from text/OCR matching ──
  const addItemsFromMatching = useCallback(
    (matched: MatchedProduct[], source: 'text-match' | 'ocr-match') => {
      setItems((prev) => {
        const updated = [...prev];
        const newItems: OrderItem[] = [];

        for (const m of matched) {
          if (m.status === 'matched' && m.productId) {
            const existingIdx = updated.findIndex((item) => item.productId === m.productId);
            if (existingIdx !== -1) {
              // Update quantity in-place, continue to next item
              updated[existingIdx] = {
                ...updated[existingIdx],
                quantity: updated[existingIdx].quantity + m.quantity,
              };
              continue;
            }
          }

          newItems.push({
            id: generateId(),
            name: m.matchedName || m.inputText,
            quantity: m.quantity,
            unit: m.unit,
            unitPrice: m.unitPrice,
            productId: m.productId,
            sku: m.matchedSku || undefined,
            source,
            status: m.status === 'matched' ? 'resolved' : 'unmatched',
            confidence: m.confidence,
            inputText: m.inputText,
          });
        }
        return [...updated, ...newItems];
      });
    },
    [setItems]
  );

  // ── Add from browse ──
  const addItemFromBrowse = useCallback(
    (item: {
      id: string;
      name: string;
      unit: string;
      unitPrice: number;
      sku?: string;
      quantity: number;
    }) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === item.id);
        if (existing) {
          return prev.map((i) =>
            i.productId === item.id
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          );
        }

        return [
          ...prev,
          {
            id: generateId(),
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            productId: item.id,
            sku: item.sku,
            source: 'browse' as const,
            status: 'resolved' as const,
          },
        ];
      });
    },
    [setItems]
  );

  // ── Add from template ──
  const addItemsFromTemplate = useCallback(
    (items: { productId: string; productName: string; quantity: number; unit: string }[]) => {
      setItems((prev) => {
        const newItems: OrderItem[] = [];
        for (const t of items) {
          const existing = prev.find((i) => i.productId === t.productId);
          if (existing) continue;
          newItems.push({
            id: generateId(),
            name: t.productName,
            quantity: t.quantity,
            unit: t.unit,
            productId: t.productId,
            source: 'template',
            status: 'resolved',
          });
        }
        return [...prev, ...newItems];
      });
    },
    [setItems]
  );

  // ── Update quantity ──
  const updateQuantity = useCallback((id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const next = Math.round((item.quantity + delta) * 10) / 10;
        if (next <= 0) return item;
        return { ...item, quantity: next };
      })
    );
  }, [setItems]);

  // ── Set quantity directly ──
  const setQuantity = useCallback((id: string, qty: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (qty <= 0) return item;
        return { ...item, quantity: qty };
      })
    );
  }, [setItems]);

  // ── Remove item ──
  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, [setItems]);

  // ── Resolve unmatched ──
  const resolveUnmatched = useCallback(
    (
      id: string,
      resolved: {
        name: string;
        productId: string;
        sku?: string;
        unitPrice?: number;
        unit: string;
      }
    ) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                name: resolved.name,
                productId: resolved.productId,
                sku: resolved.sku,
                unitPrice: resolved.unitPrice,
                unit: resolved.unit,
                status: 'resolved' as const,
                confidence: 80,
              }
            : item
        )
      );
      toast.success(`Matched to "${resolved.name}"`);
    },
    [setItems]
  );

  // ── Clear all for active branch ──
  const clearItems = useCallback(() => {
    if (!activeBranchId) return;
    setBranchItems(prev => ({ ...prev, [activeBranchId]: [] }));
  }, [activeBranchId]);

  // ── Computed values ──
  const totalCost = useMemo(() => {
    return orderItems.reduce((sum, item) => {
      if (item.unitPrice && item.status === 'resolved') {
        return sum + item.unitPrice * item.quantity;
      }
      return sum;
    }, 0);
  }, [orderItems]);

  const resolvedCount = useMemo(
    () => orderItems.filter((i) => i.status === 'resolved').length,
    [orderItems]
  );

  const unresolvedCount = useMemo(
    () => orderItems.filter((i) => i.status === 'unmatched').length,
    [orderItems]
  );

  // ── Create order: add to cart + navigate ──
  const createOrder = useCallback(async () => {
    if (orderItems.length === 0) {
      toast.error('No items in order.');
      return;
    }

    setIsCreating(true);
    try {
      const skipped: string[] = [];
      for (const item of orderItems) {
        if (!item.productId) {
          skipped.push(item.name);
          continue;
        }
        addToCart(
          {
            id: item.productId,
            name: item.name,
            unit: item.unit,
            quantity: 0,
            availability: 'in_stock',
            price: item.unitPrice,
            sku: item.sku,
          },
          item.quantity
        );
      }
      const addedCount = orderItems.length - skipped.length;
      if (skipped.length > 0) {
        toast.warning(`${skipped.length} items skipped (unmatched): ${skipped.join(', ')}`);
      }
      if (addedCount > 0) {
        toast.success(`${addedCount} items added to cart`);
        clearItems();
        navigate('/cart');
      } else {
        toast.error('No items could be added — all products are unmatched.');
      }
    } finally {
      setIsCreating(false);
    }
  }, [orderItems, addToCart, navigate, clearItems]);

  return {
    orderItems,
    activeBranchId,
    switchBranch,
    addItemsFromPredictions,
    addItemsFromMatching,
    addItemFromBrowse,
    addItemsFromTemplate,
    updateQuantity,
    setQuantity,
    removeItem,
    resolveUnmatched,
    totalCost,
    resolvedCount,
    unresolvedCount,
    createOrder,
    isCreating,
    clearItems,
    branchItems,
  };
}
