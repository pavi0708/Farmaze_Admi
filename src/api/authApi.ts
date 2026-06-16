
import axios from 'axios';
import { API__BASE_URL } from './url_config';
import { setupApiInterceptors } from './apiInterceptors';
// In dev: API__BASE_URL is '' → uses Vite proxy (/api → staging-api.farmaze.com)
// In prod: API__BASE_URL is the full production/staging URL
const API_URL = API__BASE_URL;

const isProduction = window.location.protocol === 'https:';
const isAPIonHTTP = API_URL.startsWith('http:');

const API_BASE_URL = import.meta.env.DEV
  ? '/api/v1'                          // dev: go through Vite proxy
  : (isProduction && isAPIonHTTP)
    ? '/api/v1'                        // prod HTTPS→HTTP: relative URL
    : `${API_URL}/api/v1`;             // prod: full URL

console.log('Using API base URL for auth:', API_BASE_URL);

// Create an axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout and error handling
  timeout: 10000, // 10 seconds
});

// Token key constant to ensure consistency
const TOKEN_KEY = 'farmaze_token';

// Add a request interceptor to include auth token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Setup API interceptors for token refresh
setupApiInterceptors(api);

// Types
export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

// Auth API functions
export const authApi = {
  login: async (usernameOrEmail: string, password: string) => {
    try {
      console.log('🔐 Attempting login...', {
        endpoint: `${API_BASE_URL}/auth/login`,
        email: usernameOrEmail,
        timestamp: new Date().toISOString()
      });
      
      const response = await api.post('/auth/login', { username: usernameOrEmail, password });
      
      console.log('✅ Login successful:', {
        status: response.status,
        data: response.data,
        headers: response.headers,
        timestamp: new Date().toISOString()
      });
      
      // Store both tokens in localStorage
      if (response.data.token) {
        localStorage.setItem(TOKEN_KEY, response.data.token);
        console.log('🔑 Access token stored');
      }
      if (response.data.refresh_token) {
        localStorage.setItem('farmaze_refresh_token', response.data.refresh_token);
        console.log('🔄 Refresh token stored');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Login failed:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL
        },
        code: error.code,
        timestamp: new Date().toISOString(),
        fullError: error
      });
      
      // Log specific error types
      if (error.code === 'ECONNABORTED') {
        console.error('🕐 Login request timed out');
      } else if (error.code === 'ERR_NETWORK') {
        console.error('🌐 Network error during login');
      } else if (error.response?.status === 401) {
        console.error('🔐 Invalid credentials provided');
      } else if (error.response?.status >= 500) {
        console.error('🚨 Server error during login');
      }
      
      throw error;
    }
  },
  
  loginWithGoogle: async () => {
    // Redirect to Google OAuth flow
    window.location.href = `${API_BASE_URL}/auth/legacy/google`;
    // The backend will handle the OAuth flow and redirect back
    return null;
  },
  
  signUp: async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/signup', { email, password });
      console.log('Signup response:', response.data);
      
      // Store both tokens in localStorage if they exist in the response
      if (response.data.token) {
        localStorage.setItem(TOKEN_KEY, response.data.token);
      }
      if (response.data.refresh_token) {
        localStorage.setItem('farmaze_refresh_token', response.data.refresh_token);
      }
      
      return response.data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  },
  
  requestOtp: async (phone: string) => {
    const response = await api.post('/auth/otp/request', { phone });
    return response.data;
  },
  
  verifyOtp: async (phone: string, otp: string) => {
    try {
      const response = await api.post('/auth/otp/verify', { phone, otp });
      console.log('OTP verification response:', response.data);
      
      // Store both tokens in localStorage if they exist in the response
      if (response.data.token) {
        localStorage.setItem(TOKEN_KEY, response.data.token);
      }
      if (response.data.refresh_token) {
        localStorage.setItem('farmaze_refresh_token', response.data.refresh_token);
      }
      
      return response.data;
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
    }
  },
  
  logout: async () => {
    try {
      const response = await api.post('/auth/logout');
      // Clear all tokens and user data from localStorage
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('farmaze_refresh_token');
      localStorage.removeItem('farmaze_user');
      return response.data;
    } catch (error) {
      console.error('Logout error:', error);
      // Even if the API call fails, still remove all tokens from localStorage
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('farmaze_refresh_token');
      localStorage.removeItem('farmaze_user');
      return { success: true }; // Return success even if API fails, as we've cleared local storage
    }
  },
  
  // Refresh access token using refresh token
  refreshToken: async (): Promise<string | null> => {
    try {
      const refreshToken = localStorage.getItem('farmaze_refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post<RefreshTokenResponse>('/auth/refresh', {
        refresh_token: refreshToken
      });

      const newAccessToken = response.data.access_token;
      const newRefreshToken = response.data.refresh_token;
      
      if (newAccessToken) {
        localStorage.setItem(TOKEN_KEY, newAccessToken);
        console.log('🔑 New access token stored');
      }
      
      if (newRefreshToken) {
        localStorage.setItem('farmaze_refresh_token', newRefreshToken);
        console.log('🔄 New refresh token stored');
      }
      
      return newAccessToken || null;
    } catch (error: any) {
      console.error('Token refresh failed:', error);
      // If refresh fails, clear tokens
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('farmaze_refresh_token');
      localStorage.removeItem('farmaze_user');
      return null;
    }
  },

  getCurrentUser: async () => {
    try {
      // Check if we have a token first
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        console.log('No token found, user is not authenticated');
        return null;
      }
      
      // Since we're already using the API_BASE_URL in the api instance, we don't need to include '/api/v1' here
      const response = await api.get('/auth/me');
      console.log('Current user response:', response.data);
      return response.data.data?.user || response.data.user || null;
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        console.log('Token is invalid or expired, clearing local storage');
        // Clear invalid token
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem('farmaze_user');
        localStorage.removeItem('farmaze_refresh_token');
      }
      console.error('Error fetching current user:', error);
      return null;
    }
  },

  // Forgot password - send reset email
  forgotPassword: async (email: string) => {
    try {
      console.log('🔐 Requesting password reset for:', email);
      const response = await api.post('/auth/forgot-password', { email });
      console.log('✅ Forgot password request successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Forgot password request failed:', error);
      throw error;
    }
  },

  // Reset password with token
  resetPassword: async (token: string, newPassword: string) => {
    try {
      console.log('🔐 Resetting password with token');
      const response = await api.post('/auth/reset-password', { 
        token, 
        new_password: newPassword 
      });
      console.log('✅ Password reset successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Password reset failed:', error);
      throw error;
    }
  }
};

// ── Shared Conversations API ─────────────────────────────────────────

export interface ShareConversationRequest {
  title: string;
  messages: unknown[];
  agent_type: 'insights' | 'procurement';
}

export interface ShareConversationResponse {
  share_token: string;
  share_url: string;
}

export interface SharedConversationItem {
  id: string;
  share_token: string;
  title: string;
  agent_type: string;
  created_at: string;
  expires_at: string | null;
}

export const sharedConversationsApi = {
  share: (data: ShareConversationRequest) =>
    api.post<ShareConversationResponse>('/b2bclients/conversations/share', data),

  getByToken: (token: string) =>
    api.get(`/b2bclients/conversations/shared/view/${token}`),

  list: () =>
    api.get<{ conversations: SharedConversationItem[] }>('/b2bclients/conversations/shared'),

  delete: (id: string) =>
    api.delete(`/b2bclients/conversations/shared/${id}`),
};

export default api;
