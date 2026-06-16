import { analyticsAxios } from './analyticsAxios';
import axios from 'axios';
import { API__BASE_URL } from './url_config';

const backendApi = axios.create({
  baseURL: API__BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

backendApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('farmaze_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Types for client-facing endpoints
export interface SupplierMapping {
  ID: string;
  ClientID: string;
  SupplierID: string;
  SupplierName: string;
  SupplierPhone: string | null;
  SupplierStatus: string;
  Categories: string[];
  IsDefault: boolean;
  Priority: number;
  CreatedAt: string;
}

export interface ClientProduct {
  ID: string;
  ClientID: string;
  ProductID: string;
  ProductName: string;
  ProductSKU: string;
  UnitPrice: number;
  CategoryName: string | null;
  IsActive: boolean;
  EffectiveDate: string;
  CreatedAt: string;
}

// Client-facing supplier endpoint
export const getMySuppliers = async (): Promise<SupplierMapping[]> => {
  const response = await backendApi.get('/api/v1/b2bclients/my/suppliers');
  return response.data.mappings || [];
};

export interface SupplierListItem {
  id: string;
  name: string;
  category?: string;
  whatsapp_number?: string;
}

// All active suppliers — used for vendor filter dropdown
export const getSuppliers = async (): Promise<SupplierListItem[]> => {
  const response = await backendApi.get('/api/v1/suppliers');
  return response.data.suppliers || [];
};

// Client-facing product endpoints
export const getMyProducts = async (): Promise<ClientProduct[]> => {
  const response = await backendApi.get('/api/v1/b2bclients/my/products');
  return response.data.products || [];
};

export const addToMyProducts = async (productIds: string[]): Promise<void> => {
  await backendApi.post('/api/v1/b2bclients/my/products', { product_ids: productIds });
};

export const removeFromMyProducts = async (productIds: string[]): Promise<void> => {
  await backendApi.delete('/api/v1/b2bclients/my/products', {
    data: { product_ids: productIds },
  });
};

// Client details (for WhatsApp settings)
export const getClientDetails = async (): Promise<{
  whatsapp_number?: string;
  whatsapp_verified?: boolean;
}> => {
  const response = await backendApi.get('/api/v1/b2bclients/details');
  return response.data;
};

// WhatsApp settings
export const updateMyWhatsApp = async (
  whatsappNumber: string,
  enabled: boolean
): Promise<void> => {
  await backendApi.put('/api/v1/b2bclients/my/whatsapp', {
    whatsapp_number: whatsappNumber,
    enabled,
  });
};

// Supplier endpoints (backend)
export const createSupplier = (data: Record<string, unknown>) =>
  backendApi.post('/api/v1/suppliers', data);
export const getClientSuppliers = (clientId: string) =>
  backendApi.get(`/api/v1/clients/${clientId}/suppliers`);
export const mapSupplierToClient = (clientId: string, data: Record<string, unknown>) =>
  backendApi.post(`/api/v1/clients/${clientId}/suppliers`, data);
export const removeSupplierMapping = (clientId: string, supplierId: string) =>
  backendApi.delete(`/api/v1/clients/${clientId}/suppliers/${supplierId}`);

// Supplier orders (backend)
export const getSupplierOrders = (params: Record<string, unknown>) =>
  backendApi.get('/api/v1/supplier-orders', { params });
export const getSupplierOrderDetail = (id: string) =>
  backendApi.get(`/api/v1/supplier-orders/${id}`);
export const updateSupplierOrderStatus = (id: string, status: string) =>
  backendApi.put(`/api/v1/supplier-orders/${id}/status`, { status });

// Supplier scoring (backend)
export const getSupplierScore = (supplierId: string) =>
  backendApi.get(`/api/v1/suppliers/${supplierId}/score`);

// Analytics endpoints (farmaze-analytics)
export const getProcurementPlan = (clientId: string) =>
  analyticsAxios.get(`/api/v1/analytics/forecast/procurement-plan?client_id=${clientId}`);
export const checkWaste = (clientId: string, items: Record<string, unknown>[]) =>
  analyticsAxios.post('/api/v1/analytics/waste/check-order', { client_id: clientId, items });
export const comparePrices = (productIds: string) =>
  analyticsAxios.get(`/api/v1/analytics/prices/compare?product_ids=${productIds}`);
export const getPriceAlerts = (clientId: string) =>
  analyticsAxios.get(`/api/v1/analytics/prices/alerts?client_id=${clientId}`);
export const getProcurementMetrics = (clientId: string) =>
  analyticsAxios.get(`/api/v1/analytics/metrics/procurement?client_id=${clientId}`);

// ── Price Intelligence helpers ─────────────────────────────────────────

export interface PriceComparisonSupplier {
  supplier_name: string;
  price: number;
  last_updated: string | null;
}

export interface PriceComparisonProduct {
  product_id: string;
  product_name: string;
  suppliers: PriceComparisonSupplier[];
  cheapest: string | null;
  price_range: { min: number; max: number };
}

export interface PriceRow {
  productId: string;
  productName: string;
  unit: string;
  category: string | null;
  farmazePrice: number;
  quantity: number;
  vendorPrices: Record<string, number | null>;
  savingsPercent: number | null;
}

export interface MarketComparisonData {
  priceRows: PriceRow[];
  vendorColumns: string[];
  totalOrderValue: number;
  totalSavings: number;
  savingsPercent: number;
  skuCount: number;
  topSku: { name: string; spend: number } | null;
}

const COMPETITOR_NAMES = ['HyperPure', 'BigBasket B2B', 'Mandi'];

export interface MarketComparisonParams {
  timePeriod?: '7d' | '30d' | '90d' | 'custom';
  startDate?: string;
  endDate?: string;
  branchId?: string;
}

export const getMarketComparison = async (
  clientId: string,
  params: MarketComparisonParams = {},
): Promise<MarketComparisonData> => {
  const { spendAnalyticsApi } = await import('./spendAnalyticsApi');

  // Fetch products (with prices from order history) and suppliers in parallel
  const [products, suppliers] = await Promise.all([
    spendAnalyticsApi.getTopProducts({
      timePeriod: params.timePeriod || '30d',
      startDate: params.startDate,
      endDate: params.endDate,
      branchId: params.branchId,
      granularity: 'total',
      limit: 500,
    }),
    getMySuppliers(),
  ]);

  if (!products || products.length === 0) {
    return {
      priceRows: [],
      vendorColumns: [],
      totalOrderValue: 0,
      totalSavings: 0,
      savingsPercent: 0,
      skuCount: 0,
      topSku: null,
    };
  }

  // Fetch supplier price comparison
  const productIds = products.map(p => p.product_id).filter(Boolean).join(',');
  let comparisonProducts: PriceComparisonProduct[] = [];
  if (productIds) {
    try {
      const resp = await comparePrices(productIds);
      comparisonProducts = resp.data?.products || [];
    } catch {
      // Graceful fallback
    }
  }

  // Build a map of product_id -> supplier prices
  const priceMap: Record<string, PriceComparisonSupplier[]> = {};
  for (const cp of comparisonProducts) {
    priceMap[cp.product_id] = cp.suppliers || [];
  }

  // Determine supplier column names (exclude Farmaze entries)
  const supplierNames = suppliers
    .map(s => s.SupplierName)
    .filter(name => name !== 'Farmaze' && name !== 'Farmaze (cost price)');

  const displaySuppliers = supplierNames.slice(0, 3);
  const vendorColumns = [...displaySuppliers, ...COMPETITOR_NAMES];

  // Build price rows
  let totalOrderValue = 0;
  let totalSavingsAmount = 0;
  let topSku: { name: string; spend: number } | null = null;

  const priceRows: PriceRow[] = products.map((product) => {
    const productId = product.product_id;
    const productName = product.product_name || 'Unknown';
    const unitName = product.unit || 'Kg';
    const categoryName = product.category || null;
    const avgPrice = product.avg_unit_price || 0;
    const quantity = product.total_quantity || 0;
    const spend = product.product_spend || 0;

    totalOrderValue += spend;

    if (!topSku || spend > topSku.spend) {
      topSku = { name: productName, spend };
    }

    // Get supplier prices for this product
    const supplierPrices = priceMap[productId] || [];
    const vendorPrices: Record<string, number | null> = {};

    for (const col of vendorColumns) {
      const match = supplierPrices.find(
        sp => sp.supplier_name === col || sp.supplier_name === `[Market] ${col}`
      );
      vendorPrices[col] = match ? match.price : null;
    }

    // Calculate savings vs average vendor price
    const knownVendorPrices = Object.values(vendorPrices).filter((p): p is number => p !== null);
    let savingsPercent: number | null = null;
    if (knownVendorPrices.length > 0) {
      const avgVendor = knownVendorPrices.reduce((a, b) => a + b, 0) / knownVendorPrices.length;
      if (avgVendor > 0) {
        savingsPercent = Math.round(((avgVendor - avgPrice) / avgVendor) * 100);
        totalSavingsAmount += avgVendor - avgPrice;
      }
    }

    return {
      productId,
      productName,
      unit: unitName,
      category: categoryName,
      farmazePrice: Math.round(avgPrice),
      quantity: Math.round(quantity * 100) / 100,
      vendorPrices,
      savingsPercent,
    };
  });

  const overallSavingsPercent = totalOrderValue > 0
    ? Math.round((totalSavingsAmount / (totalOrderValue + totalSavingsAmount)) * 100)
    : 0;

  return {
    priceRows,
    vendorColumns,
    totalOrderValue: Math.round(totalOrderValue),
    totalSavings: Math.round(totalSavingsAmount),
    savingsPercent: overallSavingsPercent,
    skuCount: products.length,
    topSku,
  };
};
