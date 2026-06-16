import { analyticsAxios } from './analyticsAxios';

// Interfaces for consumption data
export interface ConsumptionSummary {
  day_of_week: string;
  total_consumption: number;
  percentage: number;
}

export interface DetailedConsumption {
  product_name: string;
  variant?: string;
  grade?: string;
  origin?: string;
  value: number;
}

export interface DailyConsumption {
  day: string;
  potatoes: number;
  onions: number;
  carrots: number;
  tomatoes: number;
  others: number;
}

// Interfaces for expenditure data
export interface ExpenditureSummary {
  day_of_week: string;
  total_expenditure: number;
  percentage: number;
}

export interface DetailedExpenditure {
  product_name: string;
  variant?: string;
  grade?: string;
  origin?: string;
  value: number;
}

export interface DailyExpenditure {
  day: string;
  potatoes: number;
  onions: number;
  carrots: number;
  tomatoes: number;
  others: number;
}

// Interface for product suggestions
export interface ProductSuggestion {
  id?: string;
  name?: string;
  product_name?: string;
  product_id?: string;
  quantity?: number;
  suggested_quantity: number;
  confidence_score?: number;
  unit?: string;
  product_unit?: string;
  sku?: string;
  product_sku?: string;
  order_frequency?: number;
  seasonal_factor?: number;
  festival_effect?: Array<{ source: string; effect: number; reason: string }>;
  weather_effect?: Array<{ source: string; effect: number; reason: string }>;
}

export interface SuggestionResponse {
  suggestions: ProductSuggestion[];
  typical_order_size: number;
}

// ── Forecast API Types ──────────────────────────────────────

export interface ForecastPoint {
  date: string;
  predicted_qty: number;
  lower: number;
  upper: number;
}

export interface ProductForecast {
  product_id: string;
  product_name: string;
  product_sku: string;
  category: string;
  unit: string;
  forecast: ForecastPoint[];
  trend: 'increasing' | 'decreasing' | 'stable';
  weekly_pattern: Record<string, number>;
  data_points: number;
  history_days: number;
  method?: 'prophet' | 'simple_average';
  confidence_label?: 'high' | 'medium' | 'low' | null;
  forecast_method?: 'prophet_ml' | 'moving_avg' | 'last_weekday' | 'simple_average';
}

export interface ForecastResponse {
  client_id: string;
  generated_at: string;
  horizon: number;
  products: ProductForecast[];
  summary: { total_products: number; forecasted: number; skipped: number };
}

export interface ForecastAccuracyResponse {
  client_id: string;
  backtest_days: number;
  products: Array<{
    product_id: string;
    product_name: string;
    mape: number | null;
    mae: number;
    rmse: number;
    actual_data_points: number;
    test_days: number;
    rating: string;
  }>;
  overall_mape: number | null;
  overall_rating: string;
}

export interface TamilMonth {
  name: string;
  significance: string;
  start_date: string;
  end_date: string;
}

export interface FestivalDetail {
  name: string;
  type: string;
  date: string;
  veg_multiplier: number;
  nonveg_multiplier: number;
  catering_multiplier: number;
  spike_products: string[];
  description: string;
}

export interface UpcomingFestival {
  name: string;
  date: string;
  type: string;
  days_until: number;
  impact_summary: string;
  veg_multiplier: number;
  nonveg_multiplier: number;
}

export interface SuggestionContext {
  festival: string;
  festivals: string[];
  festival_details?: FestivalDetail[];
  tamil_month?: TamilMonth;
  weather: string;
  weather_condition: string;
  weather_impact?: string;
  temperature: number | null;
  rainfall_mm: number;
  is_purattasi: boolean;
  is_aadi?: boolean;
  is_ramadan?: boolean;
  is_muhurtham: boolean;
  muhurtham_density?: number;
}

export interface SuggestionsWithContext {
  suggestions: ProductSuggestion[];
  context: SuggestionContext | null;
}

// ── Calibration API Types ──────────────────────────────────────

export interface CalibrationProduct {
  product_id: string;
  product_name: string;
  predicted_qty: number;
  actual_qty: number;
  lower_bound: number;
  upper_bound: number;
  error: number;
  abs_error: number;
  pct_error: number | null;
  confidence_label: string;
  confidence_score: number;
  model_version: string;
}

export interface CalibrationDateResponse {
  products: CalibrationProduct[];
  date: string;
}

export interface CalibrationStatusProduct {
  product_id: string;
  product_name: string;
  rolling_bias: number;
  rolling_mape: number | null;
  correction_type: string;
  correction_value: number;
  confidence_score: number;
  confidence_label: string;
  sample_size: number;
  tracking_signal: number;
  updated_at: string | null;
}

export interface CalibrationStatusResponse {
  products: CalibrationStatusProduct[];
  summary: {
    total_products: number;
    high_confidence: number;
    medium_confidence: number;
    low_confidence: number;
    drift_flagged: number;
    avg_mape: number | null;
  };
}

export interface CalibrationRunResponse {
  overall_mape: number | null;
  product_count: number;
  cutoff_count: number;
  log_rows: number;
  eval_rows: number;
  charts: Array<{ title: string; image_base64: string }>;
}

