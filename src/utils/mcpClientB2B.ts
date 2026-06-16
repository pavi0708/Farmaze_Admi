/**
 * @deprecated Phase G — This MCP WebSocket client is mostly replaced by
 * farmaze-agent HTTP calls (agentAxios / agentApi).
 * Still used by: useInstantOrder.ts (smart order matching).
 * TODO: Wire useInstantOrder.ts to agent /chat endpoint, then delete this file.
 */
import { supabase } from '@/integrations/supabase/client';
import { authApi } from '@/api/authApi';

export interface MCPCredentials {
  mcpClientBaseUrl: string;
  mcpApiKey: string;
}

export class MCPClientB2B {
  private ws: WebSocket | null = null;
  private requestId = 0;
  private pendingRequests = new Map<number, { resolve: Function, reject: Function }>();
  private credentials: MCPCredentials | null = null;
  private refreshAttempts = 0;
  private maxRefreshAttempts = 2;
  private lastRefreshTime = 0;
  private connectionRetries = 0;
  private maxConnectionRetries = 3;

  // Get MCP credentials from Supabase edge function
  private async getCredentials(): Promise<MCPCredentials> {
    if (this.credentials) {
      return this.credentials;
    }

    try {
      console.log('🔑 Fetching client credentials...');
      const { data, error } = await supabase.functions.invoke('get-client-credentials');
      
      if (error) {
        console.error('❌ Supabase function error:', error);
        throw new Error(`Failed to get client credentials: ${error.message}`);
      }

      console.log('📦 Received credentials data:', {
        hasBaseUrl: !!data?.mcpClientBaseUrl,
        hasApiKey: !!data?.mcpApiKey,
        hasOpenAIKey: !!data?.openAIKey,
        hasAnthropicKey: !!data?.anthropicApiKey,
        success: data?.success
      });

      if (!data) {
        throw new Error('No data received from credentials function');
      }

      if (!data.success) {
        throw new Error(data.error || 'Credentials function returned failure status');
      }

      if (!data.mcpClientBaseUrl || !data.mcpApiKey) {
        console.error('❌ Missing required credentials:', {
          mcpClientBaseUrl: data.mcpClientBaseUrl,
          mcpApiKey: data.mcpApiKey ? 'PRESENT' : 'MISSING'
        });
        throw new Error('Invalid MCP credentials received - missing required fields');
      }

      this.credentials = {
        mcpClientBaseUrl: data.mcpClientBaseUrl,
        mcpApiKey: data.mcpApiKey
      };

      console.log('✅ Successfully cached MCP credentials');
      return this.credentials;
    } catch (error) {
      console.error('💥 Error getting MCP credentials:', error);
      throw error;
    }
  }

