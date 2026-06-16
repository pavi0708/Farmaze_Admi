import api from './authApi';

export interface ClientRecommendation {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  unit_name: string;
  category_name: string;
  recommendation_year: number;
  recommendation_score: number;
  total_purchase_amount: number;
  purchase_frequency: number;
  total_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface ClientRecommendationsResponse {
  products: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  client_id: string;
  year: number;
}

export const recommendationsApi = {
  // Get recommendations for the authenticated client
  getMyRecommendations: async (
    year?: number,
    limit?: number,
    offset?: number
  ): Promise<ClientRecommendationsResponse> => {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    
    const response = await api.get(
      `/b2bclients/recommendations?${params.toString()}`
    );
    return response.data;
  },

  // Get recommendations for a specific client (if client ID is known)
  getClientRecommendations: async (
    clientId: string,
    year?: number,
    limit?: number,
    offset?: number
  ): Promise<ClientRecommendationsResponse> => {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    
    const response = await api.get(
      `/clients/${clientId}/recommendations?${params.toString()}`
    );
    return response.data;
  }
};

// Product Requests API
export const productRequestsApi = {
  // Add product to recommendations (direct add)
  addProductToRecommendations: async (request: {
    product_id: string;
  }): Promise<any> => {
    const response = await api.post('/b2bclients/recommendations/add', request);
    return response.data;
  },

  // Create a product request (for products not in catalog)
  createProductRequest: async (request: {
    product_name: string;
    description?: string;
    unit?: string;
  }): Promise<any> => {
    const response = await api.post('/b2bclients/product-requests', request);
    return response.data;
  },

  // Get my product requests
  getMyProductRequests: async (
    status?: string,
    limit?: number,
    offset?: number
  ): Promise<{
    requests: any[];
    total: number;
    limit: number;
    offset: number;
  }> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    
    const response = await api.get(`/b2bclients/product-requests?${params.toString()}`);
    return response.data;
  }
};
