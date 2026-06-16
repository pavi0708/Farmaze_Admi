
import React, { useState, useEffect } from "react";
import ProductList from "./ProductList";
import Pagination from "./Pagination";
import ProductSearch from "./ProductSearch";
import CartPreview from "@/components/cart/CartPreview";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronRight, Filter, ShoppingCart } from "lucide-react";
import { Product, ProductCategory } from "./ProductTypes";
import { toast } from "sonner";
import { productApi } from "@/api/productApi";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProductSectionProps {
  products: Product[];
  searchTerm: string;
  onSearch?: (term: string) => void; 
  onSearchChange?: (term: string) => void;
  filteredProducts?: Product[];
  onQuantityChange?: (id: string, change: number) => void;
  onShowSuggestions?: () => void;
  onEmptyCart?: () => void;
  onViewCart?: () => void;
  showInsightsSidebar?: boolean;
  onCategorySelect?: (category: string | null) => void;
  selectedCategory?: string | null;
  onSubcategorySelect?: (subcategory: string | null) => void;
  selectedSubcategory?: string | null;
  isLoading?: boolean;
  readOnly?: boolean;
}

const ProductSection: React.FC<ProductSectionProps> = ({
  products,
  filteredProducts,
  searchTerm,
  onSearchChange,
  onQuantityChange,
  onShowSuggestions,
  onEmptyCart,
  onViewCart,
  showInsightsSidebar = true,
  onCategorySelect,
  onSubcategorySelect,
  isLoading = false
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [categoryData, setCategoryData] = useState<ProductCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    const loadCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const categories = await productApi.getAllCategories();
        console.log('Categories loaded from API:', categories);
        setCategoryData(categories);
      } catch (error) {
        console.error('Error loading categories:', error);
        toast.error('Failed to load product categories');
      } finally {
        setIsLoadingCategories(false);
      }
    };
    
    loadCategories();
  }, []);
  
  const toggleCategory = (categoryName: string, categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
    
    const newCategory = selectedCategory === categoryName ? null : categoryName;
    
    if (selectedCategory === categoryName) {
      setSelectedCategory(null);
      setSelectedSubcategory(null);
      
      if (onCategorySelect) onCategorySelect(null);
      if (onSubcategorySelect) onSubcategorySelect(null);
    } else {
      setSelectedCategory(categoryName);
      setSelectedSubcategory(null);
      
      // Make sure we're passing a string ID, not an object
      if (onCategorySelect) onCategorySelect(categoryId);
      if (onSubcategorySelect) onSubcategorySelect(null);
    }
  };

  const selectSubcategory = (subcategoryName: string, subcategoryId: string) => {
    const newSubcategory = selectedSubcategory === subcategoryName ? null : subcategoryName;
    
    setSelectedSubcategory(newSubcategory);
    
    // Make sure we're passing a string ID, not an object
    if (onSubcategorySelect) onSubcategorySelect(newSubcategory ? subcategoryId : null);
  };
  
  // Get all products that match the current filters
  const allFilteredProducts = filteredProducts || products;
  
  // Calculate pagination indexes
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  
  // Get current products for the page
  const displayedProducts = allFilteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  
  // Calculate total pages
  const totalPages = Math.ceil(allFilteredProducts.length / itemsPerPage);
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedSubcategory]);

  return (
    <div className="mb-20">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
        {/* Mobile filters toggle */}
        <Button 
          variant="outline" 
          className="flex md:hidden items-center gap-2 w-full"
          onClick={() => setShowMobileFilters(!showMobileFilters)}
        >
          <Filter size={16} />
          {showMobileFilters ? "Hide Filters" : "Show Filters"}
        </Button>
      </div>
      
      <ProductSearch 
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        onShowSuggestions={onShowSuggestions}
      />
      
      <div className={`flex flex-col md:flex-row gap-6 mt-4`}>
        {/* Categories Sidebar */}
        <div className={`w-full md:w-64 shrink-0 ${showMobileFilters ? 'block' : 'hidden md:block'}`}>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-20">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Categories</h2>
              {selectedCategory && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs text-blue-600"
                  onClick={() => {
                    setSelectedCategory(null);
                    setSelectedSubcategory(null);
                    if (onCategorySelect) onCategorySelect(null);
                    if (onSubcategorySelect) onSubcategorySelect(null);
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
            <div className="divide-y divide-gray-100 max-h-[calc(100vh-180px)] overflow-y-auto">
              {isLoadingCategories ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-farmaze-orange mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Loading categories...</p>
                </div>
              ) : categoryData.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-sm text-gray-500">No categories found</p>
                </div>
              ) : (
                categoryData.map((category) => (
                  <div key={category.id} className="py-1">
                    <button
                      onClick={() => toggleCategory(category.name, category.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors ${
                        selectedCategory === category.name ? 'bg-gray-50 text-blue-600 font-medium' : ''
                      }`}
                    >
                      <span className="font-medium text-sm">{category.name}</span>
                      {expandedCategories[category.name] ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                    </button>
                    
                    {expandedCategories[category.name] && category.subcategories && category.subcategories.length > 0 && (
                      <div className="pl-4 pb-2 space-y-1">
                        {category.subcategories.map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => selectSubcategory(sub.name, sub.id)}
                            className={`w-full text-left px-4 py-2 text-sm rounded-md transition-colors ${
                              selectedSubcategory === sub.name
                                ? 'text-blue-600 font-medium bg-blue-50'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                          >
                            {sub.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* Products List */}
        <div className="flex-1">
          <Card className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-md">
            {displayedProducts.length === 0 && !isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">No products found in this category.</p>
              </div>
            ) : (
              <>
                <ProductList 
                  products={displayedProducts} 
                  handleQuantityChange={onQuantityChange} 
                />
                
                <Pagination 
                  totalItems={allFilteredProducts.length} 
                  shownItems={displayedProducts.length}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={setItemsPerPage}
                />
              </>
            )}
          </Card>
        </div>
        
        {/* Cart Preview for Desktop - Now positioned on the right side */}
        {/* {!isMobile && (
          <div className="hidden md:block md:w-64 shrink-0">
            <div className="sticky top-20">
              <CartPreview />
            </div>
          </div>
        )} */}
      </div>
      
      {/* Add mobile floating cart preview */}
      {/* {isMobile && <CartPreview className="md:hidden" />} */}
    </div>
  );
};

export default ProductSection;
