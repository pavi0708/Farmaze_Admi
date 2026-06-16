import axios from 'axios';
import { ANLYTICS_BASE_URL } from './url_config';

// Get the Analytics API URL from environment variables or use localhost for development
const ANALYTICS_API_URL = import.meta.env.VITE_ANALYTICS_API_URL || ANLYTICS_BASE_URL;

console.log('Using Analytics API URL:', ANALYTICS_API_URL);

// Create a shared axios instance for all analytics API calls
export const analyticsAxios = axios.create({
  baseURL: ANALYTICS_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
  withCredentials: false, // Set to true if you need to send cookies
});

// Add a request interceptor to include auth token in requests
analyticsAxios.interceptors.request.use(
  (config) => {
    // Get token from localStorage (adjust the key name as needed)
    const token = localStorage.getItem('farmaze_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`Analytics API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      baseURL: config.baseURL,
      params: config.params,
      headers: config.headers
    });
    
    return config;
  },
  (error) => {
    console.error('Analytics API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle responses and errors
analyticsAxios.interceptors.response.use(
  (response) => {
    console.log(`Analytics API Response Success: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error(`Analytics API Response Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      console.warn('Analytics API: Unauthorized - token may be expired');
      // Optionally redirect to login or refresh token
    }
    
    return Promise.reject(error);
  }
);

export default analyticsAxios;
