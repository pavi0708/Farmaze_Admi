import api from './authApi';

// API base URL is already defined in authApi.ts
import { CartItem } from '@/context/CartContext';

export interface OrderItem {
  product_id: string;
  quantity: number;
  // Unit field completely removed
}

export interface OrderRequest {
  products: OrderItem[];
  order_date?: string; // Optional order date in YYYY-MM-DD format
  notes?: string; // Optional order notes (delivery instructions, special requests)
  branch_id?: string; // Optional branch ID for multi-branch clients
}

export interface OrderResponse {
  order_id: string;
  order_number: string;
  client_id: string;
  status: string;
  created_at: string;
  branch_id?: string;
  branch_name?: string;
  items: {
    product_id: string;
    product_name: string;
    quantity: number;
    unit: string;
  }[];
}

export interface OrderSummary {
  order_id: string;
  order_number: string;
  client_name: string;
  status: string;
  created_at: string;
  placed_at: string;
  delivered_at: string | null;
  updated_at: string;
  invoice_status: string;
  dc_status: string;
  estimated_delivery_date?: string;
  items_count?: number; // Added for the item count
  total_amount?: number; // Added for the total amount
  contact_phone?: string; // Added for contact phone
  contact_email?: string; // Added for contact email
  branch_id?: string; // Branch this order belongs to
  branch_name?: string; // Branch name for display
  delivery_address?: {
    address_line_1: string;
    address_line_2: string;
    zip_code: string;
    city: string;
    country: string;
  };
  client_contact?: {
    address: {
      address_line_1: string;
      address_line_2: string;
      zip_code: string;
      city: string;
      country: string;
    };
    email: string;
    phone: string;
  };
}

export interface OrderDetail {
  id: string;
  order_id: string;
  product_id: string; // Add product_id field from backend
  product_name: string;
  quantity: number;
  unit: string;
  created_at: string;
  unit_price?: number; // Making this optional as it might not be in the API response
  sku?: string; // Making this optional as it might not be in the API response
  remarks?: string; // Making this optional as it might not be in the API response
}

