import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { QtyInput } from "@/components/ui/QtyInput";
import {  Search, ShoppingCart, Package, Plus, Star, TrendingUp, Loader2, ChevronLeft,
  ChevronRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Product } from "@/components/products/ProductTypes";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import Pagination from "@/components/products/Pagination";
import { recommendationsApi, ClientRecommendation } from "@/api/recommendationsApi";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import ProductRequestModal from "@/components/products/ProductRequestModal";


interface OrderListTableProps {
  products: Product[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  onRequestNewProduct: () => void;
  onScanOrder: () => void;
  recommendations?: any[];
  showRecommendations?: boolean;
  onToggleRecommendations?: () => void;
  useRecommendationsAsDefault?: boolean;
  onScanOrderClick?: () => void;
  allProducts?: Product[];
  isLoadingAllProducts?: boolean;
  onProductAdded?: () => void;
}

//update
interface CartItem {
  product_id: string;
  product_name: string;
  product_unit: string;
  quantity: number;
}

const OrderListTable = ({
  products,
  onSearchChange,
  onCategoryChange,
  onRequestNewProduct,
  onScanOrder,
  onScanOrderClick,
  recommendations = [],
  showRecommendations = false,
  onToggleRecommendations,
  useRecommendationsAsDefault = true,
  allProducts = [],
  isLoadingAllProducts = false,
  onProductAdded,
}: OrderListTableProps) => {
  const { items: cartItems, updateQuantity } = useCart();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);
  const [totalRecommendations, setTotalRecommendations] = useState(0);
  const [apiTotalPages, setApiTotalPages] = useState(0);
  const [cachedApiData, setCachedApiData] = useState<{[key: number]: Product[]}>({});
  const [currentApiPage, setCurrentApiPage] = useState<number>(0);
  const [allRecommendations, setAllRecommendations] = useState<Product[]>([]);
  const [isLoadingAllRecommendations, setIsLoadingAllRecommendations] = useState(false);
//update
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showProductRequestModal, setShowProductRequestModal] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const PRODUCTS_PER_PAGE = 50; // 25 per column
  const PRODUCTS_PER_COLUMN = 25;
 
 // Load all recommendations when search is active, otherwise use pagination
  useEffect(() => {
    const loadAllRecommendations = async () => {
      if (!isLoggedIn || !useRecommendationsAsDefault) return;
      
      setIsLoadingAllRecommendations(true);
      setRecommendationsError(null);
      
      try {
        console.log('Loading all recommendations for search...');
        const response = await recommendationsApi.getMyRecommendations(
          new Date().getFullYear(),
          1000, // Get all recommendations
          0
        );
        
        // Store pagination metadata
        setTotalRecommendations(response.pagination?.total || 0);
        setApiTotalPages(response.pagination?.total_pages || 0);
        
        // Convert recommendations to Product format
        const convertedProducts: Product[] = (response.products || []).map((rec: any) => ({
          id: rec.id,
          name: rec.name || '',
          sku: rec.sku || '',
          unit: rec.unit_name || '',
          category: rec.category || '',
          subcategory: rec.subcategory || '',
          price: 0,
          quantity: 0,
          availability: '24 hrs delivery',
          description: `Recommended product`,
          recommendation_score: 0,
          purchase_frequency: 0,
          total_purchase_amount: 0
        }));
        
        setAllRecommendations(convertedProducts);
        
      } catch (error) {
        console.log('Error loading all recommendations:', error);
        setRecommendationsError('Failed to load recommendations');
      } finally {
        setIsLoadingAllRecommendations(false);
      }
    };

    const loadPagedRecommendations = async () => {
      if (!isLoggedIn || !useRecommendationsAsDefault) return;
      
      // Calculate which API page we need for the current frontend page
      const requiredApiPage = Math.ceil((currentPage * itemsPerPage) / 100);
      
      // Check if we already have this API page cached
      if (cachedApiData[requiredApiPage]) {
        // Use cached data and slice for current frontend page
        const allCachedProducts = cachedApiData[requiredApiPage];
        const startIdx = ((currentPage - 1) * itemsPerPage) % 100;
        const endIdx = Math.min(startIdx + itemsPerPage, allCachedProducts.length);
        setRecommendedProducts(allCachedProducts.slice(startIdx, endIdx));
        return;
      }
      
      setIsLoadingRecommendations(true);
      setRecommendationsError(null);
      
      try {
        const offset = (requiredApiPage - 1) * 100;
        
        console.log('Making API call for page:', requiredApiPage, 'offset:', offset);
        const response = await recommendationsApi.getMyRecommendations(
          new Date().getFullYear(),
          100, // API limit
          offset
        );
        console.log('API response received for page:', requiredApiPage);
        
        // Store pagination metadata
        setTotalRecommendations(response.pagination?.total || 0);
        setApiTotalPages(response.pagination?.total_pages || 0);
        
        // Convert recommendations to Product format
        const convertedProducts: Product[] = (response.products || []).map((rec: any) => ({
          id: rec.id,
          name: rec.name || '',
          sku: rec.sku || '',
          unit: rec.unit_name || '',
          category: rec.category || '',
          subcategory: rec.subcategory || '',
          price: 0,
          quantity: 0,
          availability: '24 hrs delivery',
          description: `Recommended product`,
          recommendation_score: 0,
          purchase_frequency: 0,
          total_purchase_amount: 0
        }));
        
        // Cache the API response
        setCachedApiData(prev => ({
          ...prev,
          [requiredApiPage]: convertedProducts
        }));
        setCurrentApiPage(requiredApiPage);
        
        // Slice the data for current frontend page
        const startIdx = ((currentPage - 1) * itemsPerPage) % 100;
        const endIdx = Math.min(startIdx + itemsPerPage, convertedProducts.length);
        setRecommendedProducts(convertedProducts.slice(startIdx, endIdx));
        
      } catch (error) {
        console.log('Error loading recommendations:', error);
        setRecommendationsError('Failed to load recommendations');
      } finally {
        setIsLoadingRecommendations(false);
      }
    };

    // If search is active, load all recommendations once
    if (searchTerm && allRecommendations.length === 0) {
      loadAllRecommendations();
    } else if (!searchTerm) {
      // If no search, use normal pagination
      loadPagedRecommendations();
    }
  }, [isLoggedIn, useRecommendationsAsDefault, currentPage, itemsPerPage, searchTerm, allRecommendations.length, cachedApiData]);

  const categories = [
    { id: null, name: "All", color: "bg-green-600 text-white" },
    { id: "vegetables", name: "Vegetables", color: "bg-green-600 text-white" },
    { id: "fruits", name: "Fruits", color: "bg-green-600 text-white" },
  ];

  const getCartItemQuantity = (productId: string) => {
    const cartItem = cartItems.find(item => item.id === productId);
    return cartItem?.quantity || 0;
  };

  const handleQuantityChange = (productId: string, value: string) => {
    // Allow empty string or valid numbers
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setQuantities(prev => ({ ...prev, [productId]: value }));
      
      // Find the product data
      const product = primaryProducts.find(p => p.id === productId);
      
      // Only update cart when user enters a valid number greater than 0
      if (value !== "" && !isNaN(Number(value))) {
        const quantity = Number(value);
        if (quantity > 0 && product) {
          updateQuantity(productId, quantity, product);
        } else {
          // Remove from cart if quantity is 0 or empty
          updateQuantity(productId, 0);
        }
      } else if (value === "") {
        // Remove from cart when input is cleared
        updateQuantity(productId, 0);
      }
    }
  };

  const getDisplayQuantity = (productId: string) => {
    // Show local quantity if user is typing, otherwise show cart quantity
    if (quantities[productId] !== undefined) {
      return quantities[productId];
    }
    const cartQuantity = getCartItemQuantity(productId);
    return cartQuantity > 0 ? cartQuantity.toString() : "";
  };

  // Set default selected category to 'All' on component mount
  useEffect(() => {
    setSelectedCategory(null); // This will select the 'All' category
  }, []);

  // Use appropriate data source based on search state
  const primaryProducts = useRecommendationsAsDefault && (searchTerm ? allRecommendations.length > 0 : recommendedProducts.length > 0)
    ? (searchTerm ? allRecommendations : recommendedProducts)
    : products;

  const filteredProducts = primaryProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || 
      product.category?.toLowerCase() === selectedCategory ||
      product.subcategory?.toLowerCase() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Pagination calculations
  const totalPages = useRecommendationsAsDefault && (searchTerm ? allRecommendations.length > 0 : recommendedProducts.length > 0)
    ? (searchTerm ? Math.ceil(filteredProducts.length / itemsPerPage) : Math.ceil(totalRecommendations / itemsPerPage))
    : Math.ceil(filteredProducts.length / itemsPerPage);
  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  
  // For search mode, use frontend pagination on filtered results
  // For normal mode, use API pagination
  const paginatedProducts = useRecommendationsAsDefault && (searchTerm ? allRecommendations.length > 0 : recommendedProducts.length > 0)
    ? (searchTerm ? filteredProducts.slice(startIndex, endIndex) : filteredProducts)
    : filteredProducts.slice(startIndex, endIndex);

  const totalSelectedItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

 // Split products into two columns (30 each)
  const leftColumnProducts = paginatedProducts.slice(0, PRODUCTS_PER_COLUMN);
  const rightColumnProducts = paginatedProducts.slice(PRODUCTS_PER_COLUMN);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

    const getCartQuantity = (productId: string) => {
    return cart.find(item => item.product_id === productId)?.quantity || 0;
  };
    const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product_id !== productId));
  };

 


    const addToCart = (product: Product, quantity: number) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.product_id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: quantity }
            : item
        );
      }
      return [...prev, {
        product_id: product.id,
        product_name: product.name,
        product_unit: product.unit,
        quantity: quantity
      }];
    });
  };
 const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  return (
    // <div className="bg-background rounded-lg border">
    //   {/* Header */}
    //   <div className="p-6 border-b">
    //     <div className="flex items-center gap-3 mb-2">
    //       <div className="w-8 h-8 bg-green-600 rounded-md flex items-center justify-center">
    //         <Package className="w-4 h-4 text-white" />
    //       </div>
    //       <h1 className="text-2xl font-semibold text-gray-900">Product Order List</h1>
    //       {/* {useRecommendationsAsDefault && recommendedProducts.length > 0 && (
    //         <Badge variant="secondary" className="flex items-center gap-1">
    //           <Star className="w-3 h-3" />
    //           Personalized Recommendations
    //         </Badge>
    //       )} */}
    //       {isLoadingRecommendations && (
    //         <div className="flex items-center gap-2 text-sm text-gray-500">
    //           <Loader2 className="w-4 h-4 animate-spin" />
    //           Loading recommendations...
    //         </div>
    //       )}
    //       <div className="ml-auto">
    //         <ScanOrderButton />
    //       </div>
    //     </div>
    //     <p className="text-muted-foreground">
    //       {useRecommendationsAsDefault && recommendedProducts.length > 0 
    //         ? "Showing products recommended based on your purchase history - enter quantities for items you need"
    //         : "Enter quantities for items you need - leave blank if not required"
    //       }
    //     </p>
    //     {recommendationsError && (
    //       <p className="text-sm text-amber-600 mt-1">
    //         {recommendationsError} - showing all available products instead
    //       </p>
    //     )}
    //   </div>

    //   {/* Controls */}
    //   <div className="p-6 border-b bg-gray-50/30">
    //     <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
    //       <div className="flex items-center gap-4 flex-1">
    //         <div className="relative flex-1 max-w-sm">
    //           <Input
    //             type="text"
    //             placeholder="Search products..."
    //             value={searchTerm}
    //             onChange={(e) => onSearchChange(e.target.value)}
    //             className="pl-4 border-gray-300 focus:border-green-500 focus:ring-green-500"
    //           />
    //         </div>

    //         {/* Category Pills */}
    //         <div className="flex gap-2 flex-wrap">
    //           {categories.map((category) => (
    //             <Button
    //               key={category.id || "all"}
    //               variant={selectedCategory === category.id ? "default" : "outline"}
    //               size="sm"
    //               onClick={() => onCategoryChange(category.id)}
    //               className={selectedCategory === category.id ? 
    //                 "bg-green-600 hover:bg-green-700 text-white" : 
    //                 "border-gray-300 text-gray-700 hover:bg-gray-50"
    //               }
    //             >
    //               {category.name}
    //             </Button>
    //           ))}
    //         </div>

    //         <Button
    //           variant="outline"
    //           size="sm"
    //           onClick={onRequestNewProduct}
    //           className="flex items-center gap-1 whitespace-nowrap border-gray-300 text-gray-700 hover:bg-gray-50"
    //         >
    //           <Plus className="w-4 h-4" />
    //           Request New Product
    //         </Button>
    //       </div>

    //       <div className="text-sm text-gray-500 whitespace-nowrap">
    //         Showing {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length}
    //       </div>
    //     </div>
    //   </div>

    //   {/* Table */}
    //   <div className="grid grid-cols-1 lg:grid-cols-2 divide-x divide-[#E5E7EB]">
    //     {/* Left Column */}
    //     <div className="p-4">
    //       <div className="space-y-0">
    //         {/* Header */}
    //         <div className="grid grid-cols-[50px_120px_1fr_80px_80px] gap-1 py-3 px-5 text-xs font-medium text-[#6B7280] border-b border-[#E5E7EB]">
    //           <div className="font-semibold">Item No</div>
    //           <div className="font-semibold">SKU</div>
    //           <div className="font-semibold">Product</div>
    //           <div className="text-center bg-[#E8F5E8] px-2 py-1 rounded font-semibold text-green-800">Qty</div>
    //           <div className="font-semibold">Unit</div>
    //         </div>

    //         {/* Products */}
    //         {leftColumnProducts.map((product, index) => {
    //           const cartQuantity = getCartItemQuantity(product.id);
    //           return (
    //             <div key={product.id} className="grid grid-cols-[50px_120px_1fr_80px_80px] gap-1 py-3 px-4 border-b border-[#E5E7EB] hover:bg-gray-50 transition-colors">
    //               <div className="text-sm text-[#6B7280] flex items-center">
    //                 {startIndex + index + 1}
    //               </div>
    //               <div className="text-xs text-[#6B7280] flex items-center font-mono">
    //                 {product.sku}
    //               </div>
    //               <div className="flex flex-col justify-center">
    //                 <div className="flex items-center gap-2">
    //                   <div className="text-sm font-semibold text-gray-900 truncate max-w-[18rem]">
    //                     {product.name}
    //                   </div>
    //                 </div>
    //                 <div className="flex items-center gap-2 mt-1">
    //                   <Badge variant="secondary" className="text-[10px] text-[#6B7280] bg-gray-100 px-2 py-0.5 rounded-full capitalize">
    //                     {product.category || product.subcategory || 'Vegetables'}
    //                   </Badge>
    //                   {cartQuantity > 0 && (
    //                     <span className="text-[10px] text-emerald-600 font-medium">
    //                       {cartQuantity} in cart
    //                     </span>
    //                   )}
    //                   {(product as any).purchase_frequency && (product as any).purchase_frequency > 0 && (
    //                     <Badge variant="outline" className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border-blue-200">
    //                       {(product as any).purchase_frequency}x purchased
    //                     </Badge>
    //                   )}
    //                 </div>
    //               </div>
    //               <div className="flex items-center justify-center">
    //                 <QtyInput
    //                   value={getDisplayQuantity(product.id)}
    //                   onChange={(value) => handleQuantityChange(product.id, value)}
    //                   placeholder="0"
    //                   compact
    //                 />
    //               </div>
    //               <div className="text-sm text-[#6B7280] flex items-center">
    //                 {product.unit}
    //               </div>
    //             </div>
    //           );
    //         })}
    //       </div>
    //     </div>

    //     {/* Right Column */}
    //     <div className="p-4">
    //       <div className="space-y-0">
    //         {/* Header */}
    //         <div className="grid grid-cols-[50px_120px_1fr_80px_80px] gap-1 py-3 px-2 text-xs font-medium text-[#6B7280] border-b border-[#E5E7EB]">
    //           <div className="font-semibold">Item No</div>
    //           <div className="font-semibold">SKU</div>
    //           <div className="font-semibold">Product</div>
    //           <div className="text-center bg-[#E8F5E8] px-2 py-1 rounded font-semibold text-green-800">Qty</div>
    //           <div className="font-semibold">Unit</div>
    //         </div>

    //         {/* Products */}
    //         {rightColumnProducts.map((product, index) => {
    //           const cartQuantity = getCartItemQuantity(product.id);
    //           return (
    //             <div key={product.id} className="grid grid-cols-[50px_120px_1fr_80px_80px] gap-1 py-3 px-4 border-b border-[#E5E7EB] hover:bg-gray-50 transition-colors">
    //               <div className="text-sm text-[#6B7280] flex items-center">
    //                 {startIndex + 25 + index + 1}
    //               </div>
    //               <div className="text-xs text-[#6B7280] flex items-center font-mono">
    //                 {product.sku || `FM-${product.id}`}
    //               </div>
    //               <div className="flex flex-col justify-center">
    //                 <div className="flex items-center gap-2">
    //                   <div className="text-sm font-semibold text-gray-900 truncate max-w-[18rem]">
    //                     {product.name}
    //                   </div>
    //                 </div>
    //                 <div className="flex items-center gap-2 mt-1">
    //                   <Badge variant="secondary" className="text-[10px] text-[#6B7280] bg-gray-100 px-2 py-0.5 rounded-full capitalize">
    //                     {product.category || product.subcategory || 'Vegetables'}
    //                   </Badge>
    //                   {cartQuantity > 0 && (
    //                     <span className="text-[10px] text-emerald-600 font-medium">
    //                       {cartQuantity} in cart
    //                     </span>
    //                   )}
    //                   {(product as any).purchase_frequency && (product as any).purchase_frequency > 0 && (
    //                     <Badge variant="outline" className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border-blue-200">
    //                       {(product as any).purchase_frequency}x purchased
    //                     </Badge>
    //                   )}
    //                 </div>
    //               </div>
    //               <div className="flex items-center justify-center">
    //                 <QtyInput
    //                   value={getDisplayQuantity(product.id)}
    //                   onChange={(value) => handleQuantityChange(product.id, value)}
    //                   placeholder="0"
    //                   compact
    //                 />
    //               </div>
    //               <div className="text-sm text-[#6B7280] flex items-center">
    //                 {product.unit}
    //               </div>
    //             </div>
    //           );
    //         })}
    //       </div>
    //     </div>
    //   </div>

    //   {/* Pagination */}
    //   <Pagination
    //     currentPage={currentPage}
    //     totalPages={totalPages}
    //     totalItems={filteredProducts.length}
    //     shownItems={paginatedProducts.length}
    //     onPageChange={handlePageChange}
    //     itemsPerPage={itemsPerPage}
    //     onItemsPerPageChange={handleItemsPerPageChange}
    //   />

    //   {/* Floating Cart */}
    //   {totalSelectedItems > 0 && (
    //     <div className="fixed bottom-6 right-6 z-50">
    //       <div className="bg-primary text-primary-foreground rounded-full p-4 shadow-lg flex items-center gap-2 min-w-[120px]">
    //         <div className="w-6 h-6 bg-primary-foreground/20 rounded-full flex items-center justify-center">
    //           <Package className="w-3 h-3" />
    //         </div>
    //         <div className="text-sm">
    //           <div className="font-medium">{totalSelectedItems}</div>
    //           <div className="text-xs opacity-90">items selected</div>
    //         </div>
    //       </div>
    //     </div>
    //   )}
    // </div>


    
    //new code
     <div className="min-h-screen bg-gradient-subtle">
      <div className="frame-container mx-auto p-6 px-5 max-w-6xl">
        {/* Header with Title and Scan Order Button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#16A34A]">
              <Package className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Product Order List</h1>
              <p className="text-muted-foreground text-sm">
                Enter quantities for items you need - leave blank if not required
              </p>
            </div>
          </div>
          
          {/* Scan Order Button - Disabled */}
          {/* <Button
            onClick={onScanOrderClick}
            variant="outline"
            className="flex items-center gap-2 bg-transparent"
          >
            <Scan className="h-4 w-4" />
            Scan Order
          </Button> */}
        </div>

        {/* Search, Categories and Controls */}
        <div className="space-y-4 mb-6">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="relative max-w-md flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page when searching
                  // Clear cached data when search changes to force reload
                  if (e.target.value && allRecommendations.length === 0) {
                    // Will trigger loadAllRecommendations in useEffect
                  }
                }}
                className="pl-10 bg-transparent focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2 border-input focus:border-[#16A34A] transition-colors"
              />
            </div>

            {/* Pagination Info */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex gap-2 items-center flex-wrap">
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div className="flex gap-1 flex-wrap">
                {categories.map((category) => (
                  <Button
                    key={category.id || "all"}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setCurrentPage(1); // Reset to first page on filter change
                    }}
                    className={`text-xs ${selectedCategory === category.id ? 'bg-[#16A34A] hover:bg-[#16A34A]/90' : 'bg-transparent'}`}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Add Product Button */}
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowProductRequestModal(true)}
              className="text-xs whitespace-nowrap bg-[#16A34A] hover:bg-[#16A34A]/90"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Product
            </Button>

            {/* AI Order Forecast Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/ai-forecast')}
              className="text-xs whitespace-nowrap border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              AI Order Forecast
            </Button>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <Card className="p-4">
            <div className="space-y-1">
              <div className="grid grid-cols-12 gap-2 p-2 bg-muted/30 rounded font-semibold text-sm">
                <div className="col-span-1">SR No</div>
                <div className="col-span-7">Product</div>
                <div className="col-span-4 text-center rounded px-2 py-1 font-bold text-[#16A34A] bg-[#16A34A]/10">Qty</div>
              </div>
              
              {leftColumnProducts.map((product, index) => {
                const cartQuantity = getCartQuantity(product.id);
                const globalIndex = startIndex + index + 1;
                
                return (
                  <div key={product.id} className="grid grid-cols-12 gap-2 p-2 border-b hover:bg-muted/20 transition-colors">
                    <div className="col-span-1 flex items-center text-sm font-medium text-muted-foreground">
                      {globalIndex}
                    </div>
                    <div className="col-span-7 flex items-center">
                      <div>
                        <div className="font-medium text-sm">{product.name}</div>
                        <div className="text-xs text-green-600 font-medium">{product.category==""?"vegetables":product.category} • {product.unit}</div>
                      </div>
                    </div>
                    <div className="col-span-4 flex items-center justify-center">
                      <Input
                        type="text"
                        value={getDisplayQuantity(product.id)}
                        onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                        placeholder=""
                        className="w-16 h-8 text-center text-sm font-bold border-2 border-[#16A34A]/30 focus:border-[#16A34A] bg-[#16A34A]/5 focus:bg-[#16A34A]/10 focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Right Column */}
          <Card className="p-4">
            <div className="space-y-1">
              <div className="grid grid-cols-12 gap-2 p-2 bg-muted/30 rounded font-semibold text-sm">
                <div className="col-span-1">SR No</div>
                <div className="col-span-7">Product</div>
                <div className="col-span-4 text-center rounded px-2 py-1 font-bold text-[#16A34A] bg-[#16A34A]/10">Qty</div>
              </div>
              
              {rightColumnProducts.map((product, index) => {
                const cartQuantity = getCartQuantity(product.id);
                const globalIndex = startIndex + PRODUCTS_PER_COLUMN + index + 1;
                
                return (
                  <div key={product.id} className="grid grid-cols-12 gap-2 p-2 border-b hover:bg-muted/20 transition-colors">
                    <div className="col-span-1 flex items-center text-sm font-medium text-muted-foreground">
                      {globalIndex}
                    </div>
                    <div className="col-span-7 flex items-center">
                      <div>
                        <div className="font-medium text-sm">{product.name}</div>
                        <div className="text-xs text-green-600 font-medium">{product.category==""?"vegetables":product.category} • {product.unit}</div>
                      </div>
                    </div>
                    <div className="col-span-4 flex items-center justify-center">
                      <Input
                        type="text"
                        value={getDisplayQuantity(product.id)}
                        onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                        placeholder=""
                        className="w-16 h-8 text-center text-sm font-bold border-2 border-[#16A34A]/30 focus:border-[#16A34A] bg-[#16A34A]/5 focus:bg-[#16A34A]/10 focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-2"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Cart Summary */}
        {totalItems > 0 && (
          <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
            <Card className="p-4 shadow-strong bg-gradient-to-r from-primary to-accent backdrop-blur-sm">
              <div className="flex items-center gap-4 text-primary-foreground">
                <div className="p-2 bg-white/20 rounded-full">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-bold text-lg">{totalItems}</div>
                  <div className="text-sm opacity-90">items selected</div>
                </div>
                <Button 
                  variant="secondary" 
                  size="lg"
                  className="ml-4 bg-white/20 hover:bg-white/30 text-white border-white/30 font-semibold"
                >
                  Review Order →
                </Button>
              </div>
            </Card>
          </div>
        )}

         {/* Product Request Modal */}
         <ProductRequestModal 
           isOpen={showProductRequestModal}
           onClose={() => setShowProductRequestModal(false)}
           onProductAdded={onProductAdded || (() => {})}
           products={allProducts}
           isLoadingProducts={isLoadingAllProducts}
         />
       </div>
     </div>
  );
};

export default OrderListTable;