import { http, HttpResponse } from 'msw';
import { products } from './data/products';
import { categories } from './data/categories';
import { orders } from './data/orders';
import { analytics } from './data/analytics';

// Base API URL
const API_BASE_URL = '/api/v1';

export const handlers = [
  // Auth endpoints
  http.post(`${API_BASE_URL}/auth/login`, async () => {
    return HttpResponse.json({
      token: 'mock-jwt-token',
      user: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin'
      }
    }, { status: 200 });
  }),

  // Products endpoints
  http.get(`${API_BASE_URL}/products`, () => {
    return HttpResponse.json(products, { status: 200 });
  }),

  http.get(`${API_BASE_URL}/products/with-category-hierarchy`, () => {
    return HttpResponse.json(products.map(product => ({
      product_id: product.id,
      product_name: product.name,
      sku: product.sku || '',
      unit_name: product.unit,
      category_id: product.categoryId,
      category_name: product.category,
      subcategory_id: product.subcategoryId,
      subcategory_name: product.subcategory
    })), { status: 200 });
  }),

  http.get(`${API_BASE_URL}/products/search`, ({ request }) => {
    const url = new URL(request.url);
    const categoryId = url.searchParams.get('category_id');
    const subcategoryId = url.searchParams.get('subcategory_id');
    
    let filteredProducts = [...products];
    
    if (categoryId) {
      filteredProducts = filteredProducts.filter(p => p.categoryId === categoryId);
    }
    
    if (subcategoryId) {
      filteredProducts = filteredProducts.filter(p => p.subcategoryId === subcategoryId);
    }
    
    return HttpResponse.json(filteredProducts, { status: 200 });
  }),

  // Categories endpoints
  http.get(`${API_BASE_URL}/categories`, () => {
    return HttpResponse.json(categories, { status: 200 });
  }),

  // Orders endpoints
  http.get(`${API_BASE_URL}/orders`, () => {
    return HttpResponse.json(orders, { status: 200 });
  }),

  // Analytics endpoints
  http.get(`${API_BASE_URL}/analytics/consumption/weekly`, () => {
    return HttpResponse.json(analytics.weeklyConsumption, { status: 200 });
  }),

  http.get(`${API_BASE_URL}/analytics/consumption/by-day`, () => {
    return HttpResponse.json(analytics.consumptionByDay, { status: 200 });
  }),

  http.get(`${API_BASE_URL}/analytics/consumption/for-day/:day`, ({ params }) => {
    const day = params.day;
    return HttpResponse.json(analytics.consumptionForDay[day] || [], { status: 200 });
  }),

  http.get(`${API_BASE_URL}/analytics/consumption/for-month/:month`, ({ params }) => {
    const month = params.month;
    return HttpResponse.json(analytics.consumptionForMonth[month] || [], { status: 200 });
  }),

  http.get(`${API_BASE_URL}/analytics/expenditure/by-day`, () => {
    return HttpResponse.json(analytics.expenditureByDay, { status: 200 });
  }),

  http.get(`${API_BASE_URL}/analytics/expenditure/for-day/:day`, ({ params }) => {
    const day = params.day;
    return HttpResponse.json(analytics.expenditureForDay[day] || [], { status: 200 });
  }),

  http.get(`${API_BASE_URL}/analytics/expenditure/for-month/:month`, ({ params }) => {
    const month = params.month;
    return HttpResponse.json(analytics.expenditureForMonth[month] || [], { status: 200 });
  }),

  // Text order processing endpoint
  http.post(`${API_BASE_URL}/text-order/process`, () => {
    return HttpResponse.json({
      matchedItems: products.slice(0, 10).map(p => ({
        productId: p.id,
        productName: p.name,
        quantity: Math.floor(Math.random() * 10) + 1,
        unit: p.unit
      })),
      stats: {
        matchedItems: 10,
        totalItems: 15,
        unmatchedItems: 5
      },
      unmatchedItems: [
        "Item 1 - 2kg",
        "Item 2 - 3pcs",
        "Item 3 - 1box",
        "Item 4 - 5bags",
        "Item 5 - 2bunches"
      ]
    }, { status: 200 });
  })
];
