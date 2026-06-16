
export interface Product {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  availability: string;
  sku?: string;
  price?: number;
  bulkPrice?: number;
  packSize?: string;
  weight?: string;
  brand?: string;
  type?: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  subcategory?: string;
  minOrderQuantity?: number;
  isDiscounted?: boolean;
}

export interface AnalyticsFilters {
  timeRange: 'daily' | 'weekly' | 'monthly';
  month: string;
  year: string;
}

export interface ProductCategory {
  id?: string;
  name: string;
  image: string;
  icon?: React.ReactNode;
  subcategories?: ProductSubcategory[];
}

export interface ProductSubcategory {
  id?: string;
  name: string;
  image?: string;
}

export interface FilterOption {
  id: string;
  name: string;
  value: string;
}
