
import React, { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import FadeInSection from "@/components/ui/FadeInSection";
import { Product, ProductCategory } from "@/components/products/ProductTypes";
import { productApi } from "@/api/productApi";
import ProductList from "@/components/products/ProductList";
import ProductSearch from "@/components/products/ProductSearch";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import Pagination from "@/components/products/Pagination";

const Catalog = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [categoryData, setCategoryData] = useState<ProductCategory[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);

  useEffect(() => {
    const loadCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const categories = await productApi.getAllCategories();
        setCategoryData(categories);
      } catch (error) {
        console.error("Error loading categories:", error);
        toast({
          title: "Failed to load categories",
          variant: "destructive"
        });
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      setIsLoadingProducts(true);
      try {
        let fetchedProducts;
        
        if (selectedCategory && selectedSubcategory) {
          fetchedProducts = await productApi.filterProducts(selectedCategory, selectedSubcategory);
        } else if (selectedCategory) {
          fetchedProducts = await productApi.filterProducts(selectedCategory);
        } else {
          fetchedProducts = await productApi.getAllProducts();
        }
        
        const productsWithQuantity = fetchedProducts.map(product => ({
          ...product,
          quantity: 0
        }));
        
        setProducts(productsWithQuantity);
      } catch (error) {
        console.error("Error loading products:", error);
        toast({
          title: "Failed to load products",
          variant: "destructive"
        });
      } finally {
        setIsLoadingProducts(false);
      }
    };
    
    loadProducts();
  }, [selectedCategory, selectedSubcategory]);

  const filteredProducts = searchTerm 
    ? products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : products;
    
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
  
  const handleQuantityChange = (id: string, change: number) => {
    localStorage.setItem('pendingProductId', id);
    localStorage.setItem('pendingAction', 'add');
    
    navigate('/login?returnTo=/products');
    toast({
      title: "Please login to add items to your cart",
    });
  };
  
  const handleRemoveFromCart = (id: string) => {
    localStorage.setItem('pendingProductId', id);
    localStorage.setItem('pendingAction', 'remove');
    
    navigate('/login?returnTo=/products');
    toast({
      title: "Please login to manage your cart",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <FadeInSection>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Browse Our Products</h1>
          <p className="mt-2 text-gray-600">
            Explore our selection of fresh, locally-sourced products
          </p>
        </div>

        <div className="mb-6">
          <ProductSearch 
            searchTerm={searchTerm} 
            onSearchChange={setSearchTerm} 
          />
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-64 shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Categories</h2>
              </div>
              <div className="divide-y divide-gray-100 max-h-[calc(100vh-180px)] overflow-y-auto">
                {isLoadingCategories ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
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
                          selectedCategory === category.id ? 'bg-gray-50 text-blue-600 font-medium' : ''
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
                                selectedSubcategory === sub.id
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
          
          <div className="flex-1">
            <Card className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-md">
              {isLoadingProducts ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading products...</p>
                </div>
              ) : (
                <>
                <ProductList 
                  products={displayedProducts} 
                  handleQuantityChange={handleQuantityChange}
                  readOnly={false}
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
        </div>
      </FadeInSection>
    </div>
  );
};

export default Catalog;
