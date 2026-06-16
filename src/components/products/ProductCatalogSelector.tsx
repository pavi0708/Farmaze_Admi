import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Loader2, Package } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { productApi } from "@/api/productApi";
import { productRequestsApi } from "@/api/recommendationsApi";

interface Product {
  id: string;
  name: string;
  sku: string;
  unit_name: string;
  category: string;
  subcategory: string;
  description?: string;
  image_url?: string;
}

const ProductCatalogSelector = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await productApi.getAllProducts();
        console.log('Fetched products:', response);
        
        // Convert Product[] to our interface format
        const convertedProducts = response.map(product => ({
          id: product.id,
          name: product.name,
          sku: product.sku || '',
          unit_name: product.unit,
          category: product.category || '',
          subcategory: product.subcategory || '',
          description: product.description,
          image_url: product.imageUrl
        }));
        
        setProducts(convertedProducts);
        setFilteredProducts(convertedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.subcategory.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [searchTerm, products]);

  const handleAddProduct = async (product: Product) => {
    try {
      setIsAdding(product.id);
      
      const payload = {
        product_id: product.id,
        product_name: product.name,
        product_unit: product.unit_name,
        notes: `Added from product catalog - ${product.category}`
      };

      await productRequestsApi.addProductToRecommendations({ product_id: product.id });
      toast.success(`${product.name} added to your recommendations`);
      
      // Optional: Close dialog or refresh recommendations
      window.location.reload(); // Simple refresh to update the recommendations list
      
    } catch (error) {
      console.error('Error adding product to recommendations:', error);
      toast.error('Failed to add product to recommendations');
    } finally {
      setIsAdding(null);
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading products...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search products by name, category, or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Found {filteredProducts.length} products
        {searchTerm && ` matching "${searchTerm}"`}
      </div>

      {/* Products Grid */}
      <ScrollArea className="h-[400px]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pr-4">
          {paginatedProducts.map((product) => (
            <Card key={product.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-12 h-12 rounded-md object-cover flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-md bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{product.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {product.unit_name} • SKU: {product.sku}
                      </p>
                      <div className="flex gap-1 mt-1">
                        {product.category && (
                          <Badge variant="secondary" className="text-xs">
                            {product.category}
                          </Badge>
                        )}
                        {product.subcategory && (
                          <Badge variant="outline" className="text-xs">
                            {product.subcategory}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button
                  size="sm"
                  onClick={() => handleAddProduct(product)}
                  disabled={isAdding === product.id}
                  className="flex-shrink-0"
                >
                  {isAdding === product.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Plus className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {filteredProducts.length === 0 && !isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No products found</p>
          {searchTerm && (
            <p className="text-sm">Try adjusting your search terms</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductCatalogSelector;
