import api from './authApi';

export interface OrderTemplateItem {
  product_id: string;
  product_name?: string;
  quantity: number;
  unit?: string;
}

export interface OrderTemplate {
  id: string;
  client_id: string;
  name: string;
  items: OrderTemplateItem[];
  created_at: string;
  updated_at: string;
}

const templateApi = {
  // Get all templates for the authenticated client
  getTemplates: async (): Promise<OrderTemplate[]> => {
    try {
      const response = await api.get('/b2bclients/my/templates');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  },

  // Create a new template from cart items
  createTemplate: async (
    name: string,
    items: { product_id: string; product_name?: string; quantity: number; unit?: string }[]
  ): Promise<OrderTemplate> => {
    try {
      const response = await api.post('/b2bclients/my/templates', {
        name,
        items: items.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name || '',
          quantity: item.quantity,
          unit: item.unit || '',
        })),
      });
      return response.data;
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  },

  // Delete a template by ID
  deleteTemplate: async (id: string): Promise<void> => {
    try {
      await api.delete(`/b2bclients/my/templates/${id}`);
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  },
};

export default templateApi;
