// LastOrderReview — Shows the last order for quick reorder, with Create Order / Edit Order actions.
// Displayed after branch selection so the client can reorder in one tap without going to step 2.

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Clock,
  ShoppingCart,
  Pencil,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Package,
  Zap,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Product } from '@/components/products/ProductTypes';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import type { Branch } from './BranchSelector';
import { parsePredictionText, PredictionItem } from './PredictionsSidebar';

interface LastOrderReviewProps {
  branch: Branch;
  predictionText: string;
  tomorrowDay: string;
  onCreateOrder: () => void;
  onEditOrder: () => void;
}

const LastOrderReview: React.FC<LastOrderReviewProps> = ({
  branch,
  predictionText,
  tomorrowDay,
  onCreateOrder,
  onEditOrder,
}) => {
  const { addToCart } = useCart();
  const items = useMemo(() => parsePredictionText(predictionText), [predictionText]);

  // Track quantity adjustments per item
  const [quantities, setQuantities] = useState<Record<number, number>>(() => {
    const init: Record<number, number> = {};
    items.forEach((item, i) => {
      init[i] = item.qty;
    });
    return init;
  });

  // Track removed items
  const [removedItems, setRemovedItems] = useState<Set<number>>(new Set());

  const activeItems = items.filter((_, i) => !removedItems.has(i));
  const activeCount = activeItems.length;

  const handleAdjustQty = (index: number, delta: number) => {
    setQuantities((prev) => {
      const current = prev[index] ?? items[index].qty;
      const next = Math.max(0.5, Math.round((current + delta) * 10) / 10);
      return { ...prev, [index]: next };
    });
  };

  const handleRemove = (index: number) => {
    setRemovedItems((prev) => new Set(prev).add(index));
  };

  const handleRestore = (index: number) => {
    setRemovedItems((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  };

  const handleCreateOrder = () => {
    // Add all active items to cart, then trigger order creation
    items.forEach((item, i) => {
      if (removedItems.has(i)) return;
      const qty = quantities[i] ?? item.qty;
      const product: Product = {
        id: `pred-${item.name.replace(/\s+/g, '-').toLowerCase()}`,
        name: item.name,
        unit: item.unit,
        quantity: 0,
        availability: '24 hrs delivery',
      };
      addToCart(product, qty);
    });
    toast.success(`${activeCount} items added to cart`);
    onCreateOrder();
  };

  const handleEditOrder = () => {
    // Add all active items to cart first, then open the editor
    items.forEach((item, i) => {
      if (removedItems.has(i)) return;
      const qty = quantities[i] ?? item.qty;
      const product: Product = {
        id: `pred-${item.name.replace(/\s+/g, '-').toLowerCase()}`,
        name: item.name,
        unit: item.unit,
        quantity: 0,
        availability: '24 hrs delivery',
      };
      addToCart(product, qty);
    });
    onEditOrder();
  };

  if (items.length === 0) {
    return (
      <Card className="overflow-hidden">
        <div className="px-6 py-10 text-center space-y-3">
          <div className="p-3 bg-muted rounded-full w-fit mx-auto">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground font-rubik">
            No previous order found for {branch.name}
          </p>
          <Button
            onClick={onEditOrder}
            className="button-modern bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Order
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold font-playfair">Last Order</h2>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 rounded-full font-rubik">
              {branch.name}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-rubik mt-0.5">
            {tomorrowDay} · {activeCount} item{activeCount !== 1 ? 's' : ''}
            {removedItems.size > 0 && (
              <span className="text-red-500"> · {removedItems.size} removed</span>
            )}
          </p>
        </div>
      </div>

      <Separator />

      {/* Items list */}
      <ScrollArea className="max-h-[400px]">
        <div className="divide-y divide-border">
          <AnimatePresence>
            {items.map((item, i) => {
              const isRemoved = removedItems.has(i);
              const qty = quantities[i] ?? item.qty;

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: isRemoved ? 0.4 : 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className={`flex items-center gap-3 px-6 py-3 group transition-colors ${
                    isRemoved ? 'bg-muted/30' : 'hover:bg-muted/20'
                  }`}
                >
                  {/* Serial number */}
                  <span className="text-[10px] font-mono text-muted-foreground/60 w-5 text-right flex-shrink-0">
                    {i + 1}
                  </span>

                  {/* Product name */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-rubik truncate ${isRemoved ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {item.name}
                    </p>
                  </div>

                  {/* Quantity controls */}
                  {!isRemoved ? (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => handleAdjustQty(i, -0.5)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-semibold font-rubik tabular-nums w-12 text-center">
                        {qty}{item.unit}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                        onClick={() => handleAdjustQty(i, 0.5)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground font-rubik flex-shrink-0">
                      {qty}{item.unit}
                    </span>
                  )}

                  {/* Remove / Restore */}
                  {isRemoved ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs font-rubik text-primary px-2"
                      onClick={() => handleRestore(i)}
                    >
                      Undo
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0"
                      onClick={() => handleRemove(i)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </ScrollArea>

      <Separator />

      {/* Action buttons */}
      <div className="px-6 py-4 flex items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={handleEditOrder}
          className="font-rubik text-sm gap-1.5"
        >
          <Pencil className="h-4 w-4" />
          Edit Order
        </Button>

        <Button
          onClick={handleCreateOrder}
          disabled={activeCount === 0}
          className="button-modern bg-primary hover:bg-primary/90 text-primary-foreground font-rubik text-sm gap-1.5"
        >
          <ShoppingCart className="h-4 w-4" />
          Create Order ({activeCount} items)
        </Button>
      </div>
    </Card>
  );
};

export default LastOrderReview;
