import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Clock, Plus, CheckCircle2, Sparkles, Pencil } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Product } from '@/components/products/ProductTypes';
import { toast } from 'sonner';

export interface PredictionItem {
  name: string;
  qty: number;
  unit: string;
  raw: string; // original line
}

/** Parse "Product Name 5kg" → PredictionItem */
export function parsePredictionText(text: string): PredictionItem[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(.+?)\s+([\d.]+)\s*(\w+)$/);
      if (match) {
        return {
          name: match[1].trim(),
          qty: parseFloat(match[2]),
          unit: match[3],
          raw: line,
        };
      }
      return { name: line, qty: 1, unit: 'kg', raw: line };
    });
}

interface PredictionsListProps {
  branchName: string;
  tomorrowDay: string;
  predictionText: string;
  onEdit: () => void;
}

const PredictionsList: React.FC<PredictionsListProps> = ({
  branchName,
  tomorrowDay,
  predictionText,
  onEdit,
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

  return (
    <Card className="h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-muted rounded-lg">
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-medium text-sm font-playfair">AI Prediction</h3>
            <p className="text-[11px] text-muted-foreground font-rubik">
              {tomorrowDay} · {branchName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs font-rubik gap-1 text-primary hover:text-primary"
            onClick={onEdit}
          >
            <Pencil className="h-3 w-3" />
            Edit Order
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs font-rubik text-primary hover:text-primary"
            onClick={handleAddAll}
            disabled={allAdded || items.length === 0}
          >
            {allAdded ? 'All added' : 'Add all'}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Date subtitle */}
      <div className="px-5 pt-3 pb-1">
        <div className="flex items-center gap-1.5">
          <Badge
            variant="outline"
            className="text-[10px] font-rubik gap-1 border-muted-foreground/20 text-muted-foreground"
          >
            <Sparkles className="h-2.5 w-2.5" />
            {items.length} items predicted
          </Badge>
        </div>
      </div>

      {/* Product list */}
      <CardContent className="px-2 pb-4 pt-1">
        <ScrollArea className="h-[calc(100vh-340px)]">
          <div className="space-y-0">
            {items.map((item, i) => {
              const isAdded = addedIds.has(i);
              return (
                <div
                  key={i}
                  className={`flex items-center justify-between px-3 py-3 rounded-lg transition-colors ${
                    isAdded
                      ? 'bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-rubik text-foreground">
                      {item.name}
                    </span>
                    <span className="text-sm font-rubik text-muted-foreground ml-1.5">
                      {item.qty}{item.unit}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 shrink-0 ${
                      isAdded
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-primary'
                    }`}
                    onClick={() => handleAdd(item, i)}
                    disabled={isAdded}
                  >
                    {isAdded ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              );
            })}
            {items.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground font-rubik">
                  No predictions available
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default PredictionsList;
