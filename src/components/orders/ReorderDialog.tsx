import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Minus, Plus, X, ShoppingCart, Loader2, Package } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Product } from '@/components/products/ProductTypes';
import { OrderDetail } from '@/api/orderApi';
import orderApi from '@/api/orderApi';
import { toast } from 'sonner';

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: string;
  estimatedDelivery: string;
  items: number;
  totalAmount: number;
  products?: {
    id: string;
    name: string;
    unit: string;
    quantity: number;
    price: number;
  }[];
  deliveryFee?: number;
  tax?: number;
  hasFreeDelivery?: boolean;
  time?: string;
  uuid?: string;
  invoiceStatus?: string;
}

interface ReorderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  isRemoved: boolean;
}

interface ReorderDialogProps {
  order: Order;
  open: boolean;
  onClose: () => void;
}

export const ReorderDialog: React.FC<ReorderDialogProps> = ({ order, open, onClose }) => {
  const { addToCart } = useCart();
  const [items, setItems] = useState<ReorderItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch order items when dialog opens
  useEffect(() => {
    if (open && order) {
      fetchOrderItems();
    }
  }, [open, order]);

  const fetchOrderItems = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const orderId = order.uuid || order.id;
      const orderItems = await orderApi.getOrderItems(orderId, order.date, true);

      if (orderItems.length === 0) {
        setError('No items found for this order.');
        setItems([]);
      } else {
        const reorderItems: ReorderItem[] = orderItems.map((item: OrderDetail) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price || 0,
          isRemoved: false,
        }));
        setItems(reorderItems);
      }
    } catch (err) {
      console.error('Failed to fetch order items for reorder:', err);
      setError('Failed to load order items. Please try again.');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 0.5) return;
    setItems(prev => prev.map((item, i) =>
      i === index ? { ...item, quantity: newQuantity } : item
    ));
  };

  const handleQuantityChange = (index: number, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setItems(prev => prev.map((item, i) =>
        i === index ? { ...item, quantity: numValue } : item
      ));
    }
  };

  const removeItem = (index: number) => {
    setItems(prev => prev.map((item, i) =>
      i === index ? { ...item, isRemoved: true } : item
    ));
  };

  const restoreItem = (index: number) => {
    setItems(prev => prev.map((item, i) =>
      i === index ? { ...item, isRemoved: false } : item
    ));
  };

  const activeItems = items.filter(item => !item.isRemoved);

  const handleAddAllToCart = () => {
    if (activeItems.length === 0) return;

    activeItems.forEach(item => {
      const product: Product = {
        id: item.product_id,
        name: item.product_name,
        unit: item.unit,
        price: item.unit_price,
        quantity: 0,
        availability: '24 hrs delivery',
      };
      addToCart(product, item.quantity);
    });

    toast.success(`Added ${activeItems.length} item${activeItems.length !== 1 ? 's' : ''} to cart`);
    onClose();
  };

  const handleClose = () => {
    setItems([]);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Reorder - {order.orderNumber}
          </DialogTitle>
          <DialogDescription>
            Review and adjust quantities before adding items to your cart.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-3" />
            <p className="text-sm text-gray-500">Loading order items...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Package className="h-8 w-8 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">{error}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={fetchOrderItems}>
              Try Again
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 max-h-[50vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Product</TableHead>
                    <TableHead className="w-[25%]">Quantity</TableHead>
                    <TableHead className="w-[15%]">Unit</TableHead>
                    <TableHead className="w-[15%] text-right">Price</TableHead>
                    <TableHead className="w-[5%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow
                      key={`${item.product_id}-${index}`}
                      className={item.isRemoved ? 'opacity-40 bg-gray-50' : ''}
                    >
                      <TableCell className="font-medium">
                        <span className={item.isRemoved ? 'line-through text-gray-400' : ''}>
                          {item.product_name}
                        </span>
                      </TableCell>
                      <TableCell>
                        {!item.isRemoved ? (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateQuantity(index, Math.round((item.quantity - 0.5) * 10) / 10)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(index, e.target.value)}
                              className="w-16 h-7 text-center text-sm"
                              min="0.5"
                              step="0.5"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateQuantity(index, Math.round((item.quantity + 0.5) * 10) / 10)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">{item.quantity}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={item.isRemoved ? 'text-gray-400' : 'text-gray-600'}>
                          {item.unit}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={item.isRemoved ? 'text-gray-400' : ''}>
                          {item.unit_price > 0 ? `₹${item.unit_price.toFixed(1)}` : '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {item.isRemoved ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => restoreItem(index)}
                            title="Restore item"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => removeItem(index)}
                            title="Remove item"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            <Separator />

            <DialogFooter className="flex-row justify-between items-center sm:justify-between gap-2 pt-2">
              <p className="text-sm text-gray-500">
                {activeItems.length} of {items.length} item{items.length !== 1 ? 's' : ''} selected
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  variant="farmaze"
                  onClick={handleAddAllToCart}
                  disabled={activeItems.length === 0}
                  className="gap-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Add All to Cart
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
