import React from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Send } from 'lucide-react';
import type { MatchedProduct } from './types';

interface SummaryBarProps {
  items: MatchedProduct[];
  estimatedCost: number;
  onAddAllToCart: () => void;
  onSendToAdmin: () => void;
  isAdding?: boolean;
}

const SummaryBar: React.FC<SummaryBarProps> = ({
  items,
  estimatedCost,
  onAddAllToCart,
  onSendToAdmin,
  isAdding = false,
}) => {
  const totalItems = items.length;
  const matchedCount = items.filter(
    (i) => i.status === 'matched' || (i.status === 'partial' && i.matchedName)
  ).length;
  const allResolved = matchedCount === totalItems && totalItems > 0;
  const progressPercent = totalItems > 0 ? Math.round((matchedCount / totalItems) * 100) : 0;

  if (totalItems === 0) return null;

  return (
    <div className="sticky bottom-0 z-10 rounded-xl bg-white border border-border shadow-lg p-4 mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Progress info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: allResolved
                    ? 'hsl(var(--insight-positive-accent))'
                    : 'hsl(var(--primary))',
                }}
              />
            </div>
            <span className="text-sm font-rubik text-muted-foreground">
              <span className="font-semibold text-foreground">{matchedCount}</span> of{' '}
              <span className="font-semibold text-foreground">{totalItems}</span> items matched
            </span>
          </div>

          {estimatedCost > 0 && (
            <span className="text-sm font-rubik text-muted-foreground hidden sm:inline">
              Est. cost:{' '}
              <span className="font-semibold text-foreground">
                ₹{estimatedCost.toLocaleString('en-IN')}
              </span>
            </span>
          )}
        </div>

        {/* Actions */}
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
            disabled={!allResolved || isAdding}
            className="font-rubik text-sm button-modern bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <ShoppingCart className="h-4 w-4 mr-1.5" />
            {isAdding ? 'Adding...' : 'Add All to Cart'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SummaryBar;
