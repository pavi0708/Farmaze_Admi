import { Product, ProductCategory, ProductSubcategory } from '@/components/products/ProductTypes';
import api from './authApi';

export interface ProductWithImage {
  id: string;
  name: string;
  description?: string;
  price: number;
  unit: string;
  unit_name?: string; // Added unit_name field which might be present in the API response
  image_url?: string;
  category?: string;
  subcategory?: string;
  delivery_window?: string; // Added delivery_window field from the API
}

export interface ApiResponse<T> {
  data: T;
  count: number;
}

export const productApi = {
  // Get products with their complete category hierarchy
  getProductsWithCategoryHierarchy: async (): Promise<Product[]> => {
    try {
      const response = await api.get('/products/with-category-hierarchy');
      console.log('Products with category hierarchy response:', response.data);
      
      // Check if the response has the expected structure
      const products = response.data || [];
      
      return products.map((product: any) => ({
        id: product.product_id,
        name: product.product_name,
        unit: product.unit_name || 'Piece',
        quantity: 1,
        availability: '24 hrs delivery',
        // The hierarchy endpoint might not include price
        price: product.price || 0,
        description: product.description || '',
        imageUrl: product.image_url || '',
        category: product.category_name || '',
        subcategory: product.subcategory_name || '',
        categoryId: product.category_id || '',
        subcategoryId: product.subcategory_id || ''
      }));
    } catch (error) {
      console.error('Error fetching products with category hierarchy:', error);
      return [];
    }
  },
  // Get featured products for homepage
  getFeaturedProducts: async (): Promise<Product[]> => {
    try {
      const response = await api.get('/products/featured');
      console.log('Raw featured product data from API:', response.data);
      
      // Check if the response has the expected structure
      const products = response.data.products || response.data;
      console.log('Products array extracted from response:', products);
      
      // If products is not an array, return an empty array
      if (!Array.isArray(products)) {
        console.warn('Products is not an array, returning empty array');
        return [];
      }
      
      const mappedProducts = products.map((product: ProductWithImage) => {
        // Use unit_name if available, otherwise fall back to unit
        const unitToUse = product.unit_name || product.unit || 'Piece';
        
        // Log each product's image URL for debugging
        console.log(`Product ${product.name} has image_url:`, product.image_url);
        
        // Fix the Supabase URL format by removing the 's3' path segment if present
        let imageUrl = '';
        if (product.image_url) {
          // Convert from: .../storage/v1/s3/object/public/...
          // To: .../storage/v1/object/public/...
          imageUrl = product.image_url.replace('/storage/v1/s3/object/', '/storage/v1/object/');
        }
        
        const mappedProduct = {
          id: product.id,
          name: product.name,
          unit: unitToUse,
          quantity: 1,
          availability: product.delivery_window || '24 hrs delivery',
          price: product.price, // Don't set a default price of 0
          description: product.description || '',
          imageUrl: imageUrl,
          category: product.category || '',
          subcategory: product.subcategory || ''
        };
        
        console.log(`Mapped product ${product.name} with imageUrl:`, mappedProduct.imageUrl);
        return mappedProduct;
      });
      
      console.log('Mapped featured products for frontend:', mappedProducts);
      return mappedProducts;
    } catch (error) {
      console.error('Error fetching featured products:', error);
      
      // Log more detailed error information if available
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
      }
      
      // Return an empty array to prevent UI errors
      return [];
    }
  },

  // Get all products with pagination
  getAllProducts: async (limit: number = 1000): Promise<Product[]> => {
    try {
      const url = `/products/?limit=${limit}&page=1`;
      console.log('🌐 Making API request to:', url);
      console.log('🔑 Auth token present:', localStorage.getItem('farmaze_token') ? 'Yes' : 'No');
      
      const response = await api.get(url);
      console.log('✅ API Response received:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      });
      
      // The API returns paginated response with products array
      const products = response.data.products || [];
      console.log('📊 Number of raw products:', products.length);
      
      if (products.length === 0) {
        console.warn('⚠️ API returned empty products array');
        console.log('🔍 Full response structure:', response.data);
      }
      
      const mappedProducts = products.map((product: any) => {
        // Use unit_name if available, otherwise fall back to unit
        const unitToUse = product.unit_name || product.unit || 'Piece';
        
        return {
          id: product.id,
          name: product.name,
          sku: product.sku || '',
          unit: unitToUse,
          quantity: 1,
          availability: product.delivery_window || '24 hrs delivery',
          price: product.price || 0,
          description: product.description || '',
          imageUrl: product.image_url || '',
          category: product.category || '',
          subcategory: product.subcategory || ''
        };
      });
      
      console.log('✨ Final mapped products:', mappedProducts);
      return mappedProducts;
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      console.error('📋 Detailed error info:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        headers: error.config?.headers
      });
      return [];
    }
  },

  // Get all categories with subcategories
  getAllCategories: async (): Promise<ProductCategory[]> => {
    try {
      console.log('Fetching categories from /categories/');
      const response = await api.get('/categories/');
      console.log('Successfully fetched categories');
      
      if (!response.data) {
        console.warn('API returned empty data');
        return [];
      }
      
      // Check if the response has the expected structure
      const categories = response.data.categories || response.data;
      
      if (!Array.isArray(categories)) {
        console.warn('API did not return an array of categories');
        return [];
      }
      
      // Create categories with empty subcategories arrays
      return categories.map((category: any) => ({
        id: category.id || '',
        name: category.name || 'Unknown Category',
        image: category.image_url || 'https://images.unsplash.com/photo-1557844352-761f2565b576',
        subcategories: category.subcategories || [] // Handle subcategories if they exist
      }));
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  // Search products with optional category and subcategory filters
  searchProducts: async (
    query: string,
    categoryId?: string,
    subcategoryId?: string
  ): Promise<Product[]> => {
    try {
      let url = `/products/search?query=${encodeURIComponent(query)}`;
      
      if (categoryId) {
        url += `&category_id=${categoryId}`;
      }
      
      if (subcategoryId) {
        url += `&subcategory_id=${subcategoryId}`;
      }
      
      const response = await api.get(url);
      console.log('Search products response:', response.data);
      
      // Check if the response has the expected structure
      const products = response.data.products || response.data;
      
      return products.map((product: ProductWithImage) => ({
        id: product.id,
        name: product.name,
        unit: product.unit_name || product.unit || 'Piece',
        quantity: 1,
        availability: product.delivery_window || '24 hrs delivery',
        price: product.price || 0,
        description: product.description || '',
        imageUrl: product.image_url || '',
        category: product.category || '',
        subcategory: product.subcategory || ''
      }));
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  },
  
  // Filter products by category and subcategory
  filterProducts: async (
    categoryId?: string | null,
    subcategoryId?: string | null
  ): Promise<Product[]> => {
    try {
      // Use the search endpoint instead of the products endpoint
      let url = '/products/search';
      const params = new URLSearchParams();
      
      // Add an empty query parameter as required by the backend
      params.append('query', '');
      
      if (categoryId) {
        params.append('category_id', categoryId);
      }
      
      if (subcategoryId) {
        params.append('subcategory_id', subcategoryId);
      }
      
      // Append the query string
      url += `?${params.toString()}`;
      
      console.log(`Filtering products with URL: ${url}`);
      const response = await api.get(url);
      console.log('Filtered products response:', response.data);
      
      // Check if the response has the expected structure
      const products = response.data.products || response.data;
      
      return products.map((product: ProductWithImage) => ({
        id: product.id,
        name: product.name,
        unit: product.unit_name || product.unit || 'Piece',
        quantity: 1,
        availability: product.delivery_window || '24 hrs delivery',
        price: product.price || 0,
        description: product.description || '',
        imageUrl: product.image_url || '',
        category: product.category || '',
        subcategory: product.subcategory || ''
      }));
    } catch (error) {
      console.error('Error filtering products:', error);
      return [];
    }
  }
};

export default productApi;
