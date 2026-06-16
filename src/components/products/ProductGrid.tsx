
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { Plus, Minus, Check, ShoppingBag, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Product } from "@/components/products/ProductTypes";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, isLoading }) => {
  const { isLoggedIn } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [selectedProducts, setSelectedProducts] = useState<Record<string, number>>({});
  const [recentlyAdded, setRecentlyAdded] = useState<Record<string, boolean>>({});

  // Clear the recently added status after animation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Object.keys(recentlyAdded).length > 0) {
        setRecentlyAdded({});
      }
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [recentlyAdded]);

  const handleSelectProduct = (product: Product) => {
    if (!isLoggedIn) {
      navigate("/login", { 
        state: { 
          from: `/smart-order`,
          message: "Please log in to add products to your cart" 
        } 
      });
      return;
    }
    
    setSelectedProducts(prev => {
      const currentQty = prev[product.id] || 0;
      const newQty = currentQty + 1;
      return { ...prev, [product.id]: newQty };
    });
    
    // Set recently added status for animation
    setRecentlyAdded(prev => ({
      ...prev,
      [product.id]: true
    }));
    
    // Add to cart and show enhanced toast with View Cart button
    addToCart(product, 1);
    
    toast({
      title: `Added ${product.name} to order`,
      description: "Click 'View Cart' to complete your order",
      action: {
        label: "View Cart",
        onClick: () => navigate('/cart')
      }
    });
  };

  const handleDecreaseQuantity = (product: Product) => {
    setSelectedProducts(prev => {
      const currentQty = prev[product.id] || 0;
      if (currentQty <= 1) {
        const newSelected = { ...prev };
        delete newSelected[product.id];
        return newSelected;
      }
      return { ...prev, [product.id]: currentQty - 1 };
    });
    
    // Modify cart directly
    if (selectedProducts[product.id] > 0) {
      // We're using negative quantity to remove
      addToCart(product, -1);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {Array(6).fill(0).map((_, i) => (
          <div key={i} className="flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden">
            <Skeleton className="h-48 w-full mb-3" />
            <div className="p-4">
              <Skeleton className="h-5 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-3" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-10 w-24 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-lg shadow-sm">
        <p className="text-gray-500 font-medium">No products found</p>
        <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or search term</p>
        <button 
          className="mt-4 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium"
          onClick={() => window.location.href = "/smart-order"}
        >
          Clear All Filters
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {products.map((product) => {
        const isSelected = selectedProducts[product.id] > 0;
        const quantity = selectedProducts[product.id] || 0;
        const isRecentlyAdded = recentlyAdded[product.id];
        
        return (
          <Card 
            key={product.id} 
            className={`overflow-hidden transition-all duration-300 ${
              isSelected ? 'ring-2 ring-farmaze-orange ring-opacity-50' : ''
            } ${
              isRecentlyAdded ? 'scale-105 shadow-lg' : ''
            }`}
          >
            <div className="p-4">
              {/* Product Image */}
              <div className="relative mb-3 h-36 flex items-center justify-center bg-white">
                <img 
                  src={product.imageUrl || '/placeholder.svg'} 
                  alt={product.name}
                  className="h-full object-contain"
                />
                
                {product.unit && (
                  <div className="absolute bottom-0 right-0 bg-white/80 backdrop-blur-sm rounded-tl-md px-2 py-1 text-xs font-medium">
                    {product.weight || "1"} {product.unit}
                  </div>
                )}
                
                {isRecentlyAdded && (
                  <div className="absolute top-0 right-0 bg-farmaze-orange text-white px-2 py-1 rounded-bl-md text-xs font-medium animate-pulse">
                    Added!
                  </div>
                )}
              </div>
              
              {/* Product Details */}
              <div className="space-y-2">
                <h3 className="font-medium text-gray-900 text-sm">
                  {product.name}
                </h3>
                
                {product.description && (
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {product.description}
                  </p>
                )}
                
                {/* Price & Special Badges */}
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold text-farmaze-orange">
                    ₹{product.price}
                  </div>
                  <Badge className="bg-blue-600 text-white text-xs">SUPERSAVER</Badge>
                </div>
                
                {/* Action Area */}
                {isSelected ? (
                  <div className="flex items-center justify-between mt-3">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-9 w-9 p-0" 
                      onClick={() => handleDecreaseQuantity(product)}
                    >
                      <Minus size={16} />
                    </Button>
                    <span className="font-medium text-gray-900">{quantity}</span>
                    <Button 
                      variant="farmaze" 
                      size="sm"
                      className="h-9 w-9 p-0" 
                      onClick={() => handleSelectProduct(product)}
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2 mt-3">
                    <Button 
                      variant="outline" 
                      className="w-full border-farmaze-orange text-farmaze-orange hover:bg-farmaze-orange hover:text-white transition-colors"
                      onClick={() => handleSelectProduct(product)}
                    >
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Add to Order
                    </Button>
                    
                    {isRecentlyAdded && (
                      <Button
                        variant="farmaze"
                        size="sm"
                        className="w-full animate-pulse"
                        onClick={() => navigate('/cart')}
                      >
                        View Cart <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default ProductGrid;
