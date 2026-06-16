
import React, { useState, useEffect } from "react";
import { Search, Plus, Minus, Check, ShoppingCart, X, Sparkle, Loader2 } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface SuggestedProduct {
  id: string;
  name: string;
  unit: string;
  unitType: string;
  quantity: number;
  predictedQuantity?: number; // Field for AI prediction
  image?: string;
  category?: string;
  popular?: boolean;
  price?: number; // Product price
}

// Import the analytics API
import analyticsApi from '@/api/analyticsApi';
import productApi from '@/api/productApi';
import { Product } from '@/components/products/ProductTypes';

// We'll load suggested products from the API instead of using mock data

interface SuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (products: SuggestedProduct[]) => void;
  currentDay: string; // Current day of the week
}

const SuggestionModal: React.FC<SuggestionModalProps> = ({ 
  isOpen, 
  onClose,
  onAddToCart,
  currentDay
}) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<SuggestedProduct[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [suggestedProducts, setSuggestedProducts] = useState<SuggestedProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch suggestions from the API when the modal opens
  useEffect(() => {
    if (isOpen) {
      fetchSuggestions();
    }
  }, [isOpen]);
  
  // Fetch suggestions from the API
  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Capitalize the first letter of the day name for the API
      const formattedDay = currentDay.charAt(0).toUpperCase() + currentDay.slice(1);
      console.log(`Fetching suggestions for ${formattedDay}`);
      
      // Fetch suggestions from the analytics API
      const result = await analyticsApi.getProductSuggestionsForDay(formattedDay);
      const suggestionsData = result.suggestions;

      console.log('Received suggestions data:', suggestionsData);

      // Map suggestions directly without needing to fetch all products
      const mappedSuggestions = suggestionsData
        .map(suggestion => {
          // Use the data directly from the suggestions API
          return {
            id: suggestion.id || suggestion.product_id,
            name: suggestion.name || suggestion.product_name,
            unit: suggestion.unit || suggestion.product_unit,
            unitType: suggestion.unit || suggestion.product_unit,
            quantity: Math.round(suggestion.suggested_quantity), // Initialize with predicted quantity
            predictedQuantity: Math.round(suggestion.suggested_quantity), // Round to nearest whole number
            category: 'Suggested', // Default category for all suggestions
            popular: suggestion.order_frequency ? suggestion.order_frequency > 30 : false,
            price: 0, // We don't have price info from suggestions API
            sku: suggestion.sku || suggestion.product_sku
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);
      
      setSuggestedProducts(mappedSuggestions);
      setSelectedProducts(mappedSuggestions);
    } catch (err) {
      console.error('Error fetching AI order suggestions:', err);
      setError('Failed to load AI order suggestions. Please try again later.');
      setSuggestedProducts([]);
      setSelectedProducts([]);
    } finally {
      setLoading(false);
    }
  };
  
  const handleQuantityChange = (id: string, change: number) => {
    setSelectedProducts(selectedProducts.map(product => {
      if (product.id === id) {
        return {
          ...product,
          quantity: Math.max(0, product.quantity + change)
        };
      }
      return product;
    }));
  };

  const useRecommendedQuantity = (id: string) => {
    setSelectedProducts(selectedProducts.map(product => {
      if (product.id === id && product.predictedQuantity) {
        return {
          ...product,
          quantity: product.predictedQuantity
        };
      }
      return product;
    }));
  };
  
  const categories = Array.from(new Set(suggestedProducts.map(p => p.category))).filter(Boolean);

  // Helper function to format day name
  const formattedDay = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };
  
  const filteredProducts = selectedProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !activeCategory || product.category === activeCategory;
    return matchesSearch && matchesCategory;
  });
  
  const handleAddToCart = () => {
    const productsToAdd = selectedProducts.filter(product => product.quantity > 0);
    onAddToCart(productsToAdd);
    onClose();
  };
  
  const popularProducts = selectedProducts.filter(p => p.popular);
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="p-6 border-b">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl font-bold text-farmaze-brown flex items-center">
              <Sparkle size={20} className="text-farmaze-orange mr-2" />
              AI Order Forecast
            </DialogTitle>
            {/* <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
              <X size={18} />
            </Button> */}
          </div>
          
          {loading ? (
            <div className="mt-4 flex justify-center items-center">
              <Loader2 size={20} className="animate-spin text-farmaze-orange mr-2" />
              <span>Loading predictions...</span>
            </div>
          ) : error ? (
            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md text-sm">
              <p>{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={fetchSuggestions}
              >
                Try Again
              </Button>
            </div>
          ) : (
            <div className="relative mt-4">
              <Input 
                placeholder="Search predictions..." 
                className="pl-10 bg-gray-100 border-gray-300 rounded-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>
          )}
        </DialogHeader>
        

        
        <div className="p-6 overflow-y-auto max-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-farmaze-orange mb-4" />
              <p className="text-gray-500">Loading AI predictions...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={fetchSuggestions}>Try Again</Button>
            </div>
          ) : suggestedProducts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No predictions available for {formattedDay(currentDay)}.</p>
            </div>
          ) : (
            <div className="flex flex-col space-y-4">
              {filteredProducts.map((product) => (
                <div 
                  key={product.id} 
                  className={`
                    p-4 border rounded-lg transition-all
                    ${product.quantity > 0 
                      ? 'border-farmaze-orange/30 bg-farmaze-orange/5 shadow-sm' 
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="font-medium text-farmaze-brown">{product.name}</h3>
                        <span className="ml-2 text-sm text-gray-500">{product.unit}</span>
                        {/* {product.price && (
                          <span className="ml-2 text-sm font-medium text-farmaze-orange">₹{product.price.toFixed(2)}</span>
                        )} */}
                      </div>
                      {/* <div className="flex items-center mt-2">
                        {product.predictedQuantity && (
                          <Badge variant="outline" className="text-xs mr-2">
                            AI suggests: {product.predictedQuantity} {product.unit}
                          </Badge>
                        )}
                        {product.popular && (
                          <Badge variant="secondary" className="text-xs">
                            Popular on {formattedDay(currentDay)}
                          </Badge>
                        )}
                      </div> */}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-l-md"
                          onClick={() => handleQuantityChange(product.id, -1)}
                          disabled={product.quantity <= 0}
                        >
                          <Minus size={14} />
                        </Button>
                        <input
                          type="number"
                          value={product.quantity}
                          onChange={(e) => {
                            const newQuantity = parseInt(e.target.value) || 0;
                            setSelectedProducts(selectedProducts.map(p => 
                              p.id === product.id ? {...p, quantity: newQuantity} : p
                            ));
                          }}
                          className="h-8 w-16 border-y border-x-0 border-gray-200 text-sm font-medium text-center"
                          min="0"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-r-md"
                          onClick={() => handleQuantityChange(product.id, 1)}
                        >
                          <Plus size={14} />
                        </Button>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className={`h-8 ${product.quantity > 0 ? 'bg-farmaze-orange text-white hover:bg-farmaze-orange/90' : 'text-farmaze-orange hover:bg-farmaze-orange/10'}`}
                        onClick={() => {
                          if (product.quantity > 0) {
                            // Add individual product to cart
                            onAddToCart([product]);
                            // Reset quantity to 0 after adding to cart
                            setSelectedProducts(selectedProducts.map(p => 
                              p.id === product.id ? {...p, quantity: 0} : p
                            ));
                            toast({
                              title: "Added to cart",
                              description: `${product.name} (${product.quantity} ${product.unit}) added to your cart`
                            });
                          } else {
                            // Set quantity to 1 and add to cart
                            const updatedProduct = {...product, quantity: 1};
                            setSelectedProducts(selectedProducts.map(p => 
                              p.id === product.id ? updatedProduct : p
                            ));
                            onAddToCart([updatedProduct]);
                            toast({
                              title: "Added to cart",
                              description: `${product.name} (1 ${product.unit}) added to your cart`
                            });
                          }
                        }}
                      >
                        <ShoppingCart size={14} className="mr-1" />
                        {product.quantity > 0 ? 'Add to Cart' : 'Quick Add'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!loading && !error && suggestedProducts.length > 0 && filteredProducts.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              No predicted orders found matching your search.
            </div>
          )}
        </div>
        
        <DialogFooter className="p-6 border-t bg-gray-50">
          <div className="w-full flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-500">
                {selectedProducts.filter(p => p.quantity > 0).length} predicted items selected
              </span>
            </div>
            <Button 
              onClick={handleAddToCart}
              className="bg-farmaze-orange hover:bg-farmaze-orange/90 gap-2"
              disabled={!selectedProducts.some(p => p.quantity > 0)}
            >
              <ShoppingCart size={16} />
              Confirm Predictions
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SuggestionModal;
