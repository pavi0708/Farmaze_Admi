
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import FadeInSection from "@/components/ui/FadeInSection";
import SuggestionModal from "@/components/products/SuggestionModal";
import OrderListTable from "@/components/products/OrderListTable";
import ProductRequestModal from "@/components/products/ProductRequestModal";
import OrderTabs from '../components/orders/OrderTabs';
import TemplateSelector from '@/components/orders/TemplateSelector';
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";

import { Product, ProductCategory } from "@/components/products/ProductTypes";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { productApi } from "@/api/productApi";
import { recommendationsApi, ClientRecommendation } from "@/api/recommendationsApi";
import { OrderUploadResponse } from "@/types/orderUpload";
import { OrderTemplateItem } from "@/api/templateApi";

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showProductRequest, setShowProductRequest] = useState(false);
  const [showInsightsSidebar, setShowInsightsSidebar] = useState(true);
  const [marketInsights, setMarketInsights] = useState<any[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [categoryData, setCategoryData] = useState<ProductCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(true);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [recommendations, setRecommendations] = useState<ClientRecommendation[]>([]);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoadingAllProducts, setIsLoadingAllProducts] = useState(false);
  
  const { addToCart, clearCart, items, getCartTotal, placeOrder, isPlacingOrder, getItemCount, orderDate, setOrderDate } = useCart();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  
  const getCurrentDay = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayIndex = new Date().getDay();
    return days[dayIndex];
  };
  
  const [currentDay, setCurrentDay] = useState(getCurrentDay());
  
  useEffect(() => {
    const loadCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const categories = await productApi.getAllCategories();
        setCategoryData(categories);
      } catch (error) {
        console.error("Error loading categories:", error);
        toast.error("Failed to load categories");
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);
  
  const toggleCategory = (categoryName: string, categoryId: string) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory(null);
      setSelectedSubcategory(null);
    } else {
      setSelectedCategory(categoryId);
      setSelectedSubcategory(null);
    }
    
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };
  
  const selectSubcategory = (subcategoryName: string, subcategoryId: string) => {
    if (selectedSubcategory === subcategoryId) {
      setSelectedSubcategory(null);
    } else {
      setSelectedSubcategory(subcategoryId);
    }
  };
  
  useEffect(() => {
    const loadMarketInsights = async () => {
      setIsLoadingInsights(true);
      try {
        // Market insights functionality will be implemented later
        setMarketInsights([]);
      } catch (error) {
        console.error("Error loading market insights:", error);
        toast.error("Failed to load market insights");
      } finally {
        setIsLoadingInsights(false);
      }
    };
    
    loadMarketInsights();
  }, [currentDay]);
  
  useEffect(() => {
    const loadProducts = async () => {
      if (!isLoggedIn) return;
      
      setIsLoadingProducts(true);
      try {
        console.log(`Loading client-specific recommendations`);
        
        // Load client-specific recommendations instead of all products
        const response = await recommendationsApi.getMyRecommendations(
          new Date().getFullYear(),
          1000, // Get all recommendations
          0
        );
        
        // Convert recommendations to Product format
        const recommendedProducts = (response.products || []).map((rec: any) => ({
          id: rec.id,
          name: rec.name || '',
          sku: rec.sku || '',
          unit: rec.unit_name || '',
          category: rec.category || '',
          subcategory: rec.subcategory || '',
          price: 0, // Price not available in recommendations API
          quantity: 0,
          availability: '24 hrs delivery',
          description: `Recommended product`,
          imageUrl: rec.image_url || ''
        }));
        
        console.log('Fetched client recommendations:', recommendedProducts);
        
        setProducts(recommendedProducts);
      } catch (error) {
        console.error('Error loading client recommendations:', error);
        toast.error('Failed to load personalized recommendations');
        // Fallback to empty array
        setProducts([]);
      } finally {
        setIsLoadingProducts(false);
      }
    };
    
    loadProducts();
  }, [isLoggedIn, refreshKey]);

  // Load recommendations when user is logged in
  useEffect(() => {
    const loadRecommendations = async () => {
      if (!isLoggedIn) return;
      
      setIsLoadingRecommendations(true);
      try {
        const response = await recommendationsApi.getMyRecommendations(
          new Date().getFullYear(),
          20, // Limit to top 20 recommendations
          0
        );
        setRecommendations(response.products || []);
      } catch (error) {
        console.error('Error loading recommendations:', error);
        // Don't show error toast as recommendations are optional
      } finally {
        setIsLoadingRecommendations(false);
      }
    };
    
    loadRecommendations();
  }, [isLoggedIn, refreshKey]);

  // Load all products for the ProductRequestModal
  useEffect(() => {
    const loadAllProducts = async () => {
      if (!isLoggedIn) return;
      
      setIsLoadingAllProducts(true);
      try {
        console.log('🛒 Loading all products for ProductRequestModal...');
        const allProductsResponse = await productApi.getAllProducts();
        console.log('✅ All products loaded:', allProductsResponse.length);
        setAllProducts(allProductsResponse || []);
      } catch (error) {
        console.error('❌ Error loading all products:', error);
        setAllProducts([]);
      } finally {
        setIsLoadingAllProducts(false);
      }
    };
    
    loadAllProducts();
  }, [isLoggedIn]);
  
  const { updateQuantity: updateCartQuantity, items: cartItems } = useCart();

  const handleQuantityChange = (id: string, change: number) => {
    const cartItem = cartItems.find(item => item.id === id);
    const currentQuantity = cartItem?.quantity || 0;

    // For positive changes (adding), only add the change amount
    // For negative changes (removing), only remove the change amount
    const newQuantity = Math.max(0, currentQuantity + change);

    // Update cart with new quantity
    updateCartQuantity(id, newQuantity);
  };
  
  const filteredProducts = searchTerm 
    ? products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : products;
  
  const handleAddSuggestedProducts = (suggestedProducts: any[]) => {
    const updatedProducts = [...products];
    
    suggestedProducts.forEach(suggestedProduct => {
      const existingProductIndex = updatedProducts.findIndex(p => p.name.toLowerCase() === suggestedProduct.name.toLowerCase());
      
      if (existingProductIndex >= 0) {
        updatedProducts[existingProductIndex].quantity += suggestedProduct.quantity;
        
        addToCart(updatedProducts[existingProductIndex], suggestedProduct.quantity);
      } else {
        const newProduct = {
          id: String(updatedProducts.length + 1),
          name: suggestedProduct.name,
          unit: suggestedProduct.unitType,
          quantity: suggestedProduct.quantity,
          availability: '24 hrs delivery',
          price: suggestedProduct.price || 30
        };
        
        updatedProducts.push(newProduct);
        addToCart(newProduct, suggestedProduct.quantity);
      }
    });
    
    setProducts(updatedProducts);
    toast.success(`${suggestedProducts.length} products added to cart`);
  };
  
  const handleAddProductFromInsight = (productName: string) => {
    const updatedProducts = [...products];
    const existingProductIndex = updatedProducts.findIndex(p => p.name.toLowerCase() === productName.toLowerCase());
    
    if (existingProductIndex >= 0) {
      updatedProducts[existingProductIndex].quantity += 1;
      
      addToCart(updatedProducts[existingProductIndex], 1);
    } else {
      const newProduct = {
        id: String(updatedProducts.length + 1),
        name: productName,
        unit: 'Kg',
        quantity: 1,
        availability: '24 hrs delivery',
        price: 40
      };
      
      updatedProducts.push(newProduct);
      addToCart(newProduct, 1);
    }
    
    setProducts(updatedProducts);
    toast.success(`${productName} added to cart`);
  };

  const handleEmptyCart = () => {
    clearCart();
    setProducts(products.map(product => ({ ...product, quantity: 0 })));
    toast.success("Cart emptied successfully");
  };

  const handlePlaceOrder = async () => {
    console.log('Products: handlePlaceOrder called, delegating to CartContext');
    
    try {
      await placeOrder();
      setProducts(products.map(product => ({ ...product, quantity: 0 })));
    } catch (error) {
      console.error('Error in handlePlaceOrder:', error);
    }
  };
  
  const toggleInsightsSidebar = () => {
    setShowInsightsSidebar(prev => !prev);
  };

  const handleProductAdded = () => {
    // Trigger a refresh of recommendations without affecting cart
    setRefreshKey(prev => prev + 1);
  };

  const handleTemplateSelect = (templateItems: OrderTemplateItem[]) => {
    templateItems.forEach((item) => {
      // Find the product in our products list to get full data
      const product = products.find((p) => p.id === item.product_id) ||
                      allProducts.find((p) => p.id === item.product_id);

      if (product) {
        addToCart(product, item.quantity);
      } else {
        // Product not in local list; create a minimal product entry
        addToCart(
          {
            id: item.product_id,
            name: item.product_name || 'Unknown Product',
            unit: item.unit || '',
            quantity: 0,
            availability: 'in_stock',
          },
          item.quantity
        );
      }
    });
  };

  const handleOrderUploadSuccess = (response: OrderUploadResponse) => {
    // Show success notification
    toast.success("Order uploaded successfully!", {
      description: `Order ID: ${response.uploaded_order_id}. It's now pending admin review.`,
      duration: 5000,
    });
    
    // Optionally refresh recommendations or products
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="container mx-auto px-4 pb-8 relative max-w-7xl">
      {/* Template Selector */}
      <div className="flex justify-end mb-4">
        <TemplateSelector onSelect={handleTemplateSelect} />
      </div>

      {/* Order Tabs - Product List, Text Order, Document Order */}
      <FadeInSection>
        <OrderTabs
          products={filteredProducts}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          onRequestNewProduct={() => setShowProductRequest(true)}
          onScanOrder={() => {}}
          onScanOrderClick={() => {}}
          recommendations={recommendations}
          showRecommendations={showRecommendations}
          onToggleRecommendations={() => setShowRecommendations(!showRecommendations)}
          useRecommendationsAsDefault={true}
          allProducts={allProducts}
          isLoadingAllProducts={isLoadingAllProducts}
          onProductAdded={handleProductAdded}
          onUploadSuccess={handleOrderUploadSuccess}
          orderDate={orderDate}
          onOrderDateChange={setOrderDate}
        />
      </FadeInSection>

      {/* Insights Toggle Button (when sidebar is closed) */}
      {/* Market Insights functionality is temporarily hidden */}
      
      {/* Product Suggestions Modal */}
      <SuggestionModal 
        isOpen={showSuggestions}
        onClose={() => setShowSuggestions(false)}
        onAddToCart={handleAddSuggestedProducts}
        currentDay={currentDay}
      />

      {/* Scan Order Modal - Disabled */}
      {/* <ScanOrderModal 
        isOpen={showScanOrder}
        onClose={() => setShowScanOrder(false)}
        onProductsExtracted={(extractedProducts) => {
          // Convert extracted products to the format expected by handleAddSuggestedProducts
          const formattedProducts = extractedProducts.map(product => ({
            name: product.name,
            quantity: product.quantity,
            unitType: product.unit,
            price: 30 // Default price
          }));
          handleAddSuggestedProducts(formattedProducts);
        }}
      /> */}

      {/* Product Request Modal */}
      <ProductRequestModal 
        isOpen={showProductRequest}
        onClose={() => setShowProductRequest(false)}
        onProductAdded={handleProductAdded}
        products={allProducts}
        isLoadingProducts={isLoadingAllProducts}
      />
    </div>
  );
};

export default Products;