  // Check if token is expired and refresh if needed
  private async validateAndRefreshToken(): Promise<string | null> {
    const farmaze_token = localStorage.getItem('farmaze_token');
    
    if (!farmaze_token) {
      console.warn('⚠️ No farmaze_token found');
      return null;
    }

    try {
      // Decode JWT payload to check expiration
      const payload = JSON.parse(atob(farmaze_token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      const expDiff = payload.exp ? (payload.exp - currentTime) : null;
      
      console.log('🔍 B2B Token validation:', {
        client_id: payload.client_id || payload.sub,
        email: payload.email,
        role: payload.role,
        current_time: currentTime,
        token_exp: payload.exp,
        exp_diff_seconds: expDiff,
        is_expired: expDiff <= 60 // Consider expired if less than 1 minute left
      });
      
      // If token expires in less than 1 minute, refresh it
      if (expDiff && expDiff <= 60) {
        console.log('🔄 B2B Token expiring soon, attempting refresh...');
        
        const newToken = await authApi.refreshToken();
        if (newToken) {
          console.log('✅ B2B Token refreshed successfully');
          return newToken;
        } else {
          console.error('❌ B2B Token refresh failed');
          return null;
        }
      }
      
      console.log('✅ B2B Token is valid');
      return farmaze_token;
    } catch (error) {
      console.error('❌ B2B Token validation failed:', error);
      // Try to refresh the token anyway
      try {
        const newToken = await authApi.refreshToken();
        if (newToken) {
          console.log('✅ B2B Token refreshed after validation error');
          return newToken;
        }
      } catch (refreshError) {
        console.error('❌ B2B Token refresh also failed:', refreshError);
      }
      return null;
    }
  }

  async connect(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      try {
        // Validate and refresh token if needed
        const validToken = await this.validateAndRefreshToken();
        
        if (!validToken) {
          throw new Error('No valid client authentication token available');
        }
        
        console.log('🔑 B2B Client connecting with validated token');
        
        const credentials = await this.getCredentials();
        
        console.log('🌐 Connecting to MCP server (B2B Client):', credentials.mcpClientBaseUrl);
        
        // Convert https to wss for WebSocket connection
        const wsUrl = credentials.mcpClientBaseUrl.replace('https://', 'wss://').replace('http://', 'ws://');
        
        // Use validated token for B2B authentication
        const urlWithAuth = `${wsUrl}?token=${validToken}&client_type=client`;
        
        console.log('🔗 B2B WebSocket URL:');
        console.log('  - Base URL:', wsUrl);
        console.log('  - Client Type: B2B');
        
        this.ws = new WebSocket(urlWithAuth);
        
        this.ws.onopen = () => {
          console.log('✅ Connected to MCP server as B2B client');
          this.connectionRetries = 0; // Reset retry counter on successful connection
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const response = JSON.parse(event.data);
            console.log('📨 MCP B2B response:', response);
            
            if (response.id && this.pendingRequests.has(response.id)) {
              const { resolve } = this.pendingRequests.get(response.id)!;
              this.pendingRequests.delete(response.id);
              resolve(response.result || response);
            }
          } catch (error) {
            console.error('Error parsing MCP B2B response:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ MCP B2B WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log('🔌 MCP B2B connection closed:', event.code, event.reason);
          if (event.code !== 1000 && this.connectionRetries < this.maxConnectionRetries) {
            console.log(`🔄 B2B reconnection attempt (${this.connectionRetries + 1}/${this.maxConnectionRetries})`);
            this.connectionRetries++;
            setTimeout(() => this.connect().then(resolve).catch(reject), 1000 * this.connectionRetries);
          }
        };
        
      } catch (error) {
        console.error('Error connecting to MCP server (B2B):', error);
        reject(error);
      }
    });
  }

  async request(method: string, params: any): Promise<any> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      // If MCP is not connected, provide fallback responses for basic functionality
      console.warn('⚠️ MCP B2B client not connected, using fallback functionality');
      return this.handleFallbackRequest(method, params);
    }

