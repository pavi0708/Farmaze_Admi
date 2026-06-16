import { authApi } from './authApi';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// Set up token refresh interceptor
const setupTokenRefreshInterceptor = (axiosInstance: any) => {
  axiosInstance.interceptors.response.use(
    (response: any) => response,
    async (error: any) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // If already refreshing, queue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          }).catch((err) => {
            return Promise.reject(err);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const newToken = await authApi.refreshToken();
          
          if (newToken) {
            // Update the authorization header for the original request
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            processQueue(null, newToken);
            
            // Retry the original request with new token
            return axiosInstance(originalRequest);
          } else {
            processQueue(new Error('Token refresh failed'), null);
            // Redirect to login
            window.location.href = '/login';
            return Promise.reject(error);
          }
        } catch (refreshError) {
          processQueue(refreshError, null);
          // Redirect to login
          window.location.href = '/login';
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
};

// Set up all API interceptors here
export const setupApiInterceptors = (apiInstance: any) => {
  // Apply token refresh interceptor
  setupTokenRefreshInterceptor(apiInstance);
};

export default setupApiInterceptors;
