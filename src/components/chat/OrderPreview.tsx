import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Trash2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

interface OrderPreviewProps {
  items: OrderItem[];
  total: number;
  onConfirm: () => void;
  onClear: () => void;
  className?: string;
}

const OrderPreview: React.FC<OrderPreviewProps> = ({
  items,
  total,
  onConfirm,
  onClear,
  className
}) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <Card className={cn("p-4 space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Order Preview</h3>
          <span className="text-sm text-muted-foreground">
            ({items.length} items)
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={`${item.productId}-${index}`} className="flex items-center justify-between py-2">
            <div className="flex-1">
              <div className="font-medium text-sm">{item.productName}</div>
              <div className="text-xs text-muted-foreground">
                {item.quantity} {item.unit} × ₹{item.unitPrice.toFixed(2)}
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium">
                ₹{(item.quantity * item.unitPrice).toFixed(2)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Separator />

      <div className="flex items-center justify-between font-semibold">
        <span>Total</span>
        <span>₹{total.toFixed(2)}</span>
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          variant="outline"
          onClick={onClear}
          className="flex-1"
        >
          Clear
        </Button>
        <Button
          onClick={onConfirm}
          className="flex-1"
        >
          <Check className="h-4 w-4 mr-2" />
          Add to Cart
        </Button>
      </div>
    </Card>
  );
};

export default OrderPreview;
