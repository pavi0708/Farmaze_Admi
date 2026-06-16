import React, { useState, useRef, useEffect } from "react";
import { Plus, Minus, Trash2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product } from "./ProductTypes";
import { useCart } from "@/context/CartContext";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProductListProps {
  products: Product[];
  handleQuantityChange: (id: string, change: number) => void;
  readOnly?: boolean;
  handleRemoveFromCart?: (id: string) => void;
}

const ProductList: React.FC<ProductListProps> = ({ 
  products, 
  handleQuantityChange, 
  readOnly = false, 
  handleRemoveFromCart: externalRemoveHandler 
}) => {
  const { removeFromCart, items: cartItems, updateQuantity: updateCartQuantity, addToCart } = useCart();
  const [animatingItems, setAnimatingItems] = useState<Record<string, boolean>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Helper function to get cart quantity
  const getCartQuantity = (productId: string) => {
    const cartItem = cartItems.find(item => item.id === productId);
    return cartItem?.quantity || 0;
  };

  // Helper function to handle availability display
  const getAvailabilityText = (availability: any): string => {
    if (!availability) return '';
    if (typeof availability === 'string') return availability;
    if (typeof availability === 'object' && 'String' in availability) {
      return availability.String || '';
    }
    return '';
  };

  if (products.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">No products found. Try adjusting your search.</p>
      </div>
    );
  }

  const handleRemoveItem = (id: string) => {
    if (externalRemoveHandler) {
      externalRemoveHandler(id);
    } else {
      removeFromCart(id);
      handleQuantityChange(id, -1000); // Set quantity to 0
      
      // Show feedback
      toast.success("Item removed from cart");
    }
  };

  const handleDirectInput = (id: string, value: string) => {
    const inputValue = value.trim();
    // Only allow numbers
    if (/^\d*$/.test(inputValue)) {
      const newValue = parseInt(inputValue || "0", 10);
      const product = products.find(p => p.id === id);
      
      if (product) {
        // Use updateQuantity which handles both adding new items and updating existing ones
        updateCartQuantity(id, newValue, product);
      }
    }
  };

  const handleInputBlur = (id: string) => {
    const currentQuantity = getCartQuantity(id);
    if (currentQuantity === 0) {
      removeFromCart(id);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      inputRefs.current[id]?.blur();
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 text-xs uppercase text-gray-700">
          <tr>
            <th className="px-6 py-3 text-left">Product</th>
            <th className="px-6 py-3 text-center">Unit</th>
            <th className="px-6 py-3 text-center">Availability</th>
            {!readOnly && (
              <>
                <th className="px-6 py-3 text-center">Quantity</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {products.map((product) => (
            <tr
              key={product.id}
              className={`bg-white hover:bg-gray-50 transition-colors ${
                animatingItems[product.id] ? "animate-item-added-pulse" : ""
              }`}
            >
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                {product.name}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500 text-center">
                {product.unit}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500 text-center">
                {getAvailabilityText(product.availability)}
              </td>
              {!readOnly && (
                <>
                  <td className="px-6 py-4 text-sm text-gray-500 text-center">
                    <div className="flex items-center justify-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-r-none border-r-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                const currentQty = getCartQuantity(product.id);
                                if (currentQty <= 0) return;

                                const newQty = currentQty - 1;

                                // Update cart directly
                                updateCartQuantity(product.id, newQty);

                                // Trigger animation
                                setAnimatingItems(prev => ({ ...prev, [product.id]: true }));
                                setTimeout(() => {
                                  setAnimatingItems(prev => ({ ...prev, [product.id]: false }));
                                }, 1000);

                                if (newQty === 0) {
                                  toast.success(`${product.name} removed from cart`);
                                } else {
                                  toast.success(`Removed 1 ${product.name} from cart`);
                                }
                              }}
                              disabled={getCartQuantity(product.id) <= 0}
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Decrease quantity</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <div className="relative w-16">
                        <Input
                          ref={(el) => (inputRefs.current[product.id] = el)}
                          type="text"
                          value={getCartQuantity(product.id) > 0 ? getCartQuantity(product.id).toString() : ""}
                          onChange={(e) => handleDirectInput(product.id, e.target.value)}
                          className={`h-8 w-16 text-center rounded-none border-x-0 ${
                            cartItems.some((item) => item.id === product.id)
                              ? "bg-farmaze-orange/10"
                              : ""
                          }`}
                          onBlur={() => handleInputBlur(product.id)}
                          onKeyDown={(e) => handleInputKeyDown(e, product.id)}
                          aria-label={`Quantity for ${product.name}`}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder=""
                        />
                      </div>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="farmaze"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-l-none border-l-0 relative overflow-hidden flex items-center justify-center"
                              onClick={(e) => {
                                e.stopPropagation(); // Stop event bubbling
                                const currentQty = getCartQuantity(product.id);

                                // Use updateQuantity which handles both adding new items and updating existing ones
                                updateCartQuantity(product.id, currentQty + 1, product);

                                // Trigger animation
                                setAnimatingItems((prev) => ({ ...prev, [product.id]: true }));
                                setTimeout(() => {
                                  setAnimatingItems((prev) => ({ ...prev, [product.id]: false }));
                                }, 1000);

                                toast.success(`${product.name} added to cart`);
                              }}
                              aria-label="Add to cart"
                            >
                              <Plus className="h-4 w-4 text-white" />
                              {animatingItems[product.id] && (
                                <span className="absolute inset-0 bg-green-400/20 animate-ping-slow"></span>
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Add to cart</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="text-xs text-gray-400 mt-1 flex items-center justify-center">
                      <ShoppingCart className="inline-block h-3 w-3 mr-1" />
                      <span>Type or use buttons to add</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-center">
                    {getCartQuantity(product.id) > 0 ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 p-0 px-2 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 flex items-center gap-1"
                              onClick={() => handleRemoveItem(product.id)}
                              aria-label="Remove from cart"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only md:not-sr-only md:inline-block">Remove</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Remove from cart</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : null}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductList;
