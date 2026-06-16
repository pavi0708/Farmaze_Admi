
import React, { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const CartIcon: React.FC = () => {
  const { getItemCount, items } = useCart();
  const navigate = useNavigate();
  const itemCount = getItemCount();
  const [isHighlighted, setIsHighlighted] = useState(false);

  // Add animation effect when items change
  useEffect(() => {
    if (itemCount > 0) {
      setIsHighlighted(true);
      const timer = setTimeout(() => setIsHighlighted(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [items, itemCount]);

  return (
    <Button 
      variant={itemCount > 0 ? "farmaze" : "outline"}
      size="sm"
      onClick={() => navigate('/cart')}
      className={`relative flex items-center gap-2 z-40 px-4 py-2 transition-all duration-300 ${
        isHighlighted ? 'shadow-lg animate-pulse scale-105' : itemCount > 0 ? 'shadow-md' : ''
      }`}
      aria-label={`Shopping Cart with ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
    >
      <div className="relative">
        <ShoppingCart size={22} className={isHighlighted ? 'animate-bounce' : ''} />
      </div>
      <span className="hidden sm:inline font-medium">Cart</span>
        {itemCount > 0 && (
          <span 
            className={`absolute -top-2 -right-2 bg-green-600 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] min-h-[20px] flex items-center justify-center ${
              isHighlighted ? 'ring-2 ring-white animate-pulse' : ''
            }`}
            aria-hidden="true"
          >
            {itemCount}
          </span>
        )}
    </Button>
  );
};

export default CartIcon;
