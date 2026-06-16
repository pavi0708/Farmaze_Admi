import axios from 'axios';
import { API__BASE_URL } from './url_config';

// Determine if we're in a development or production environment
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';

// Set the API URL based on the environment
let API_URL;
if (isDevelopment) {
  // For local development, use localhost
  API_URL = import.meta.env.VITE_API_URL || API__BASE_URL;
  // API_URL = 'https://api.farmaze.com';

  console.log('Using development API URL:', API_URL);
} else {
  // For production, always use the api.farmaze.com domain with HTTPS
  API_URL = 'https://api.farmaze.com';
  console.log('Using production API URL:', API_URL);
}

// Set the base URL for API requests
let API_BASE_URL = `${API_URL}/api/v1`;

// Log the final API base URL for debugging

console.log('Using API base URL:', API_BASE_URL);

// Create an axios instance for public API requests (no auth required)
const publicApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout and error handling
  timeout: 10000, // 10 seconds
});

export default publicApi;
