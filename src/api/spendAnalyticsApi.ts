import { analyticsAxios } from './analyticsAxios';

// Types for spend analytics
export interface SpendTrendsParams {
  timePeriod?: string;
  granularity?: 'daily' | 'weekly' | 'monthly';
  category?: string;
  categories?: string[];
  productId?: string;
  productIds?: string[];
  startDate?: string;
  endDate?: string;
  branchId?: string;
  groupByBranch?: boolean;
}

export interface CategoryBreakdownParams {
  timePeriod?: string;
  category?: string;
  productId?: string;
  startDate?: string;
  endDate?: string;
  branchId?: string;
  groupByBranch?: boolean;
}

export interface TopProductsParams {
  timePeriod?: string;
  granularity?: 'total' | 'daily' | 'weekly' | 'monthly';
  limit?: number;
  category?: string;
  categories?: string[];
  productId?: string;
  productIds?: string[];
  startDate?: string;
  endDate?: string;
  branchId?: string;
}

export interface SpendTrendData {
  period: string;
  total_spend: number;
  total_volume_kg: number;
  order_count: number;
  unique_products: number;
  avg_spend_per_order: number;
}

export interface CategoryBreakdownData {
  category_name: string;
  category_spend: number;
  category_volume_kg: number;
  product_count: number;
  order_count: number;
  percentage: number;
}

export interface TopProductData {
  product_id: string;
  product_name: string;
  product_sku: string;
  category: string;
  unit?: string;
  product_spend: number;
  product_volume_kg: number;
  avg_unit_price: number;
  order_frequency: number;
  total_quantity: number;
}

export interface WeekdayData {
  day_name: string;
  products: TopProductData[];
  total_spend?: number;
  total_volume?: number;
}

export const spendAnalyticsApi = {
  getSpendTrends: async (params: SpendTrendsParams = {}): Promise<SpendTrendData[]> => {
    try {
      console.log(`Fetching spend trends:`, params);
      
      // Build URL parameters manually to handle arrays
      const urlParams = new URLSearchParams();
      urlParams.append('time_period', params.timePeriod || '30d');
      urlParams.append('granularity', params.granularity || 'daily');
      
      // Handle single category or multiple categories
      if (params.categories && params.categories.length > 0) {
        params.categories.forEach(category => {
          urlParams.append('categories[]', category);
        });
      } else if (params.category) {
        urlParams.append('category', params.category);
      }
      
      // Handle single product or multiple products
      if (params.productIds && params.productIds.length > 0) {
        params.productIds.forEach(productId => {
          urlParams.append('product_ids[]', productId);
        });
      } else if (params.productId) {
        urlParams.append('product_id', params.productId);
      }
      
      if (params.startDate) urlParams.append('start_date', params.startDate);
      if (params.endDate) urlParams.append('end_date', params.endDate);
      if (params.branchId) urlParams.append('branch_id', params.branchId);
      if (params.groupByBranch) urlParams.append('group_by_branch', 'true');

      const response = await analyticsAxios.get(`/api/v1/analytics/spend/trends?${urlParams.toString()}`);
      
      console.log('Spend Trends API Response:', response.data);
      // The API returns data in format: { data: [...], metadata: {...}, success: true }
      return response.data.data;
    } catch (error) {
      console.error('Error fetching spend trends:', error);
      throw error;
    }
  },

  getCategoryBreakdown: async (params: CategoryBreakdownParams = {}): Promise<CategoryBreakdownData[]> => {
    try {
      console.log(`Fetching category breakdown:`, params);
      const response = await analyticsAxios.get(`/api/v1/analytics/spend/categories`, {
        params: {
          time_period: params.timePeriod || '30d',
          category: params.category,
          product_id: params.productId,
          start_date: params.startDate,
          end_date: params.endDate,
          branch_id: params.branchId,
          group_by_branch: params.groupByBranch ? 'true' : undefined
        }
      });

      console.log('Category Breakdown API Response:', response.data);
      // The API returns data in format: { data: [...], metadata: {...}, success: true }
      return response.data.data;
    } catch (error) {
      console.error('Error fetching category breakdown:', error);
      throw error;
    }
  },

  getTopProducts: async (params: TopProductsParams = {}): Promise<TopProductData[]> => {
    try {
      console.log(`Fetching top products:`, params);
      
      // Build URL parameters manually to handle arrays
      const urlParams = new URLSearchParams();
      urlParams.append('time_period', params.timePeriod || '30d');
      urlParams.append('granularity', params.granularity || 'monthly');
      urlParams.append('limit', (params.limit || 10).toString());
      
      // Handle single category or multiple categories
      if (params.categories && params.categories.length > 0) {
        params.categories.forEach(category => {
          urlParams.append('categories[]', category);
        });
      } else if (params.category) {
        urlParams.append('category', params.category);
      }
      
      // Handle single product or multiple products
      if (params.productIds && params.productIds.length > 0) {
        params.productIds.forEach(productId => {
          urlParams.append('product_ids[]', productId);
        });
      } else if (params.productId) {
        urlParams.append('product_id', params.productId);
      }
      
      if (params.startDate) urlParams.append('start_date', params.startDate);
      if (params.endDate) urlParams.append('end_date', params.endDate);
      if (params.branchId) urlParams.append('branch_id', params.branchId);

      const response = await analyticsAxios.get(`/api/v1/analytics/spend/top-products?${urlParams.toString()}`);
      
      console.log('Top Products API Response:', response.data);
      // The API returns data in format: { data: [...], metadata: {...}, success: true }
      return response.data.data;
    } catch (error) {
      console.error('Error fetching top products:', error);
      throw error;
    }
  },

  getTopProductsByWeekday: async (params: TopProductsParams & { limit?: number } = {}, type: 'spend' | 'volume' = 'spend'): Promise<WeekdayData[]> => {
    try {
      console.log(`Fetching top products by weekday (${type}):`, params);
      
      // Build URL parameters manually to handle arrays
      const urlParams = new URLSearchParams();
      urlParams.append('time_period', params.timePeriod || '30d');
      urlParams.append('type', type);
      urlParams.append('limit', (params.limit || 10).toString()); // Default 10, or custom limit
      
      // Handle single category or multiple categories
      if (params.categories && params.categories.length > 0) {
        params.categories.forEach(category => {
          urlParams.append('categories[]', category);
        });
      } else if (params.category && params.category !== 'all') {
        urlParams.append('category', params.category);
      }
      
      // Handle single product or multiple products
      if (params.productIds && params.productIds.length > 0) {
        params.productIds.forEach(productId => {
          urlParams.append('product_ids[]', productId);
        });
      } else if (params.productId && params.productId !== 'all') {
        urlParams.append('product_id', params.productId);
      }
      
      if (params.startDate) urlParams.append('start_date', params.startDate);
      if (params.endDate) urlParams.append('end_date', params.endDate);
      if (params.branchId) urlParams.append('branch_id', params.branchId);

      const response = await analyticsAxios.get(`/api/v1/analytics/spend/top-products-weekday?${urlParams.toString()}`);
      
      console.log('Weekday API Response:', response.data);
      // The API returns data in format: { data: [...], metadata: {...}, success: true }
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching weekday data:', error);
      throw error;
    }
  }
};

export default spendAnalyticsApi;
