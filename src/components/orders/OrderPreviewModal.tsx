
import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CartItem } from "@/context/CartContext";
import { Check, ShoppingBag, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface OrderPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  cartTotal: number;
  onPlaceOrder: () => void;
  isPlacingOrder?: boolean;
}

const OrderPreviewModal: React.FC<OrderPreviewModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  cartTotal,
  onPlaceOrder,
  isPlacingOrder = false
}) => {
  const deliveryFee = 40;
  const tax = cartTotal * 0.05;
  const totalAmount = cartTotal + deliveryFee + tax;
  const navigate = useNavigate();
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  
  // Debug the calculations
  console.log('OrderPreviewModal - cartItems:', cartItems);
  console.log('OrderPreviewModal - cartTotal:', cartTotal);
  console.log('OrderPreviewModal - delivery fee:', deliveryFee);
  console.log('OrderPreviewModal - tax:', tax);
  console.log('OrderPreviewModal - total amount:', totalAmount);
  
  // Free delivery for orders above ₹500
  const hasFreeDelivery = cartTotal >= 500;
  const finalAmount = hasFreeDelivery ? (cartTotal + tax) : totalAmount;
  
  console.log('OrderPreviewModal - hasFreeDelivery:', hasFreeDelivery);
  console.log('OrderPreviewModal - finalAmount:', finalAmount);
  
  const handlePlaceOrder = () => {
    console.log('OrderPreviewModal: handlePlaceOrder called');
    
    try {
      // Simply call the place order function from props
      // The parent component will handle success/error toasts and navigation
      onPlaceOrder();
      console.log('OrderPreviewModal: onPlaceOrder function called successfully');
    } catch (error) {
      console.error('OrderPreviewModal: Error calling onPlaceOrder:', error);
    }
  };
  
  console.log('OrderPreviewModal rendering, isOpen:', isOpen);
  
  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        console.log('Dialog onOpenChange called with value:', open);
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <DialogHeader className="bg-farmaze-orange text-white p-6">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Order Preview
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <h3 className="font-semibold text-farmaze-brown mb-2 flex items-center">
            Order Items
            <span className="text-green-600 ml-2 text-sm font-medium">
              ({itemCount} {itemCount === 1 ? 'item' : 'items'})
            </span>
          </h3>
          <div className="space-y-4 mb-6">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 rounded-md p-2 h-10 w-10 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">{item.quantity}x</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">₹{item.price?.toFixed(1) || '0.0'} per {item.unit}</p>
                  </div>
                </div>
                <p className="font-semibold text-farmaze-brown">
                  ₹{((item.price || 0) * item.quantity).toFixed(1)}
                </p>
              </div>
            ))}
          </div>
          
          <Separator className="my-4" />
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span>₹{cartTotal.toFixed(1)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Delivery Fee</span>
              {hasFreeDelivery ? (
                <span className="text-green-600 font-medium">FREE</span>
              ) : (
                <span>₹{deliveryFee.toFixed(1)}</span>
              )}
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax (5%)</span>
              <span>₹{tax.toFixed(1)}</span>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>₹{finalAmount.toFixed(1)}</span>
          </div>
          
          {hasFreeDelivery && (
            <div className="mt-2 rounded-md bg-green-50 p-2 flex items-center gap-2 text-sm text-green-700">
              <Check className="h-4 w-4" />
              <span>Free delivery applied (Orders above ₹500)</span>
            </div>
          )}
          
          <div className="mt-4 rounded-md bg-blue-50 p-2 flex items-center gap-2 text-sm text-blue-700">
            <span>Estimated delivery within 24 hours</span>
          </div>
        </div>
        
        <DialogFooter className="border-t p-4 flex-col gap-4">
          <Button 
            variant="farmaze" 
            className="w-full py-6 text-lg font-bold" 
            onClick={() => {
              console.log('BUTTON CLICKED: Place Order button clicked directly');
              console.log('isPlacingOrder:', isPlacingOrder);
              console.log('onPlaceOrder function exists:', !!onPlaceOrder);
              onPlaceOrder();
            }}
            disabled={isPlacingOrder}
          >
            {isPlacingOrder ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Placing Order...
              </>
            ) : (
              <>
                <Check className="mr-3 h-5 w-5" />
                Place Order Now
              </>
            )}
          </Button>
          <Button 
            variant="outline" 
            className="border-gray-300 w-full" 
            onClick={onClose}
            disabled={isPlacingOrder}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default OrderPreviewModal;
