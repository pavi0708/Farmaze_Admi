import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Plus, Loader2, Search, Check } from 'lucide-react';
import { toast } from 'sonner';
import { productRequestsApi } from '@/api/recommendationsApi';
import { productApi } from '@/api/productApi';
import { Product } from '@/components/products/ProductTypes';

interface ProductRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded?: () => void;
  products?: Product[];
  isLoadingProducts?: boolean;
}

const ProductRequestModal: React.FC<ProductRequestModalProps> = ({
  isOpen,
  onClose,
  onProductAdded,
  products: propProducts = [],
  isLoadingProducts: propIsLoadingProducts = false,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Use products from props when available, otherwise load them
  useEffect(() => {
    if (propProducts.length > 0) {
      console.log('📦 Using products from props:', propProducts.length);
      console.log('📋 Sample product:', propProducts[0]);
      setProducts(propProducts);
      setIsLoadingProducts(propIsLoadingProducts);
    } else if (isOpen) {
      console.log('🚀 Modal opened, loading products...');
      loadProducts();
    }
  }, [isOpen, propProducts, propIsLoadingProducts]);

  // Filter products based on search term
  useEffect(() => {
    console.log('🔍 Filtering products - products:', products.length, 'searchTerm:', searchTerm);
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
      console.log('🔍 No search term, showing all products:', products.length);
      console.log('🔍 Sample filtered product:', products[0]);
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
      console.log('🔍 Filtered products:', filtered.length);
    }
  }, [products, searchTerm]);

  const loadProducts = async () => {
    setIsLoadingProducts(true);
    try {
      console.log('🔍 Loading products...');
      console.log('🔑 Token in localStorage:', localStorage.getItem('farmaze_token') ? 'Present' : 'Missing');
      
      const response = await productApi.getAllProducts();
      console.log('📦 Products response:', response);
      console.log('📊 Number of products loaded:', response?.length || 0);
      
      setProducts(response || []);
      
      if (!response || response.length === 0) {
        console.warn('⚠️ No products returned from API');
      }
    } catch (error) {
      console.error('❌ Error loading products:', error);
      console.error('📋 Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      });
      toast.error('Failed to load products');
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct) {
      toast.error('Please select a product');
      return;
    }

    setIsSubmitting(true);
    try {
      await productRequestsApi.addProductToRecommendations({
        product_id: selectedProduct.id,
      });
      
      toast.success('Product added to your recommendations successfully!');
      
      // Reset form
      setSelectedProduct(null);
      setSearchTerm('');
      
      // Notify parent component that a product was added
      if (onProductAdded) {
        onProductAdded();
      }
      
      onClose();
    } catch (error) {
      console.error('Error adding product to recommendations:', error);
      toast.error('Failed to add product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSelectedProduct(null);
      setSearchTerm('');
      onClose();
    }
  };

  if (!isOpen) return null;

  // Debug logging
  console.log('🎯 Modal rendering - filteredProducts:', filteredProducts.length, 'isLoadingProducts:', isLoadingProducts);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-600 rounded-md flex items-center justify-center">
              <Plus className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Add Product to Recommendations</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="search" className="text-sm font-medium text-gray-700">
              Search Products
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="search"
                type="text"
                placeholder="Search by product name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isSubmitting || isLoadingProducts}
                className="pl-10"
              />
            </div>
          </div>

          {/* Selected Product */}
          {selectedProduct && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-green-900">{selectedProduct.name}</h4>
                  <p className="text-sm text-green-700">SKU: {selectedProduct.sku || `FM-${selectedProduct.id}`}</p>
                  <p className="text-sm text-green-700">Unit: {selectedProduct.unit}</p>
                </div>
                <Check className="w-5 h-5 text-green-600" />
              </div>
            </div>
          )}

          {/* Product List */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Available Products ({filteredProducts.length})
            </Label>
            <div className="border rounded-lg max-h-60 overflow-y-auto">
              {isLoadingProducts ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-600">Loading products...</span>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  {searchTerm ? 'No products found matching your search.' : 'No products available.'}
                </div>
              ) : (
                <div className="divide-y">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedProduct?.id === product.id ? 'bg-green-50 border-l-4 border-l-green-500' : ''
                      }`}
                      onClick={() => setSelectedProduct(product)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{product.name}</h4>
                          <p className="text-sm text-gray-600">SKU: {product.sku || `FM-${product.id}`}</p>
                          <p className="text-sm text-gray-600">Unit: {product.unit}</p>
                        </div>
                        {selectedProduct?.id === product.id && (
                          <Check className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Selected product will be added directly to your personalized recommendations.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedProduct}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Recommendations
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductRequestModal;