    return new Promise(async (resolve, reject) => {
      const id = ++this.requestId;
      
      this.pendingRequests.set(id, { resolve, reject });

      // Get current valid token for the request
      const currentToken = await this.validateAndRefreshToken();
      if (!currentToken) {
        reject(new Error('No valid authentication token available'));
        return;
      }

      const message = {
        jsonrpc: "2.0",
        id,
        method,
        params,
        // Include authentication in the request
        meta: {
          authorization: `Bearer ${currentToken}`,
          client_type: 'client'
        }
      };

      console.log('📤 Sending MCP B2B request:', message);
      this.ws!.send(JSON.stringify(message));

      // Timeout after 30 seconds
      const timeout = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('MCP B2B request timeout'));
        }
      }, 30000);

      // Store timeout reference for cleanup
      this.pendingRequests.set(id, { 
        resolve: (result: any) => {
          clearTimeout(timeout);
          // Handle auth errors for B2B clients
          if (result?.error?.code === 401 || result?.error?.message?.includes('auth') || result?.error?.message?.includes('unauthorized')) {
            console.log('🔄 B2B Auth error detected:', result?.error?.message || 'Unknown auth error');
            console.log('🔍 Current token info:', {
              hasToken: !!localStorage.getItem('farmaze_token'),
              hasRefreshToken: !!localStorage.getItem('farmaze_refresh_token'),
              tokenLength: localStorage.getItem('farmaze_token')?.length || 0,
              refreshAttempts: this.refreshAttempts
            });
            
            const now = Date.now();
            if (now - this.lastRefreshTime > 300000) {
              this.refreshAttempts = 0;
            }
            
            if (this.refreshAttempts >= this.maxRefreshAttempts) {
              console.error('❌ Maximum B2B refresh attempts reached. Please login again.');
              reject(new Error('Authentication failed: Please logout and login again.'));
              return;
            }
            
            this.refreshAttempts++;
            this.lastRefreshTime = now;
            
            // Attempt token refresh before giving up
            console.log('🔄 Attempting B2B token refresh...');
            authApi.refreshToken().then(newToken => {
              if (newToken) {
                console.log('✅ B2B token refreshed successfully, reconnecting and retrying request...');
                // Force reconnection with new token
                this.disconnect();
                setTimeout(() => {
                  this.connect().then(() => {
                    console.log('🔄 Retrying original request after reconnection...');
                    this.request(method, params).then(resolve).catch(reject);
                  }).catch(connectError => {
                    console.error('❌ Failed to reconnect after token refresh:', connectError);
                    reject(new Error('Connection failed after token refresh. Please login again.'));
                  });
                }, 1000);
              } else {
                console.error('❌ B2B token refresh failed - no new token received');
                reject(new Error('Session expired: Please login again to continue.'));
              }
            }).catch(refreshError => {
              console.error('❌ B2B token refresh error:', refreshError);
              reject(new Error('Session expired: Please login again to continue.'));
            });
            return;
          }
          resolve(result);
        },
        reject: (error: any) => {
          clearTimeout(timeout);
          reject(error);
        } 
      });
    });
  }

  // B2B Client-specific helper methods
  async browseProducts(query?: string, category?: string, page: number = 1, limit: number = 10) {
    return this.request('tools/call', {
      name: 'browse_products',
      arguments: { query, category, page, limit }
    });
  }

  async getProductDetails(productId: string) {
    return this.request('tools/call', {
      name: 'get_product_details',
      arguments: { product_id: productId }
    });
  }

  async getMyOrders(status?: string, page: number = 1, limit: number = 10, start_date?: string, end_date?: string, query?: string) {
    const arguments_obj: any = {};
    
    // PRIORITY: Use query parameter for natural language dates
    if (query) {
      arguments_obj.query = query;
      console.log('✅ Using natural language query for orders:', query);
    } else if (start_date || end_date) {
      // Only use explicit dates if no query provided
      if (start_date) arguments_obj.start_date = start_date;
      if (end_date) arguments_obj.end_date = end_date;
      console.log('⚠️ Using explicit dates for orders:', { start_date, end_date });
    }
    
    // Always include pagination and status
    if (status) arguments_obj.status = status;
    if (page) arguments_obj.page = page;
    if (limit) arguments_obj.limit = limit;
    
    return this.request('tools/call', {
      name: 'get_my_orders',
      arguments: arguments_obj
    });
  }

  async getOrderAnalytics(startDate?: string, endDate?: string, productFilter?: string, productIds?: string, category?: string, query?: string) {
    const arguments_obj: any = {};
    
    // PRIORITY: Use query parameter for natural language dates
    if (query) {
      arguments_obj.query = query;
      console.log('✅ Using natural language query for analytics:', query);
    } else if (startDate || endDate) {
      // Only use explicit dates if no query provided
      if (startDate) arguments_obj.start_date = startDate;
      if (endDate) arguments_obj.end_date = endDate;
      console.log('⚠️ Using explicit dates for analytics:', { startDate, endDate });
    }
    
    // Include optional parameters if provided
    if (productFilter) arguments_obj.product_filter = productFilter;
    if (productIds) arguments_obj.product_ids = productIds;
    if (category) arguments_obj.category = category;
    
    return this.request('tools/call', {
      name: 'get_order_analytics',
      arguments: arguments_obj
    });
  }

  async getOrderDetails(orderId: string) {
    return this.request('tools/call', {
      name: 'get_order_details',
      arguments: { order_id: orderId }
    });
  }

  async createProductInquiry(productIds: string[], message: string, contactInfo?: any) {
    return this.request('tools/call', {
      name: 'create_inquiry',
      arguments: { 
        product_ids: productIds, 
        message, 
        contact_info: contactInfo 
      }
    });
  }

  async getMyProfile() {
    return this.request('tools/call', {
      name: 'get_my_profile',
      arguments: {}
    });
  }

  async searchProductsByCategory(categoryId: string, page: number = 1, limit: number = 10) {
    return this.request('tools/call', {
      name: 'search_by_category',
      arguments: { category_id: categoryId, page, limit }
    });
  }

  async getProductCategories() {
    return this.request('tools/call', {
      name: 'get_categories',
      arguments: {}
    });
  }

  async createSmartOrder(productList: string, deliveryDate?: string, notes?: string) {
    return this.request('tools/call', {
      name: 'create_order_for_client',
      arguments: { 
        product_list: productList,
        delivery_date: deliveryDate,
        notes: notes
      }
    });
  }

  async createOrderForClient(productList: string, deliveryDate?: string, notes?: string) {
    return this.request('tools/call', {
      name: 'create_order_for_client',
      arguments: { 
        product_list: productList,
        delivery_date: deliveryDate,
        notes: notes
      }
    });
  }

  async getMyInvoices(status?: string, page: number = 1, limit: number = 10, start_date?: string, end_date?: string, query?: string) {
    const arguments_obj: any = {};
    
    // PRIORITY: Use query parameter for natural language dates
    if (query) {
      arguments_obj.query = query;
      console.log('✅ Using natural language query for invoices:', query);
    } else if (start_date || end_date) {
      // Only use explicit dates if no query provided
      if (start_date) arguments_obj.start_date = start_date;
      if (end_date) arguments_obj.end_date = end_date;
      console.log('⚠️ Using explicit dates for invoices:', { start_date, end_date });
    }
    
    // Handle status - default to "approved" if not specified or if "all" is passed
    const validStatuses = ['pending', 'approved', 'paid'];
    if (status && status !== 'all' && validStatuses.includes(status)) {
      arguments_obj.status = status;
    } else {
      // Default to "approved" for most common use case
      arguments_obj.status = 'approved';
      console.log('📋 Using default status "approved" for invoices');
    }
    
    // Always include pagination
    if (page) arguments_obj.page = page;
    if (limit) arguments_obj.limit = limit;
    
    return this.request('tools/call', {
      name: 'get_my_invoices',
      arguments: arguments_obj
    });
  }


  // Handle requests when MCP is not available - provide basic fallback functionality
  private async handleFallbackRequest(method: string, params: any): Promise<any> {
    console.log('🔄 Handling B2B fallback request:', method, params);
    
    if (method === 'tools/call') {
      const toolName = params.name;
      
      switch (toolName) {
        case 'browse_products':
          return {
            products: [],
            message: 'MCP connection not available. Please use the main product search.'
          };
        
        case 'get_my_orders':
          return {
            orders: [],
            message: 'MCP connection not available. Please check the Orders page.'
          };
          
        case 'get_my_invoices':
          return {
            invoices: [],
            message: 'MCP connection not available. Please check the Invoices page.'
          };

        case 'get_order_analytics':
          return {
            products: [],
            message: 'MCP connection not available. Please check the Analytics page for order insights.'
          };

        case 'create_order_for_client':
        case 'create_smart_order':
          // Return error in a way the instant ordering hook can detect
          return {
            error: 'AI matching is connecting... Using local matching instead.',
            message: 'MCP connection not available, falling back to local matching.'
          };
          
        default:
          return {
            error: 'Feature not available without MCP connection',
            message: 'Please log in to access advanced AI features.'
          };
      }
    }
    
    return {
      error: 'MCP not connected',
      message: 'Advanced AI features require authentication.'
    };
  }

  // Refresh token and reconnect
  private async refreshTokenAndReconnect(): Promise<void> {
    console.log('🔄 Refreshing token and reconnecting B2B MCP client');
    
    try {
      // Attempt to refresh the token
      const newToken = await authApi.refreshToken();
      
      if (!newToken) {
        throw new Error('B2B Token refresh failed - no new token received');
      }
      
      console.log('✅ B2B Token refreshed, reconnecting...');
      
      // Disconnect old connection
      this.disconnect();
      
      // Wait a bit before reconnecting
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reconnect with fresh token
      await this.connect();
    } catch (error) {
      console.error('❌ B2B Token refresh failed:', error);
      this.disconnect();
      throw error;
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.pendingRequests.clear();
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance for B2B clients
let mcpClientB2BInstance: MCPClientB2B | null = null;

export const getMCPClientB2B = (): MCPClientB2B => {
  if (!mcpClientB2BInstance) {
    mcpClientB2BInstance = new MCPClientB2B();
  }
  return mcpClientB2BInstance;
};
