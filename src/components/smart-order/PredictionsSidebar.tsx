import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Clock, Plus, CheckCircle2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Product } from '@/components/products/ProductTypes';
import { toast } from 'sonner';

export interface PredictionItem {
  name: string;
  qty: number;
  unit: string;
  productId?: string;
}

export function parsePredictionText(text: string): PredictionItem[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(.+?)\s+([\d.]+)\s*(\w+)$/);
      if (match) {
        return { name: match[1].trim(), qty: parseFloat(match[2]), unit: match[3] };
      }
      return { name: line, qty: 1, unit: 'kg' };
    });
}

interface PredictionsSidebarProps {
  predictionText: string;
  tomorrowDay: string;
}

const PredictionsSidebar: React.FC<PredictionsSidebarProps> = ({
  predictionText,
  tomorrowDay,
}) => {
  const { addToCart } = useCart();
  const items = parsePredictionText(predictionText);
  const [addedIds, setAddedIds] = React.useState<Set<number>>(new Set());

  const handleAdd = (item: PredictionItem, index: number) => {
    const product: Product = {
      id: `pred-${item.name.replace(/\s+/g, '-').toLowerCase()}`,
      name: item.name,
      unit: item.unit,
      quantity: 0,
      availability: '24 hrs delivery',
    };
    addToCart(product, item.qty);
    setAddedIds((prev) => new Set(prev).add(index));
  };

  const handleAddAll = () => {
    items.forEach((item, i) => {
      if (!addedIds.has(i)) {
        const product: Product = {
          id: `pred-${item.name.replace(/\s+/g, '-').toLowerCase()}`,
          name: item.name,
          unit: item.unit,
          quantity: 0,
          availability: '24 hrs delivery',
        };
        addToCart(product, item.qty);
      }
    });
    setAddedIds(new Set(items.map((_, i) => i)));
    toast.success(`Added ${items.length} items to cart`);
  };

  const allAdded = items.length > 0 && addedIds.size === items.length;

  if (items.length === 0) return null;

  return (
    <Card className="w-full lg:w-72 shrink-0 lg:sticky lg:top-4 self-start">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm font-playfair">Last Order</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs font-rubik text-primary hover:text-primary px-2"
          onClick={handleAddAll}
          disabled={allAdded}
        >
          {allAdded ? 'Added' : 'Add all'}
        </Button>
      </div>

      <Separator />

      {/* Day label */}
      <div className="px-4 pt-2.5 pb-1">
        <p className="text-xs text-muted-foreground font-rubik">{tomorrowDay}</p>
      </div>

      {/* Items */}
      <ScrollArea className="max-h-[360px]">
        <div className="px-2 pb-3">
          {items.map((item, i) => {
            const isAdded = addedIds.has(i);
            return (
              <div
                key={i}
                className="flex items-center justify-between px-2 py-2.5 hover:bg-muted/40 rounded-md transition-colors"
              >
                <span className="text-sm font-rubik text-foreground">
                  {item.name} {item.qty}{item.unit}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-7 w-7 ${
                    isAdded ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                  }`}
                  onClick={() => handleAdd(item, i)}
                  disabled={isAdded}
                >
                  {isAdded ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default PredictionsSidebar;
