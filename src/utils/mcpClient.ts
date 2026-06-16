/**
 * @deprecated Phase G — This MCP WebSocket client is no longer used.
 * Dashboard now calls farmaze-agent via HTTP (agentAxios / agentApi).
 * Kept for reference only. Safe to delete once useInstantOrder.ts is
 * migrated to the agent endpoint.
 */
// MCP Client for Freshflow Dashboard
// Adapted from design-haven-farmaze MCP integration

import { authApi } from '@/api/authApi';
import { supabase } from '@/integrations/supabase/client';

export interface MCPCredentials {
  mcpClientBaseUrl: string;
  mcpApiKey: string;
}

export class MCPClient {
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
      const { data, error } = await supabase.functions.invoke('get-mcp-credentials');
      
      if (error) {
        throw new Error(`Failed to get MCP credentials: ${error.message}`);
      }

      if (!data.mcpClientBaseUrl || !data.mcpApiKey) {
        throw new Error('Invalid MCP credentials received');
      }

      this.credentials = {
        mcpClientBaseUrl: data.mcpClientBaseUrl,
        mcpApiKey: data.mcpApiKey
      };

      return this.credentials;
    } catch (error) {
      console.error('Error getting MCP credentials:', error);
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
      
      console.log('🔍 Token validation:', {
        current_time: currentTime,
        token_exp: payload.exp,
        exp_diff_seconds: expDiff,
        is_expired: expDiff <= 60 // Consider expired if less than 1 minute left
      });
      
      // If token expires in less than 1 minute, refresh it
      if (expDiff && expDiff <= 60) {
        console.log('🔄 Token expiring soon, attempting refresh...');
        
        const newToken = await authApi.refreshToken();
        if (newToken) {
          console.log('✅ Token refreshed successfully');
          return newToken;
        } else {
          console.error('❌ Token refresh failed');
          return null;
        }
      }
      
      console.log('✅ Token is valid');
      return farmaze_token;
    } catch (error) {
      console.error('❌ Token validation failed:', error);
      // Try to refresh the token anyway
      try {
        const newToken = await authApi.refreshToken();
        if (newToken) {
          console.log('✅ Token refreshed after validation error');
          return newToken;
        }
      } catch (refreshError) {
        console.error('❌ Token refresh also failed:', refreshError);
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
          console.warn('⚠️ No valid token available - MCP will work in limited mode');
          // Instead of throwing, resolve with limited functionality
          resolve();
          return;
        }
        
        console.log('🔑 Farmaze MCP Client connecting with validated token');
        
        const credentials = await this.getCredentials();
        
        console.log('🌐 Connecting to MCP server:', credentials.mcpClientBaseUrl);
        
        // Convert https to wss for WebSocket connection
        const wsUrl = credentials.mcpClientBaseUrl.replace('https://', 'wss://').replace('http://', 'ws://');
        
        // Use validated token for authentication
        const urlWithAuth = `${wsUrl}?token=${validToken}`;
        
        this.ws = new WebSocket(urlWithAuth);
        
        this.ws.onopen = () => {
          console.log('✅ Connected to Freshflow MCP server');
          this.connectionRetries = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const response = JSON.parse(event.data);
            console.log('📨 MCP response:', response);
            
            if (response.id && this.pendingRequests.has(response.id)) {
              const { resolve } = this.pendingRequests.get(response.id)!;
              this.pendingRequests.delete(response.id);
              resolve(response.result || response);
            }
          } catch (error) {
            console.error('Error parsing MCP response:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ Freshflow MCP WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log('🔌 Freshflow MCP connection closed:', event.code, event.reason);
          if (event.code !== 1000 && this.connectionRetries < this.maxConnectionRetries) {
            console.log(`🔄 Attempting reconnection (${this.connectionRetries + 1}/${this.maxConnectionRetries})`);
            this.connectionRetries++;
            setTimeout(() => this.connect().then(resolve).catch(reject), 1000 * this.connectionRetries);
          }
        };
        
      } catch (error) {
        console.error('Error connecting to Freshflow MCP server:', error);
        reject(error);
      }
    });
  }

  async request(method: string, params: any): Promise<any> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      // If MCP is not connected, provide mock responses for basic functionality
      console.warn('⚠️ MCP not connected, using fallback functionality');
      return this.handleFallbackRequest(method, params);
    }

    return new Promise((resolve, reject) => {
      const id = ++this.requestId;
      
      this.pendingRequests.set(id, { resolve, reject });

      const message = {
        jsonrpc: "2.0",
        id,
        method,
        params
      };

      console.log('📤 Sending Freshflow MCP request:', message);
      this.ws!.send(JSON.stringify(message));

      // Timeout after 30 seconds
      const timeout = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('MCP request timeout'));
        }
      }, 30000);

      // Store timeout reference for cleanup
      this.pendingRequests.set(id, { 
        resolve: (result: any) => {
          clearTimeout(timeout);
          
          // Check for auth errors and attempt reconnection
          if (result?.error?.code === 401 || result?.error?.message?.includes('auth')) {
            console.log('🔄 Auth error detected, attempting reconnection');
            this.refreshTokenAndReconnect().then(() => {
              this.request(method, params).then(resolve).catch(reject);
            }).catch(reject);
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

  // Handle requests when MCP is not available - provide basic fallback functionality
  private async handleFallbackRequest(method: string, params: any): Promise<any> {
    console.log('🔄 Handling fallback request:', method, params);
    
    if (method === 'tools/call') {
      const toolName = params.name;
      
      switch (toolName) {
        case 'search_products':
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
    console.log('🔄 Refreshing token and reconnecting Freshflow MCP client');
    
    try {
      // Attempt to refresh the token
      const newToken = await authApi.refreshToken();
      
      if (!newToken) {
        throw new Error('Token refresh failed - no new token received');
      }
      
      console.log('✅ Token refreshed, reconnecting...');
      
      // Disconnect old connection
      this.disconnect();
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reconnect with new token
      await this.connect();
    } catch (error) {
      console.error('❌ Freshflow token refresh failed:', error);
      this.disconnect();
      throw error;
    }
  }

  // No tool methods here - use mcpClientB2B.ts for all MCP tools

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

// Singleton instance for the app
let mcpClientInstance: MCPClient | null = null;

export const getMCPClient = (): MCPClient => {
  if (!mcpClientInstance) {
    mcpClientInstance = new MCPClient();
  }
  return mcpClientInstance;
};
