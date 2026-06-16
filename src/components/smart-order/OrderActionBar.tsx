import React from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Loader2 } from 'lucide-react';
import type { OrderItem } from './types';

interface OrderActionBarProps {
  items: OrderItem[];
  unresolvedCount: number;
  onCreateOrder: () => void;
  isCreating: boolean;
}

const OrderActionBar: React.FC<OrderActionBarProps> = ({
  items,
  unresolvedCount,
  onCreateOrder,
  isCreating,
}) => {
  if (items.length === 0) return null;

  return (
    <div className="sticky bottom-0 z-10 px-4 py-2.5 bg-card/95 backdrop-blur-sm border-t border-border/60">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-rubik text-muted-foreground">
          {items.length} item{items.length !== 1 ? 's' : ''}
          {unresolvedCount > 0 && (
            <span className="text-amber-600 ml-1">
              · {unresolvedCount} unmatched
            </span>
          )}
        </p>
        <Button
          onClick={onCreateOrder}
          disabled={items.length === 0 || isCreating}
          size="sm"
          className="h-8 text-xs font-rubik gap-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
        >
          {isCreating ? (
            <><Loader2 className="h-3 w-3 animate-spin" />Adding...</>
          ) : (
            <><ShoppingCart className="h-3 w-3" />Add to Cart</>
          )}
        </Button>
      </div>
    </div>
  );
};

export default OrderActionBar;
