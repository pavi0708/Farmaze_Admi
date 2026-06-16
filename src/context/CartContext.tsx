import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/components/products/ProductTypes';
import { useAuth } from './AuthContext';
import api from '@/api/authApi';
import orderApi from '@/api/orderApi';
import { OrderResponse, OrderItem, OrderRequest } from '@/api/orderApi';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  orderDate: Date | undefined;
  orderNotes: string;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number, product?: Product) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getItemCount: () => number;
  setOrderDate: (date: Date | undefined) => void;
  setOrderNotes: (notes: string) => void;
  placeOrder: (orderDate?: string) => Promise<void>;
  isPlacingOrder: boolean;
  hasPreviousCart: (userId: string) => boolean;
  restorePreviousCart: (userId: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [orderDate, setOrderDate] = useState<Date | undefined>(undefined);
  const [orderNotes, setOrderNotes] = useState<string>('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showCartDialog, setShowCartDialog] = useState(false);
  const [previousCartUserId, setPreviousCartUserId] = useState<string | null>(null);
  const { isLoggedIn, user, selectedBranch } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (isLoggedIn && user) {
      const savedCart = localStorage.getItem(`cart-${user.id}`);
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          if (parsedCart.length > 0) {
            setPreviousCartUserId(user.id);
            setShowCartDialog(true);
          }
        } catch (error) {
          console.error('Failed to parse saved cart:', error);
        }
      }
    }
  }, [isLoggedIn, user]);
  
  useEffect(() => {
    if (isLoggedIn && user && items.length > 0) {
      localStorage.setItem(`cart-${user.id}`, JSON.stringify(items));
    }
  }, [items, isLoggedIn, user]);

  // Persist order notes to localStorage
  useEffect(() => {
    if (isLoggedIn && user && orderNotes) {
      localStorage.setItem(`cart-notes-${user.id}`, orderNotes);
    }
  }, [orderNotes, isLoggedIn, user]);

  const hasPreviousCart = (userId: string): boolean => {
    const savedCart = localStorage.getItem(`cart-${userId}`);
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        return parsedCart.length > 0;
      } catch (error) {
        console.error('Failed to parse saved cart:', error);
      }
    }
    return false;
  };

  const restorePreviousCart = (userId: string) => {
    const savedCart = localStorage.getItem(`cart-${userId}`);
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setItems(parsedCart);
        // Also restore saved notes
        const savedNotes = localStorage.getItem(`cart-notes-${userId}`);
        if (savedNotes) {
          setOrderNotes(savedNotes);
        }
        toast({
          title: "Cart restored",
          description: `${parsedCart.length} items have been restored to your cart.`,
        });
      } catch (error) {
        console.error('Failed to parse saved cart:', error);
      }
    }
  };

  const addToCart = (product: Product, quantity: number = 1) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      
      if (existingItem) {
        return prevItems.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + quantity } 
            : item
        );
      } else {
        return [...prevItems, { ...product, quantity }];
      }
    });
    
    toast({
      title: `${product.name} added to cart`,
      description: `Added ${quantity} to your order.`,
      duration: 4000,
      action: (
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-white hover:bg-white/90 border-0"
          onClick={() => navigate('/cart')}
        >
          View Cart
        </Button>
      ),
    });
  };

  const removeFromCart = (productId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number, product?: Product) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === productId);
      
      if (existingItem) {
        // Update existing item
        return prevItems.map(item => 
          item.id === productId ? { ...item, quantity } : item
        );
      } else if (product) {
        // Add new item to cart
        return [...prevItems, { ...product, quantity }];
      } else {
        // Product not found and no product data provided
        console.warn(`Product with id ${productId} not found in cart and no product data provided`);
        return prevItems;
      }
    });
  };

  const clearCart = () => {
    setItems([]);
    setOrderNotes('');
    if (isLoggedIn && user) {
      localStorage.removeItem(`cart-${user.id}`);
      localStorage.removeItem(`cart-notes-${user.id}`);
    }

    toast({
      title: 'Cart emptied',
      duration: 1500,
    });
  };

  const getCartTotal = () => {
    console.log('Cart items for total calculation:', items);
    const total = items.reduce((total, item) => {
      const itemPrice = item.price || 0;
      const itemTotal = itemPrice * item.quantity;
      console.log(`Item ${item.name}: price=${itemPrice}, quantity=${item.quantity}, total=${itemTotal}`);
      return total + itemTotal;
    }, 0);
    console.log('Final cart total:', total);
    return total;
  };

  const getItemCount = () => {
    // return items.reduce((count, item) => count + item.quantity, 0);
    return items.length;
  };

  const placeOrder = async (orderDate?: string) => {
    console.log('CartContext: placeOrder called - START');
    console.log('Cart items:', items);
    console.log('Order date:', orderDate);
    console.log('isPlacingOrder:', isPlacingOrder);
    
    if (items.length === 0) {
      toast({
        title: "Your cart is empty",
        description: "Add some items first!",
        variant: "destructive"
      });
      return;
    }
    
    try {
      console.log('Setting isPlacingOrder to true');
      setIsPlacingOrder(true);
      
      const branchId = selectedBranch?.id;
      console.log('Calling orderApi.placeOrder with items, orderDate, notes, and branchId:', items, orderDate, orderNotes, branchId);
      const orderResponse = await orderApi.placeOrder(items, orderDate, orderNotes || undefined, branchId);
      
      console.log('Order placed successfully:', orderResponse);
      
      console.log('Clearing cart');
      clearCart();
      
      console.log('Showing success toast');
      toast({
        title: "Order placed successfully!",
        description: `Order #${orderResponse.order_number} has been placed.`,
        variant: "default"
      });
      
      console.log('Navigating to order success page');
      navigate(`/order/success/${orderResponse.order_id}`);
    } catch (error) {
      console.error('Error placing order:', error);
      const apiMessage = error?.response?.data?.message || error?.response?.data?.error || '';
      const isTimeWindow = apiMessage.toLowerCase().includes('time window') || apiMessage.toLowerCase().includes('not accepted');
      
      if (isTimeWindow) {
        toast({
          title: "Ordering window closed",
          description: apiMessage || "Orders are not accepted at this time. Please try again during the ordering window.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Failed to place order",
          description: apiMessage || "Please try again later.",
          variant: "destructive"
        });
      }
    } finally {
      console.log('Setting isPlacingOrder to false');
      setIsPlacingOrder(false);
      console.log('CartContext: placeOrder called - END');
    }
  };

  return (
    <CartContext.Provider value={{
      items,
      orderDate,
      orderNotes,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getItemCount,
      setOrderDate,
      setOrderNotes,
      placeOrder,
      isPlacingOrder,
      hasPreviousCart,
      restorePreviousCart,
    }}>
      {children}
      
      <AlertDialog open={showCartDialog} onOpenChange={setShowCartDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Your Cart?</AlertDialogTitle>
            <AlertDialogDescription>
              We found items in your previous shopping cart. Would you like to restore these items or start with an empty cart?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              if (previousCartUserId) {
                localStorage.removeItem(`cart-${previousCartUserId}`);
              }
              setShowCartDialog(false);
              setPreviousCartUserId(null);
            }}>
              Start Empty
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (previousCartUserId) {
                restorePreviousCart(previousCartUserId);
              }
              setShowCartDialog(false);
              setPreviousCartUserId(null);
            }}>
              Restore Cart
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
