import { useState, useEffect } from 'react';
import { recommendationsApi } from '@/api/recommendationsApi';
import { spendAnalyticsApi } from '@/api/spendAnalyticsApi';

export interface Category {
  value: string;
  label: string;
}

export interface Product {
  value: string;
  label: string;
  category: string;
}

export interface UseProductsAndCategoriesReturn {
  categories: Category[];
  products: Product[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useProductsAndCategories = (): UseProductsAndCategoriesReturn => {
  const [categories, setCategories] = useState<Category[]>([
    { value: "all", label: "All Categories" }
  ]);
  const [products, setProducts] = useState<Product[]>([
    { value: "all", label: "All Products", category: "all" }
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let categoryList: Category[] = [{ value: "all", label: "All Categories" }];
      let productList: Product[] = [{ value: "all", label: "All Products", category: "all" }];

      // Try recommendations API first
      try {
        const recommendationsResponse = await recommendationsApi.getMyRecommendations(
          new Date().getFullYear(),
          1000,
          0
        );

        if (recommendationsResponse.products && Array.isArray(recommendationsResponse.products) && recommendationsResponse.products.length > 0) {
          const categorySet = new Set<string>();

          recommendationsResponse.products.forEach((item: { id?: string; name?: string; category?: string }) => {
            if (item.category && item.category.trim()) {
              categorySet.add(item.category.trim());
            }
            if (item.id && item.name) {
              productList.push({
                value: item.id,
                label: item.name,
                category: item.category?.trim() || 'uncategorized'
              });
            }
          });

          Array.from(categorySet).sort().forEach(categoryName => {
            categoryList.push({ value: categoryName, label: categoryName });
          });
        }
      } catch (recErr) {
        console.warn('Recommendations API failed, will try analytics fallback:', recErr);
      }

      // Fallback: if recommendations returned nothing, use analytics API
      if (productList.length <= 1) {
        console.log('No products from recommendations, falling back to analytics API');

        const [categoryResponse, productsResponse] = await Promise.all([
          spendAnalyticsApi.getCategoryBreakdown({ timePeriod: '90d' }),
          spendAnalyticsApi.getTopProducts({ timePeriod: '90d', limit: 200 })
        ]);

        // Build categories from category breakdown
        if (Array.isArray(categoryResponse)) {
          categoryList = [{ value: "all", label: "All Categories" }];
          categoryResponse.forEach(cat => {
            if (cat.category_name) {
              categoryList.push({
                value: cat.category_name,
                label: cat.category_name
              });
            }
          });
        }

        // Build products from top products
        if (Array.isArray(productsResponse)) {
          productList = [{ value: "all", label: "All Products", category: "all" }];
          productsResponse.forEach(prod => {
            if (prod.product_id && prod.product_name) {
              productList.push({
                value: prod.product_id,
                label: prod.product_name,
                category: prod.category || 'uncategorized'
              });
            }
          });
        }
      }

      setCategories(categoryList);
      setProducts(productList);

      console.log(`Loaded ${categoryList.length - 1} categories and ${productList.length - 1} products`);
    } catch (err) {
      console.error('Error fetching products and categories:', err);
      setError('Failed to load products and categories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    categories,
    products,
    isLoading,
    error,
    refetch: fetchData
  };
};
