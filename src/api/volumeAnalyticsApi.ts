/**
 * Volume Analytics API Client
 * Handles API calls for volume analytics data
 */

import { analyticsAxios } from './analyticsAxios';

// =============================================
// INTERFACES
// =============================================

export interface VolumeTrendsParams {
  timePeriod: '7d' | '30d' | '90d' | 'custom';
  granularity?: 'daily' | 'weekly' | 'monthly';
  category?: string;
  productId?: string;
  productIds?: string[];
  startDate?: string; // YYYY-MM-DD format
  endDate?: string;   // YYYY-MM-DD format
  branchId?: string;
  groupByBranch?: boolean;
}

export interface CategoryVolumeParams {
  timePeriod: '7d' | '30d' | '90d' | 'custom';
  startDate?: string; // YYYY-MM-DD format
  endDate?: string;   // YYYY-MM-DD format
  branchId?: string;
}

export interface TopVolumeProductsParams {
  timePeriod: '7d' | '30d' | '90d' | 'custom';
  granularity?: 'total' | 'daily' | 'weekly' | 'monthly';
  limit?: number;
  category?: string;
  productId?: string;
  productIds?: string[];
  startDate?: string; // YYYY-MM-DD format
  endDate?: string;   // YYYY-MM-DD format
  branchId?: string;
}

export interface VolumeWeekdayParams {
  timePeriod: '7d' | '30d' | '90d' | 'custom';
  category?: string;
  startDate?: string; // YYYY-MM-DD format
  endDate?: string;   // YYYY-MM-DD format
  branchId?: string;
}

// Response interfaces
export interface VolumeTrendData {
  date: string;
  total_volume_kg: number;
  order_count: number;
}

export interface CategoryVolumeData {
  category_name: string;
  total_volume_kg: number;
  percentage: number;
  order_count: number;
}

export interface TopVolumeProductData {
  product_name: string;
  product_id: string;
  category_name: string;
  total_volume_kg: number;
  percentage: number;
  order_frequency: number;
  avg_volume_per_order: number;
}

export interface VolumeWeekdayData {
  day_name: string;
  products: Array<{
    product_name: string;
    product_id: string;
    category_name: string;
    product_volume_kg: number;
    percentage: number;
    order_frequency: number;
    total_quantity: number;
    unit?: string; // Added unit field to match API response
  }>;
  total_volume: number;
}

// =============================================
// API CLIENT CLASS
// =============================================

class VolumeAnalyticsApi {
  /**
   * Get volume trends over time
   */
  async getVolumeTrends(params: VolumeTrendsParams): Promise<VolumeTrendData[]> {
    try {
      const urlParams = new URLSearchParams();
      
      if (params.timePeriod) urlParams.append('time_period', params.timePeriod);
      if (params.granularity) urlParams.append('granularity', params.granularity);
      if (params.category) urlParams.append('category', params.category);
      if (params.productIds && params.productIds.length > 0) {
        params.productIds.forEach(id => urlParams.append('product_ids[]', id));
      } else if (params.productId) {
        urlParams.append('product_id', params.productId);
      }
      if (params.startDate) urlParams.append('start_date', params.startDate);
      if (params.endDate) urlParams.append('end_date', params.endDate);
      if (params.branchId) urlParams.append('branch_id', params.branchId);
      if (params.groupByBranch) urlParams.append('group_by_branch', 'true');

      const response = await analyticsAxios.get(`/api/v1/analytics/volume/trends?${urlParams.toString()}`);
      
      console.log('Volume Trends API Response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching volume trends:', error);
      throw error;
    }
  }

  /**
   * Get category breakdown by volume
   */
  async getCategoryVolumeBreakdown(params: CategoryVolumeParams): Promise<CategoryVolumeData[]> {
    try {
      const urlParams = new URLSearchParams();
      
      if (params.timePeriod) urlParams.append('time_period', params.timePeriod);
      if (params.startDate) urlParams.append('start_date', params.startDate);
      if (params.endDate) urlParams.append('end_date', params.endDate);
      if (params.branchId) urlParams.append('branch_id', params.branchId);

      const response = await analyticsAxios.get(`/api/v1/analytics/volume/categories?${urlParams.toString()}`);
      
      console.log('Category Volume API Response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching category volume breakdown:', error);
      throw error;
    }
  }

  /**
   * Get top products by volume
   */
  async getTopProductsByVolume(params: TopVolumeProductsParams): Promise<TopVolumeProductData[]> {
    try {
      const urlParams = new URLSearchParams();
      
      if (params.timePeriod) urlParams.append('time_period', params.timePeriod);
      if (params.granularity) urlParams.append('granularity', params.granularity);
      if (params.limit) urlParams.append('limit', params.limit.toString());
      if (params.category) urlParams.append('category', params.category);
      if (params.productIds && params.productIds.length > 0) {
        params.productIds.forEach(id => urlParams.append('product_ids[]', id));
      } else if (params.productId) {
        urlParams.append('product_id', params.productId);
      }
      if (params.startDate) urlParams.append('start_date', params.startDate);
      if (params.endDate) urlParams.append('end_date', params.endDate);
      if (params.branchId) urlParams.append('branch_id', params.branchId);

      const response = await analyticsAxios.get(`/api/v1/analytics/volume/top-products?${urlParams.toString()}`);
      
      console.log('Top Volume Products API Response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching top volume products:', error);
      throw error;
    }
  }

  /**
   * Get top products by volume for each weekday
   */
  async getTopProductsByVolumeWeekday(params: VolumeWeekdayParams & { limit?: number }): Promise<VolumeWeekdayData[]> {
    try {
      const urlParams = new URLSearchParams();
      
      if (params.timePeriod) urlParams.append('time_period', params.timePeriod);
      urlParams.append('limit', (params.limit || 10).toString()); // Default 10, or custom limit
      if (params.category) urlParams.append('category', params.category);
      if (params.startDate) urlParams.append('start_date', params.startDate);
      if (params.endDate) urlParams.append('end_date', params.endDate);
      if (params.branchId) urlParams.append('branch_id', params.branchId);

      const response = await analyticsAxios.get(`/api/v1/analytics/volume/top-products-weekday?${urlParams.toString()}`);
      
      console.log('Volume Weekday API Response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching volume weekday data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const volumeAnalyticsApi = new VolumeAnalyticsApi();