// Interface for sales data
export interface SalesSummary {
  date: string;
  total_sales: number;
  total_orders: number;
  average_order_value: number;
}

// Global cache control flag
let isCachingEnabled = true;

const analyticsApi = {
  // Cache control methods
  enableCaching: () => {
    isCachingEnabled = true;
    console.log('Analytics API caching enabled');
    return isCachingEnabled;
  },
  
  disableCaching: () => {
    isCachingEnabled = false;
    console.log('Analytics API caching disabled');
    return isCachingEnabled;
  },
  
  isCachingEnabled: () => {
    return isCachingEnabled;
  },
  
  clearAllCaches: () => {
    // Clear all cache maps
    analyticsApi._suggestionCache.clear();
    analyticsApi._consumptionByDayCache.clear();
    analyticsApi._expenditureByDayCache.clear();
    analyticsApi._consumptionForDayCache.clear();
    analyticsApi._expenditureForDayCache.clear();
    analyticsApi._consumptionForMonthCache.clear();
    analyticsApi._expenditureForMonthCache.clear();
    analyticsApi._wasteOverviewCache.clear();
    analyticsApi._wasteTrendsCache.clear();
    analyticsApi._wasteTopProductsCache.clear();
    analyticsApi._forecastCache.clear();
    analyticsApi._forecastAccuracyCache.clear();
    analyticsApi._festivalContextCache.clear();
    analyticsApi._weatherContextCache.clear();
    console.log('All analytics API caches cleared');
  },
  // Consumption Analytics
  // Cache for weekly consumption summary
  _weeklyConsumptionCache: new Map<string, {data: ConsumptionSummary[], timestamp: number}>(),
  
  getWeeklyConsumptionSummary: async (): Promise<any[]> => {
    try {
      // Check cache first if caching is enabled
      const cacheKey = 'weekly_consumption_summary';
      const now = Date.now();
      const cachedData = analyticsApi._weeklyConsumptionCache.get(cacheKey);
      if (isCachingEnabled && cachedData && (now - cachedData.timestamp < 3600000)) {
        console.log('Using cached weekly consumption summary');
        return cachedData.data;
      }
      
      console.log('Fetching weekly consumption summary from API');
      const response = await analyticsAxios.get(`/consumption/weekly-summary/`);
      
      // The API returns data in the format {weekly_summary: {Monday: 20, Tuesday: 15, etc}}
      // where the values are percentages
      const data = response.data.weekly_summary || {};
      console.log('Raw weekly consumption summary data:', data);
      
      // Transform the data directly to the format needed by the pie chart
      const transformedData = Object.keys(data).map(day => ({
        name: day,  // Day name for the pie chart label
        value: Number(data[day]),  // Value for the pie chart slice
        percentage: Number(data[day]),  // Keep percentage for reference
        fill: { monday: '#8884d8', tuesday: '#82ca9d', wednesday: '#ffc658', thursday: '#ff7300', friday: '#0088fe', saturday: '#00C49F', sunday: '#FFBB28' }[day.toLowerCase()] || '#999'
      }));
      
      console.log('Transformed weekly consumption summary for pie chart:', transformedData);
      
      // Cache the result
      analyticsApi._weeklyConsumptionCache.set(cacheKey, {
        data: transformedData as any,  // Type assertion to avoid TypeScript error
        timestamp: now
      });
      
      return transformedData;
    } catch (error) {
      console.error('Error fetching weekly consumption summary:', error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  },

  // Cache for consumption by day data
  _consumptionByDayCache: new Map<string, {data: DailyConsumption[], timestamp: number}>(),
  
  getConsumptionByDay: async (startDate?: string, endDate?: string): Promise<DailyConsumption[]> => {
    try {
      // Create cache key based on date range
      const cacheKey = `consumption_${startDate || 'all'}_${endDate || 'all'}`;
      
      // Check cache first (valid for 1 hour = 3600000 ms) if caching is enabled
      const now = Date.now();
      const cachedData = analyticsApi._consumptionByDayCache.get(cacheKey);
      if (isCachingEnabled && cachedData && (now - cachedData.timestamp < 3600000)) {
        console.log(`Using cached consumption by day data for range: ${startDate || 'all'} to ${endDate || 'all'}`);
        return cachedData.data;
      }
      
      // Build URL with optional date parameters
      let url = `/consumption/by-day/`;
      const params = [];
      if (startDate) params.push(`start_date=${startDate}`);
      if (endDate) params.push(`end_date=${endDate}`);
      if (params.length > 0) url += `?${params.join('&')}`;
      
      console.log(`Fetching consumption by day data from API with range: ${startDate || 'all'} to ${endDate || 'all'}`);
      const response = await analyticsAxios.get(url);
      
      // Safely access the data - this comes in format {consumption_by_day: {Monday: [...], Tuesday: [...], etc}}
      const consumptionByDay = response.data?.consumption_by_day;
      
      // Transform the data from the API format to the format expected by the UI
      if (consumptionByDay && typeof consumptionByDay === 'object') {
        const transformedData: DailyConsumption[] = [];
        
        // Process each day's data
        Object.entries(consumptionByDay).forEach(([day, products]: [string, any]) => {
          // Ensure products is an array
          const productsArray = Array.isArray(products) ? products : [];
          
          // Sort products by value (consumption amount) in descending order
          const sortedProducts = [...productsArray].sort((a, b) => {
            const valueA = typeof a.value === 'number' ? a.value : 0;
            const valueB = typeof b.value === 'number' ? b.value : 0;
            return valueB - valueA; // Descending order
          });
          
          // Take top 4 products
          const topProducts = sortedProducts.slice(0, 4);
          
          // Calculate total for 'others' category (all products beyond top 4)
          const othersValue = sortedProducts.slice(4).reduce((sum, product) => {
            return sum + (typeof product.value === 'number' ? product.value : 0);
          }, 0);
          
          // Create a standard object with fixed properties for the stacked bar chart
          const dayData: any = { 
            day,
            product1: 0,
            product2: 0,
            product3: 0,
            product4: 0,
            others: 0
          };
          
          // Add top 4 products data
          topProducts.forEach((product, index) => {
            const value = typeof product.value === 'number' ? product.value : 0;
            // Store product name in a custom property for tooltip display
            dayData[`product${index+1}_name`] = product.name || `Product ${index+1}`;
            // Store the actual value
            dayData[`product${index+1}`] = value;
          });
          
          // Add 'others' category if there are more than 4 products
          if (othersValue > 0) {
            dayData.others = othersValue;
          }
          
          transformedData.push(dayData);
        });
        
        // Cache the result
        analyticsApi._consumptionByDayCache.set(cacheKey, {
          data: transformedData,
          timestamp: now
        });
        
        return transformedData;
      }
      
      // Return empty array if no valid data
      return [];
    } catch (error) {
      console.error('Error fetching consumption by day:', error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  },

  // Cache for consumption by day details
  _consumptionForDayCache: new Map<string, {data: DetailedConsumption[], timestamp: number}>(),
  
  getConsumptionForDay: async (dayName: string): Promise<DetailedConsumption[]> => {
    try {
      // Check cache first (valid for 1 hour = 3600000 ms)
      const now = Date.now();
      const cachedData = analyticsApi._consumptionForDayCache.get(dayName);
      if (cachedData && (now - cachedData.timestamp < 3600000)) {
        console.log(`Using cached consumption details for day ${dayName}`);
        return cachedData.data;
      }
      
      console.log(`Fetching consumption details for day ${dayName} from API`);
      const response = await analyticsAxios.get(`/consumption/day/${dayName}`);
      
      // Safely access the data
      let consumptionDetails: DetailedConsumption[] = [];
      
      if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data.consumption_details)) {
          consumptionDetails = response.data.consumption_details;
        } else if (response.data.consumption_details && typeof response.data.consumption_details === 'object') {
          // Handle case where consumption_details is an object
          consumptionDetails = Object.values(response.data.consumption_details);
        }
      }
      
      // Cache the result
      analyticsApi._consumptionForDayCache.set(dayName, {
        data: consumptionDetails,
        timestamp: now
      });
      
      return consumptionDetails;
    } catch (error) {
      console.error(`Error fetching consumption for day ${dayName}:`, error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  },

  // Cache for monthly consumption details
  _consumptionForMonthCache: new Map<string, {data: DetailedConsumption[], timestamp: number}>(),
  
  getConsumptionForMonth: async (year: string, monthName: string): Promise<DetailedConsumption[]> => {
    try {
      // Create cache key
      const cacheKey = `consumption_${year}_${monthName}`;
      
      // Check cache first (valid for 1 hour = 3600000 ms) if caching is enabled
      const now = Date.now();
      const cachedData = analyticsApi._consumptionForMonthCache.get(cacheKey);
      if (isCachingEnabled && cachedData && (now - cachedData.timestamp < 3600000)) {
        console.log(`Using cached consumption details for ${monthName} ${year}`);
        return cachedData.data;
      }
      
      console.log(`Fetching consumption details for ${monthName} ${year} from API`);
      const response = await analyticsAxios.get(`/consumption/month/${year}/${monthName}`);
      
      // The API returns data in the format {consumption: [{id, name, value, percentage, sku}, ...]}
      // where each object represents a product with its consumption details
      let consumptionDetails: DetailedConsumption[] = [];
      
      if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data.consumption)) {
          // Backend returns consumption as an array of product details
          consumptionDetails = response.data.consumption.map((item: any) => ({
            product_name: item.name || '',
            variant: item.variant || '',
            grade: item.grade || '',
            origin: item.origin || '',
            value: typeof item.value === 'number' ? item.value : 0,
            percentage: typeof item.percentage === 'number' ? item.percentage : 0
          }));
        }
      }
      
      // Cache the result
      analyticsApi._consumptionForMonthCache.set(cacheKey, {
        data: consumptionDetails,
        timestamp: now
      });
      
      return consumptionDetails;
    } catch (error) {
      console.error(`Error fetching consumption for month ${monthName} ${year}:`, error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  },

  // Expenditure Analytics
  getWeeklyExpenditureSummary: async (): Promise<any[]> => {
    try {
      const response = await analyticsAxios.get(`/expenditure/weekly-summary/`);
      
      // Transform the data to match the expected format
      // Check if the response has the expected structure
      const data = response.data.weekly_summary || {};
      console.log('Raw weekly expenditure summary data:', data);
      
      // Transform the data directly to the format needed by the pie chart
      const transformedData = Object.keys(data).map(day => ({
        name: day,  // Day name for the pie chart label
        value: Number(data[day]),  // Value for the pie chart slice
        percentage: Number(data[day]),  // Keep percentage for reference
        fill: { monday: '#8884d8', tuesday: '#82ca9d', wednesday: '#ffc658', thursday: '#ff7300', friday: '#0088fe', saturday: '#00C49F', sunday: '#FFBB28' }[day.toLowerCase()] || '#999'
      }));
      
      console.log('Transformed weekly expenditure summary for pie chart:', transformedData);
      return transformedData;
    } catch (error) {
      console.error('Error fetching weekly expenditure summary:', error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  },

  // Cache for expenditure by day data
  _expenditureByDayCache: new Map<string, {data: DailyExpenditure[], timestamp: number}>(),
  
  getExpenditureByDay: async (startDate?: string, endDate?: string): Promise<DailyExpenditure[]> => {
    try {
      // Create cache key based on date range
      const cacheKey = `expenditure_${startDate || 'all'}_${endDate || 'all'}`;
      
      // Check cache first (valid for 1 hour = 3600000 ms) if caching is enabled
      const now = Date.now();
      const cachedData = analyticsApi._expenditureByDayCache.get(cacheKey);
      if (isCachingEnabled && cachedData && (now - cachedData.timestamp < 3600000)) {
        console.log(`Using cached expenditure by day data for range: ${startDate || 'all'} to ${endDate || 'all'}`);
        return cachedData.data;
      }
      
      // Build URL with optional date parameters
      let url = `/expenditure/by-day/`;
      const params = [];
      if (startDate) params.push(`start_date=${startDate}`);
      if (endDate) params.push(`end_date=${endDate}`);
      if (params.length > 0) url += `?${params.join('&')}`;
      
      console.log(`Fetching expenditure by day data from API with range: ${startDate || 'all'} to ${endDate || 'all'}`);
      const response = await analyticsAxios.get(url);
      
      // Safely access the data
      const expenditureByDay = response.data?.expenditure_by_day;
      
      // Transform the data from the API format to the format expected by the UI
      if (expenditureByDay && typeof expenditureByDay === 'object') {
        const transformedData: DailyExpenditure[] = [];
        
        // Process each day's data
        Object.entries(expenditureByDay).forEach(([day, products]: [string, any]) => {
          // Ensure products is an array
          const productsArray = Array.isArray(products) ? products : [];
          
          // Sort products by value (expenditure amount) in descending order
          const sortedProducts = [...productsArray].sort((a, b) => {
            const valueA = typeof a.value === 'number' ? a.value : 0;
            const valueB = typeof b.value === 'number' ? b.value : 0;
            return valueB - valueA; // Descending order
          });
          
          // Take top 4 products
          const topProducts = sortedProducts.slice(0, 4);
          
          // Calculate total for 'others' category (all products beyond top 4)
          const othersValue = sortedProducts.slice(4).reduce((sum, product) => {
            return sum + (typeof product.value === 'number' ? product.value : 0);
          }, 0);
          
          // Create a standard object with fixed properties for the stacked bar chart
          const dayData: any = { 
            day,
            product1: 0,
            product2: 0,
            product3: 0,
            product4: 0,
            others: 0
          };
          
          // Add top 4 products data
          topProducts.forEach((product, index) => {
            const value = typeof product.value === 'number' ? product.value : 0;
            // Store product name in a custom property for tooltip display
            dayData[`product${index+1}_name`] = product.name || product.product_name || `Product ${index+1}`;
            // Store the actual value
            dayData[`product${index+1}`] = value;
          });
          
          // Add 'others' category if there are more than 4 products
          if (othersValue > 0) {
            dayData.others = othersValue;
          }
          
          transformedData.push(dayData);
        });
        
        // Cache the result
        analyticsApi._expenditureByDayCache.set(cacheKey, {
          data: transformedData,
          timestamp: now
        });
        
        console.log('Transformed expenditure data:', transformedData);
        return transformedData;
      }
      
      // Return empty array if no valid data
      return [];
    } catch (error) {
      console.error('Error fetching expenditure by day:', error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  },

  // Cache for expenditure by day details
  _expenditureForDayCache: new Map<string, {data: DetailedExpenditure[], timestamp: number}>(),
  
  getExpenditureForDay: async (dayName: string): Promise<DetailedExpenditure[]> => {
    try {
      // Check cache first (valid for 1 hour = 3600000 ms)
      const now = Date.now();
      const cachedData = analyticsApi._expenditureForDayCache.get(dayName);
      if (cachedData && (now - cachedData.timestamp < 3600000)) {
        console.log(`Using cached expenditure details for day ${dayName}`);
        return cachedData.data;
      }
      
      console.log(`Fetching expenditure details for day ${dayName} from API`);
      const response = await analyticsAxios.get(`/expenditure/day/${dayName}`);
      
      // Safely access the data
      let expenditureDetails: DetailedExpenditure[] = [];
      
      if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data.expenditure_details)) {
          expenditureDetails = response.data.expenditure_details;
        } else if (response.data.expenditure_details && typeof response.data.expenditure_details === 'object') {
          // Handle case where expenditure_details is an object
          expenditureDetails = Object.values(response.data.expenditure_details);
        }
      }
      
      // Cache the result
      analyticsApi._expenditureForDayCache.set(dayName, {
        data: expenditureDetails,
        timestamp: now
      });
      
      return expenditureDetails;
    } catch (error) {
      console.error(`Error fetching expenditure for day ${dayName}:`, error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  },

  // Cache for monthly expenditure details
  _expenditureForMonthCache: new Map<string, {data: DetailedExpenditure[], timestamp: number}>(),
  
  getExpenditureForMonth: async (year: string, monthName: string): Promise<DetailedExpenditure[]> => {
    try {
      // Create cache key
      const cacheKey = `expenditure_${year}_${monthName}`;
      
      // Check cache first (valid for 1 hour = 3600000 ms) if caching is enabled
      const now = Date.now();
      const cachedData = analyticsApi._expenditureForMonthCache.get(cacheKey);
      if (isCachingEnabled && cachedData && (now - cachedData.timestamp < 3600000)) {
        console.log(`Using cached expenditure details for ${monthName} ${year}`);
        return cachedData.data;
      }
      
      console.log(`Fetching expenditure details for ${monthName} ${year} from API`);
      const response = await analyticsAxios.get(`/expenditure/month/${year}/${monthName}`);
      
      // The API returns data in the format {expenditure: [{id, name, value, percentage, sku}, ...]}
      // where each object represents a product with its expenditure details
      let expenditureDetails: DetailedExpenditure[] = [];
      
      if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data.expenditure)) {
          // Backend returns expenditure as an array of product details
          expenditureDetails = response.data.expenditure.map((item: any) => ({
            product_name: item.name || '',
            variant: item.variant || '',
            grade: item.grade || '',
            origin: item.origin || '',
            value: typeof item.value === 'number' ? item.value : 0,
            percentage: typeof item.percentage === 'number' ? item.percentage : 0
          }));
        }
      }
      
      // Cache the result
      analyticsApi._expenditureForMonthCache.set(cacheKey, {
        data: expenditureDetails,
        timestamp: now
      });
      
      return expenditureDetails;
    } catch (error) {
      console.error(`Error fetching expenditure for month ${monthName} ${year}:`, error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  },

  // Product Suggestions with caching
  _suggestionCache: new Map<string, {data: SuggestionResponse, timestamp: number}>(),

  getProductSuggestionsForDay: async (dayName: string, branchId?: string): Promise<SuggestionResponse> => {
    try {
      // Check cache first (valid for 1 hour = 3600000 ms) if caching is enabled
      const cacheKey = branchId ? `${dayName}:${branchId}` : dayName;
      const now = Date.now();
      const cachedData = analyticsApi._suggestionCache.get(cacheKey);
      if (isCachingEnabled && cachedData && (now - cachedData.timestamp < 3600000)) {
        console.log(`Using cached product suggestions for ${cacheKey}`);
        return cachedData.data;
      }

      console.log(`Fetching product suggestions for ${dayName} (branch: ${branchId || 'all'}) from API`);
      const params: Record<string, string> = {};
      if (branchId) params.branch_id = branchId;
      const response = await analyticsAxios.get(`/suggestions/${dayName}`, { params, timeout: 30000 });

      // Ensure we always have an array, even if the API returns unexpected data
      let suggestions: ProductSuggestion[] = [];

      if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data.suggestions)) {
          suggestions = response.data.suggestions;
        } else if (response.data.suggestions && typeof response.data.suggestions === 'object') {
          // Handle case where suggestions is an object with product data
          suggestions = Object.values(response.data.suggestions);
        }
      }

      const result: SuggestionResponse = {
        suggestions,
        typical_order_size: response.data?.typical_order_size || suggestions.length,
      };

      // Cache the result
      analyticsApi._suggestionCache.set(cacheKey, {
        data: result,
        timestamp: now,
      });

      return result;
    } catch (error) {
      console.error(`Error fetching product suggestions for day ${dayName}:`, error);
      // Return empty response instead of throwing to prevent app crashes
      return { suggestions: [], typical_order_size: 0 };
    }
  },

  // Sales Analytics
  getDailySalesSummary: async (): Promise<SalesSummary[]> => {
    try {
      const response = await analyticsAxios.get(`/sales/daily`);
      return response.data.daily_sales;
    } catch (error) {
      console.error('Error fetching daily sales summary:', error);
      throw error;
    }
  },

  getDailyTotalSales: async (): Promise<SalesSummary[]> => {
    try {
      const response = await analyticsAxios.get(`/sales/daily-totals`);
      return response.data.daily_totals;
    } catch (error) {
      console.error('Error fetching daily total sales:', error);
      throw error;
    }
  },

  getMonthlySalesSummary: async (): Promise<SalesSummary[]> => {
    try {
      const response = await analyticsAxios.get(`/sales/monthly`);
      return response.data.monthly_sales;
    } catch (error) {
      console.error('Error fetching monthly sales summary:', error);
      throw error;
    }
  },

  getYearlySalesSummary: async (): Promise<SalesSummary[]> => {
    try {
      const response = await analyticsAxios.get(`/sales/yearly`);
      return response.data.yearly_sales;
    } catch (error) {
      console.error('Error fetching yearly sales summary:', error);
      throw error;
    }
  },

  // ── Waste Intelligence ─────────────────────────────────────────────
  _wasteOverviewCache: new Map<string, {data: any, timestamp: number}>(),
  _wasteTrendsCache: new Map<string, {data: any, timestamp: number}>(),
  _wasteTopProductsCache: new Map<string, {data: any, timestamp: number}>(),

  getWasteOverview: async (days: number = 30, branchId?: string) => {
    try {
      const cacheKey = `waste_overview_${days}_${branchId || 'all'}`;
      const now = Date.now();
      const cached = analyticsApi._wasteOverviewCache.get(cacheKey);
      if (isCachingEnabled && cached && (now - cached.timestamp < 3600000)) {
        console.log(`Using cached waste overview for ${days} days`);
        return cached.data;
      }
      console.log(`Fetching waste overview for ${days} days from API`);
      const params: any = { days };
      if (branchId) params.branch_id = branchId;
      const response = await analyticsAxios.get(`/api/v1/analytics/waste/overview`, { params });
      const data = response.data?.data || { summary: { total_waste_cost: 0, flagged_products: 0, risk_breakdown: { LOW: 0, MEDIUM: 0, HIGH: 0 } }, products: [] };
      analyticsApi._wasteOverviewCache.set(cacheKey, { data, timestamp: now });
      return data;
    } catch (error) {
      console.error('Error fetching waste overview:', error);
      return { summary: { total_waste_cost: 0, flagged_products: 0, risk_breakdown: { LOW: 0, MEDIUM: 0, HIGH: 0 } }, products: [] };
    }
  },

  getWasteTrends: async (months: number = 6, branchId?: string) => {
    try {
      const cacheKey = `waste_trends_${months}_${branchId || 'all'}`;
      const now = Date.now();
      const cached = analyticsApi._wasteTrendsCache.get(cacheKey);
      if (isCachingEnabled && cached && (now - cached.timestamp < 3600000)) {
        console.log(`Using cached waste trends for ${months} months`);
        return cached.data;
      }
      console.log(`Fetching waste trends for ${months} months from API`);
      const params: any = { months };
      if (branchId) params.branch_id = branchId;
      const response = await analyticsAxios.get(`/api/v1/analytics/waste/trends`, { params });
      const data = response.data?.data || { months: [], products: [], monthly_totals: [] };
      analyticsApi._wasteTrendsCache.set(cacheKey, { data, timestamp: now });
      return data;
    } catch (error) {
      console.error('Error fetching waste trends:', error);
      return { months: [], products: [], monthly_totals: [] };
    }
  },

  getWasteTopProducts: async (days: number = 90, limit: number = 10, branchId?: string) => {
    try {
      const cacheKey = `waste_top_${days}_${limit}_${branchId || 'all'}`;
      const now = Date.now();
      const cached = analyticsApi._wasteTopProductsCache.get(cacheKey);
      if (isCachingEnabled && cached && (now - cached.timestamp < 3600000)) {
        console.log(`Using cached waste top products`);
        return cached.data;
      }
      console.log(`Fetching waste top products (${days} days, limit ${limit}) from API`);
      const params: any = { days, limit };
      if (branchId) params.branch_id = branchId;
      const response = await analyticsAxios.get(`/api/v1/analytics/waste/top-products`, { params });
      const data = response.data?.data || { summary: {}, products: [] };
      analyticsApi._wasteTopProductsCache.set(cacheKey, { data, timestamp: now });
      return data;
    } catch (error) {
      console.error('Error fetching waste top products:', error);
      return { summary: {}, products: [] };
    }
  },

  checkOrderWaste: async (items: Array<{ product_id: string; quantity: number; unit_price?: number }>) => {
    try {
      // No cache for real-time order check
      console.log(`Checking order waste for ${items.length} items`);
      const response = await analyticsAxios.post(`/api/v1/analytics/waste/check-order`, { items });
      return response.data?.data || { alerts: [], total_excess_cost: 0, items_checked: 0, items_flagged: 0 };
    } catch (error) {
      console.error('Error checking order waste:', error);
      return { alerts: [], total_excess_cost: 0, items_checked: items.length, items_flagged: 0 };
    }
  },

  // ── Demand Forecast (Prophet ML) ──────────────────────────────────
  _forecastCache: new Map<string, {data: any, timestamp: number}>(),
  _forecastAccuracyCache: new Map<string, {data: any, timestamp: number}>(),

  getDemandForecast: async (days: number = 7, productId?: string): Promise<ForecastResponse | null> => {
    try {
      const cacheKey = `forecast_${days}_${productId || 'all'}`;
      const now = Date.now();
      const cached = analyticsApi._forecastCache.get(cacheKey);
      if (isCachingEnabled && cached && (now - cached.timestamp < 3600000)) {
        console.log('Using cached demand forecast');
        return cached.data;
      }
      console.log(`Fetching demand forecast (${days} days) from API`);
      const params: Record<string, string> = { days: String(days) };
      if (productId) params.product_id = productId;
      const response = await analyticsAxios.get('/api/v1/analytics/forecast/demand', { params, timeout: 300000 });
      const data: ForecastResponse = response.data?.data || response.data;
      analyticsApi._forecastCache.set(cacheKey, { data, timestamp: now });
      return data;
    } catch (error) {
      console.error('Error fetching demand forecast:', error);
      return null;
    }
  },

  getForecastAccuracy: async (): Promise<ForecastAccuracyResponse | null> => {
    try {
      const cacheKey = 'forecast_accuracy';
      const now = Date.now();
      const cached = analyticsApi._forecastAccuracyCache.get(cacheKey);
      if (isCachingEnabled && cached && (now - cached.timestamp < 3600000)) {
        console.log('Using cached forecast accuracy');
        return cached.data;
      }
      console.log('Fetching forecast accuracy from API');
      const response = await analyticsAxios.get('/api/v1/analytics/forecast/accuracy', { timeout: 300000 });
      const data: ForecastAccuracyResponse = response.data?.data || response.data;
      analyticsApi._forecastAccuracyCache.set(cacheKey, { data, timestamp: now });
      return data;
    } catch (error) {
      console.error('Error fetching forecast accuracy:', error);
      return null;
    }
  },

  // ── Forecast Calibration ──────────────────────────────────────
  _calibrationCache: new Map<string, {data: any, timestamp: number}>(),

  getCalibrationForDate: async (date: string): Promise<CalibrationDateResponse | null> => {
    try {
      const cacheKey = `calibration_date_${date}`;
      const now = Date.now();
      const cached = analyticsApi._calibrationCache.get(cacheKey);
      if (isCachingEnabled && cached && (now - cached.timestamp < 3600000)) {
        return cached.data;
      }
      console.log(`Fetching calibration data for date: ${date}`);
      const response = await analyticsAxios.get('/api/v1/analytics/forecast/calibration/date', {
        params: { date },
        timeout: 60000,
      });
      const data: CalibrationDateResponse = response.data?.data || response.data;
      analyticsApi._calibrationCache.set(cacheKey, { data, timestamp: now });
      return data;
    } catch (error) {
      console.error('Error fetching calibration for date:', error);
      return null;
    }
  },

  getCalibrationStatus: async (): Promise<CalibrationStatusResponse | null> => {
    try {
      const cacheKey = 'calibration_status';
      const now = Date.now();
      const cached = analyticsApi._calibrationCache.get(cacheKey);
      if (isCachingEnabled && cached && (now - cached.timestamp < 300000)) {
        return cached.data;
      }
      console.log('Fetching calibration status');
      const response = await analyticsAxios.get('/api/v1/analytics/forecast/calibration/status', {
        timeout: 60000,
      });
      const data: CalibrationStatusResponse = response.data?.data || response.data;
      analyticsApi._calibrationCache.set(cacheKey, { data, timestamp: now });
      return data;
    } catch (error) {
      console.error('Error fetching calibration status:', error);
      return null;
    }
  },

  runCalibration: async (startDate: string, endDate: string, stepDays: number = 7, clientId?: string): Promise<CalibrationRunResponse | null> => {
    try {
      console.log(`Running calibration: ${startDate} to ${endDate}`);
      const response = await analyticsAxios.post('/api/v1/analytics/forecast/calibration/run', {
        client_id: clientId,
        start_date: startDate,
        end_date: endDate,
        step_days: stepDays,
      }, { timeout: 600000 });
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error running calibration:', error);
      return null;
    }
  },

  // ── Festival & Weather Context ──────────────────────────────────
  _festivalContextCache: new Map<string, {data: any, timestamp: number}>(),
  _weatherContextCache: new Map<string, {data: any, timestamp: number}>(),

  getFestivalContext: async (date?: string): Promise<any | null> => {
    try {
      const cacheKey = `festival_ctx_${date || 'today'}`;
      const now = Date.now();
      const cached = analyticsApi._festivalContextCache.get(cacheKey);
      if (isCachingEnabled && cached && (now - cached.timestamp < 3600000)) {
        return cached.data;
      }
      const params: Record<string, string> = {};
      if (date) params.date = date;
      const response = await analyticsAxios.get('/api/v1/analytics/festivals/context', { params });
      const data = response.data?.data || response.data;
      analyticsApi._festivalContextCache.set(cacheKey, { data, timestamp: now });
      return data;
    } catch (error) {
      console.error('Error fetching festival context:', error);
      return null;
    }
  },

  getWeatherContext: async (date?: string): Promise<any | null> => {
    try {
      const cacheKey = `weather_ctx_${date || 'tomorrow'}`;
      const now = Date.now();
      const cached = analyticsApi._weatherContextCache.get(cacheKey);
      if (isCachingEnabled && cached && (now - cached.timestamp < 3600000)) {
        return cached.data;
      }
      const params: Record<string, string> = {};
      if (date) params.date = date;
      const response = await analyticsAxios.get('/api/v1/analytics/weather/context', { params });
      const data = response.data?.data || response.data;
      analyticsApi._weatherContextCache.set(cacheKey, { data, timestamp: now });
      return data;
    } catch (error) {
      console.error('Error fetching weather context:', error);
      return null;
    }
  },

  getProductSuggestionsWithContext: async (dayName: string): Promise<SuggestionsWithContext> => {
    try {
      console.log(`Fetching suggestions with context for ${dayName}`);
      const response = await analyticsAxios.get(`/suggestions/${dayName}`, { timeout: 30000 });
      let suggestions: ProductSuggestion[] = [];
      let context: SuggestionContext | null = null;

      if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data.suggestions)) {
          suggestions = response.data.suggestions;
        } else if (response.data.suggestions && typeof response.data.suggestions === 'object') {
          suggestions = Object.values(response.data.suggestions);
        }
        if (response.data.context) {
          context = response.data.context;
        }
      }
      return { suggestions, context };
    } catch (error) {
      console.error(`Error fetching suggestions with context for ${dayName}:`, error);
      return { suggestions: [], context: null };
    }
  },

  // ── Text Order Matching (Smart Order) ──────────────────────────────────
  processTextOrder: async (text: string): Promise<{
    matchedItems: Array<{
      productId: string;
      productName: string;
      quantity: number;
      unit: string;
      unitPrice: number;
      sku: string;
    }>;
    unmatchedItems: Array<{
      text: string;
      productName: string;
      quantity: number;
      unit: string;
    }>;
    stats: {
      totalItems: number;
      matchedItems: number;
      unmatchedItems: number;
    };
  }> => {
    try {
      console.log('Processing text order via analytics API');
      const response = await analyticsAxios.post('/text-order/process', { text });
      return response.data;
    } catch (error) {
      console.error('Error processing text order:', error);
      throw error;
    }
  },

  findSimilarProducts: async (text: string, maxResults: number = 5): Promise<Array<{
    id: string;
    name: string;
    unit_name: string;
    unit_price: number;
    sku?: string;
  }>> => {
    try {
      console.log('Finding similar products via analytics API');
      const response = await analyticsAxios.post('/text-order/find-similar', { text, max_results: maxResults });
      return response.data?.similar_products || [];
    } catch (error) {
      console.error('Error finding similar products:', error);
      throw error;
    }
  },

  searchProducts: async (query: string, limit: number = 10): Promise<Array<{
    id: string;
    name: string;
    unit_name: string;
    unit_price: number;
    sku: string;
  }>> => {
    try {
      console.log('Searching products via analytics API');
      const response = await analyticsAxios.get('/text-order/products/search', { params: { q: query, limit } });
      return response.data?.products || [];
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  },

  // Dashboard Analytics - New Overview API
  getOverview: async (timePeriod: string = '30d', comparison: string = 'previous_period', startDate?: string, endDate?: string, branchId?: string, groupByBranch?: boolean) => {
    try {
      console.log(`Fetching dashboard overview for period: ${timePeriod}, branch: ${branchId || 'all'}`);

      const params: any = {
        time_period: timePeriod,
        comparison: comparison
      };

      // Add custom date parameters if provided
      if (timePeriod === 'custom' && startDate && endDate) {
        params.start_date = startDate;
        params.end_date = endDate;
      }

      if (branchId) {
        params.branch_id = branchId;
      }

      if (groupByBranch) {
        params.group_by_branch = 'true';
      }

      const response = await analyticsAxios.get(`/api/v1/analytics/overview`, {
        params
      });
      
      console.log('Analytics API Response:', response.data);
      // The API returns data nested under a 'data' property, so we need to extract it
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
      throw error;
    }
  },

  // ── Festival & Calendar Context ──────────────────────────────
  getUpcomingFestivals: async (days: number = 30): Promise<UpcomingFestival[]> => {
    try {
      const response = await analyticsAxios.get('/api/v1/analytics/festivals/upcoming', {
        params: { days },
        timeout: 10000,
      });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error fetching upcoming festivals:', error);
      return [];
    }
  },

  getFestivalContext: async (dateStr?: string): Promise<Record<string, unknown> | null> => {
    try {
      const params: Record<string, string> = {};
      if (dateStr) params.date = dateStr;
      const response = await analyticsAxios.get('/api/v1/analytics/festivals/context', {
        params,
        timeout: 10000,
      });
      return response.data?.data || null;
    } catch (error) {
      console.error('Error fetching festival context:', error);
      return null;
    }
  },

  getWeatherContext: async (dateStr?: string): Promise<Record<string, unknown> | null> => {
    try {
      const params: Record<string, string> = {};
      if (dateStr) params.date = dateStr;
      const response = await analyticsAxios.get('/api/v1/analytics/weather/context', {
        params,
        timeout: 10000,
      });
      return response.data?.data || null;
    } catch (error) {
      console.error('Error fetching weather context:', error);
      return null;
    }
  },
};

export default analyticsApi;
