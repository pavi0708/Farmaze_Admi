import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Plus, Minus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Drawer,
  DrawerContent,
  DrawerTrigger,
  DrawerClose
} from "@/components/ui/drawer";
import { useIsMobile } from '@/hooks/use-mobile';
import { Input } from '@/components/ui/input';

interface CartPreviewProps {
  className?: string;
}

const CartPreview: React.FC<CartPreviewProps> = ({ className = '' }) => {
  const { items, getCartTotal, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // Local state to manage input values for quantities
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  
  // Initialize input values from cart items when they change
  useEffect(() => {
    const newInputValues: Record<string, string> = {};
    items.forEach(item => {
      newInputValues[item.id] = item.quantity.toString();
    });
    setInputValues(newInputValues);
  }, [items]);
  
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = getCartTotal();
  
  // Logging to debug
  console.log('CartPreview - items:', items);
  console.log('CartPreview - subtotal calculation:', subtotal);
  console.log('CartPreview - itemCount:', itemCount);
  
  const handleDirectInput = (id: string, value: string) => {
    // Store the input value in local state
    if (value === '' || /^\d+$/.test(value)) {
      setInputValues({
        ...inputValues,
        [id]: value
      });
    }
  };
  
  const handleAdjustQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(id);
    } else {
      updateQuantity(id, newQuantity);
      setInputValues({
        ...inputValues,
        [id]: newQuantity.toString()
      });
    }
  };
  
  const handleBlur = (id: string) => {
    const inputValue = inputValues[id];
    if (inputValue === '' || isNaN(parseInt(inputValue))) {
      // Reset to current item quantity if input is invalid
      const item = items.find(i => i.id === id);
      if (item) {
        setInputValues({
          ...inputValues,
          [id]: item.quantity.toString()
        });
      }
      return;
    }
    
    const newQuantity = parseInt(inputValue, 10);
    if (newQuantity >= 0) {
      handleAdjustQuantity(id, newQuantity);
    }
  };

  const renderCartContent = () => (
    <>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Your Order
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="pb-0">
        {items.length === 0 ? (
          <div className="text-center py-6">
            <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Your cart is empty</p>
            <p className="text-sm text-gray-400 mt-1">Add some products to get started</p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-350px)] md:max-h-[280px] pr-4">
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 py-2">
                  <div className="flex-shrink-0 w-16 h-16 bg-gray-50 rounded-md flex items-center justify-center">
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="h-12 w-12 object-contain" 
                      />
                    ) : (
                      <ShoppingBag className="h-8 w-8 text-gray-300" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-sm text-gray-900 truncate">{item.name}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.weight && item.unit ? `${item.weight} ${item.unit}` : item.unit}
                        </p>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center border rounded-md">
                        <button 
                          onClick={() => handleAdjustQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-1 text-gray-500 hover:bg-gray-50"
                        >
                          <Minus size={14} />
                        </button>
                        <Input
                          value={inputValues[item.id] || ''}
                          onChange={(e) => handleDirectInput(item.id, e.target.value)}
                          onBlur={() => handleBlur(item.id)}
                          className="w-10 h-7 text-center px-0 border-0"
                          type="text"
                          inputMode="numeric"
                        />
                        <button 
                          onClick={() => handleAdjustQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-1 text-gray-500 hover:bg-gray-50"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="font-medium text-farmaze-orange">
                        ₹{((item.price || 0) * item.quantity).toFixed(1)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
      
      {items.length > 0 && (
        <CardFooter className="flex flex-col pt-4">
          <Separator className="mb-4" />
          
          <div className="w-full space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium">₹{subtotal.toFixed(1)}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Delivery</span>
              <span className="font-medium">{subtotal >= 500 ? (
                <span className="text-green-600">Free</span>
              ) : (
                '₹40.0'
              )}</span>
            </div>
            
            <Separator className="my-2" />
            
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>₹{(subtotal + (subtotal >= 500 ? 0 : 40)).toFixed(1)}</span>
            </div>
            
            <Button 
              variant="farmaze" 
              size="lg" 
              className="w-full mt-4"
              onClick={() => navigate('/cart')}
            >
              Proceed to Checkout
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      )}
    </>
  );
  
  // For mobile, we'll use a drawer component
  if (isMobile) {
    return (
      <div className={`fixed bottom-4 right-4 z-40 ${className}`}>
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="farmaze" className="shadow-lg rounded-full h-14 w-14 p-0">
              <ShoppingBag className="h-6 w-6" />
              {itemCount > 0 && (
                <Badge 
                  className="absolute -top-2 -right-2 bg-white text-farmaze-orange border-2 border-farmaze-orange text-xs px-1.5 py-0.5 rounded-full min-w-[20px] min-h-[20px] flex items-center justify-center"
                >
                  {itemCount}
                </Badge>
              )}
            </Button>
          </DrawerTrigger>
          <DrawerContent className="h-[85vh]">
            <Card className="border-0 shadow-none">
              {renderCartContent()}
            </Card>
          </DrawerContent>
        </Drawer>
      </div>
    );
  }
  
  // For desktop, we'll use a regular card
  return (
    <Card className={`shadow-md ${className}`}>
      {renderCartContent()}
    </Card>
  );
};

export default CartPreview;