const orderApi = {
  // Place a new order
  // No helper functions needed as we're using the original product IDs directly
  
  
  placeOrder: async (cartItems: CartItem[], orderDate?: string, notes?: string, branchId?: string): Promise<OrderResponse> => {
    try {
      console.log('orderApi: placeOrder function called');
      console.log('orderApi: Cart items before processing:', cartItems);
      
      if (!cartItems || cartItems.length === 0) {
        console.error('orderApi: Empty cart items array provided to placeOrder');
        throw new Error('Cannot place order with empty cart');
      }
      
      // Transform cart items to order items - use original product IDs without conversion
      const orderItems: OrderItem[] = cartItems.map(item => {
        console.log(`orderApi: Processing cart item - ID: ${item.id}, Name: ${item.name}, Quantity: ${item.quantity}`);
        
        if (!item.id) {
          console.error('orderApi: Cart item has no ID:', item);
          throw new Error('Invalid cart item: missing ID');
        }
        
        // Use the original product ID directly from the API
        // Unit is now optional as the backend will use the product's default unit
        const orderItem = {
          product_id: item.id,
          quantity: item.quantity
          // Removed unit field as it's now optional and will be handled by the backend
        };
        
        console.log(`orderApi: Creating order item for product: ${item.name} with ID: ${item.id}`);
        console.log(`orderApi: Order item created: ${JSON.stringify(orderItem)}`);
        return orderItem;
      });

      const orderRequest: OrderRequest = {
        products: orderItems,
        ...(orderDate && { order_date: orderDate }),
        ...(notes && { notes }),
        ...(branchId && { branch_id: branchId })
      };

      console.log('orderApi: Sending order request to:', '/b2bclients/orders');
      console.log('orderApi: Request payload:', JSON.stringify(orderRequest));
      
      // Add more detailed logging
      try {
        console.log('orderApi: About to make POST request to /b2bclients/orders');
        const response = await api.post('/b2bclients/orders', orderRequest);
        console.log('orderApi: Order response received:', response.data);
        return response.data;
      } catch (apiError) {
        console.error('orderApi: API error details:', {
          status: apiError.response?.status,
          statusText: apiError.response?.statusText,
          data: apiError.response?.data,
          message: apiError.message
        });
        throw apiError;
      }
    } catch (error) {
      console.error('Error placing order:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  },

  // Get all orders for the current client
  getOrders: async (start_date?: string, end_date?: string): Promise<{ 
    orders: OrderSummary[], 
    total_orders: number, 
    qualifying_orders_count: number,
    average_order_value: number
  }> => {
    try {
      const params = new URLSearchParams();
      if (start_date) params.append('start_date', start_date);
      if (end_date) params.append('end_date', end_date);
      
      const url = `/b2bclients/orders${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('Fetching orders from:', url);
      
      const response = await api.get(url);
      console.log('Raw API response for orders:', JSON.stringify(response.data, null, 2));
      
      // Check if orders have items_count
      if (response.data.orders && response.data.orders.length > 0) {
        console.log('First order example:', response.data.orders[0]);
        console.log('Does order have items_count?', 'items_count' in response.data.orders[0]);
      }
      
      return {
        orders: response.data.orders || [],
        total_orders: response.data.total_orders || 0,
        qualifying_orders_count: response.data.qualifying_orders_count || 0,
        average_order_value: response.data.average_order_value || 0
      };
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },

  // Get order details by ID with retry logic
  getOrderById: async (orderId: string): Promise<OrderSummary> => {
    const maxRetries = 2;
    let retries = 0;
    let lastError;

    // Use the original order ID directly without conversion
    const endpoint = `/b2bclients/orders/${orderId}`;
    
    console.log(`Using endpoint for order details: ${endpoint} (Order ID: ${orderId})`);

    while (retries < maxRetries) {
      try {
        // Add a cache-busting parameter to prevent caching issues
        const timestamp = new Date().getTime();
        const response = await api.get(
          `${endpoint}?_nocache=${timestamp}`,
          {
            // Ensure consistent headers regardless of screen size
            headers: {
              'X-Requested-With': 'XMLHttpRequest',
              'Accept': 'application/json'
            }
          }
        );
        return response.data;
      } catch (error) {
        lastError = error;
        console.error(`Error fetching order ${orderId} (attempt ${retries + 1}/${maxRetries}):`, error);
        retries++;
        if (retries < maxRetries) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, retries)));
        }
      }
    }
    throw lastError;
  },

  // Get order items by order ID with retry logic
  getOrderItems: async (orderId: string, orderDate?: string, forceLoad: boolean = false): Promise<OrderDetail[]> => {
    // Check if the order date is provided and if it's older than 7 days
    // Only apply this optimization if forceLoad is false (for bulk operations)
    if (orderDate && !forceLoad) {
      const orderDateObj = new Date(orderDate);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      // If the order is older than 7 days, don't fetch the items
      if (orderDateObj < sevenDaysAgo) {
        console.log(`Order ${orderId} is older than 7 days (${orderDate}), skipping items fetch to reduce API load`);
        return [];
      }
    }
    
    const maxRetries = 2;
    let retries = 0;
    let lastError;

    // Use the original order ID directly without conversion
    const endpoint = `/b2bclients/orders/${orderId}/items`;
    
    console.log(`Using endpoint for order items: ${endpoint} (Order ID: ${orderId})`);

    while (retries < maxRetries) {
      try {
        // Add a cache-busting parameter to prevent caching issues
        const timestamp = new Date().getTime();
        const response = await api.get(
          `${endpoint}?_nocache=${timestamp}`,
          {
            // Ensure consistent headers regardless of screen size
            headers: {
              'X-Requested-With': 'XMLHttpRequest',
              'Accept': 'application/json'
            }
          }
        );
        
        // Check if response.data is an array and has items
        if (Array.isArray(response.data) && response.data.length > 0) {
          console.log(`Successfully fetched ${response.data.length} items for order ${orderId}`);
          return response.data;
        } else {
          console.warn(`API returned empty or invalid items array for order ${orderId}`);
          // Return actual data from the API or an empty array
          return Array.isArray(response.data) ? response.data : [];
        }
      } catch (error) {
        lastError = error;
        console.error(`Error fetching items for order ${orderId} (attempt ${retries + 1}/${maxRetries}):`, error);
        retries++;
        if (retries < maxRetries) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, retries)));
        }
      }
    }
    
    console.error(`All attempts to fetch order items failed for order ${orderId}`);
    // Return an empty array instead of mock data
    return [];
  },

  // Edit order items
  editOrder: async (orderId: string, orderItems: OrderItem[]): Promise<{ message: string; order_id: string }> => {
    try {
      console.log(`Editing order ${orderId} with items:`, orderItems);
      
      const requestPayload = {
        order_items: orderItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity
        }))
      };

      const response = await api.put(`/b2bclients/orders/${orderId}/edit`, requestPayload);
      console.log('Order edit response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error editing order:', error);
      throw error;
    }
  },

  // Cancel order
  cancelOrder: async (orderId: string): Promise<{ message: string; order_id: string }> => {
    try {
      console.log(`Cancelling order ${orderId}`);
      
      const requestPayload = {
        status: "cancelled"
      };

      const response = await api.put(`/b2bclients/orders/${orderId}/edit`, requestPayload);
      console.log('Order cancel response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  },

  // Download order summary with retry logic
  downloadOrderSummary: async (orderId: string, orderNumber?: string): Promise<Blob> => {
    const maxRetries = 2;
    let retries = 0;
    let lastError;

    // Use the original order ID directly without conversion
    // Log the order ID we're using for download
    console.log(`Attempting to download summary for order ID: ${orderId}`);

    while (retries < maxRetries) {
      try {
        // Add a cache-busting parameter to prevent caching issues
        const timestamp = new Date().getTime();
        const response = await api.get(
          `/b2bclients/orders/${orderId}/download_summary?_t=${timestamp}`, 
          { 
            responseType: 'blob',
            // Ensure consistent headers
            headers: {
              'X-Requested-With': 'XMLHttpRequest',
              'Accept': 'application/pdf'
            }
          }
        );
        
        // Verify we got a valid blob response
        if (response.data instanceof Blob && response.data.size > 0) {
          console.log(`Successfully downloaded order summary for ${orderId}, size: ${response.data.size} bytes`);
          return response.data;
        } else {
          throw new Error('Received empty or invalid PDF data');
        }
      } catch (error) {
        lastError = error;
        console.error(`Error downloading summary for order ${orderId} (attempt ${retries + 1}/${maxRetries}):`, error);
        
        // Log more detailed error information
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response headers:', error.response.headers);
        } else if (error.request) {
          console.error('Request made but no response received:', error.request);
        } else {
          console.error('Error message:', error.message);
        }
        
        retries++;
        if (retries < maxRetries) {
          // Wait before retrying (exponential backoff)
          const delay = 500 * Math.pow(2, retries);
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError;
  },

  // Download order invoice
  downloadOrderInvoice: async (orderId: string, orderNumber?: string): Promise<Blob> => {
    const maxRetries = 2;
    let retries = 0;
    let lastError;

    console.log(`Attempting to download invoice for order ID: ${orderId}`);

    while (retries < maxRetries) {
      try {
        const timestamp = new Date().getTime();
        const response = await api.get(
          `/b2bclients/invoices/${orderId}/download_invoice?_t=${timestamp}`, 
          { 
            responseType: 'blob',
            headers: {
              'X-Requested-With': 'XMLHttpRequest',
              'Accept': 'application/pdf'
            }
          }
        );
        
        if (response.data instanceof Blob && response.data.size > 0) {
          console.log(`Successfully downloaded order invoice for ${orderId}, size: ${response.data.size} bytes`);
          return response.data;
        } else {
          throw new Error('Received empty or invalid invoice PDF data');
        }
      } catch (error) {
        lastError = error;
        console.error(`Error downloading invoice for order ${orderId} (attempt ${retries + 1}/${maxRetries}):`, error);
        
        retries++;
        if (retries < maxRetries) {
          const delay = 500 * Math.pow(2, retries);
          console.log(`Retrying invoice download in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError;
  },

  // Download delivery challan (D.C.)
  downloadDeliveryChallan: async (orderId: string, orderNumber?: string): Promise<Blob> => {
    const maxRetries = 2;
    let retries = 0;
    let lastError;

    console.log(`Attempting to download D.C. for order ID: ${orderId}`);

    while (retries < maxRetries) {
      try {
        // Use the new b2bclients download D.C endpoint - much simpler!
        const response = await api.get(
          `/b2bclients/orders/${orderId}/download_dc`,
          { 
            responseType: 'blob',
            headers: {
              'Accept': 'application/pdf'
            }
          }
        );
        
        if (response.data instanceof Blob && response.data.size > 0) {
          console.log(`Successfully downloaded D.C. for ${orderId}, size: ${response.data.size} bytes`);
          return response.data;
        } else {
          throw new Error('Received empty or invalid D.C. PDF data');
        }
      } catch (error) {
        lastError = error;
        console.error(`Error downloading D.C. for order ${orderId} (attempt ${retries + 1}/${maxRetries}):`, error);
        
        retries++;
        if (retries < maxRetries) {
          const delay = 1000 * retries; // 1s, 2s delays
          console.log(`Retrying D.C. download in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError;
  }
};

export default orderApi;
