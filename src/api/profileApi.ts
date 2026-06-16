import axios from 'axios';
import { API__BASE_URL } from './url_config';
import { setupApiInterceptors } from './apiInterceptors';

// Get the API URL from environment variables or use localhost for development
const API_URL = import.meta.env.VITE_API_URL || API__BASE_URL;

// Create axios instance with interceptors
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token key constant to ensure consistency
const TOKEN_KEY = 'farmaze_token';

// Add a request interceptor to include auth token in requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Setup interceptors for authentication
setupApiInterceptors(apiClient);

export interface UserProfile {
  id: string;
  username: string;
  role: string;
  client_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  profile_picture_url?: string;
  preferences: Record<string, any>;
  notification_settings: {
    email_notifications: boolean;
    order_updates: boolean;
    price_alerts: boolean;
    weekly_summary: boolean;
    sms_notifications: boolean;
  };
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  user_id: string;
  dashboard_theme: 'light' | 'dark';
  default_time_period: '7d' | '30d' | '90d' | 'custom';
  currency_format: 'INR' | 'USD';
  date_format: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  language: 'en' | 'hi';
  timezone: string;
  items_per_page: 10 | 20 | 50 | 100;
  created_at: string;
  updated_at: string;
}

export interface UserProfileUpdate {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  profile_picture_url?: string;
  notification_settings?: {
    email_notifications?: boolean;
    order_updates?: boolean;
    price_alerts?: boolean;
    weekly_summary?: boolean;
    sms_notifications?: boolean;
  };
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

export interface ApiResponse {
  message: string;
}

export interface AvatarUploadResponse {
  message: string;
  avatar_url: string;
}

class ProfileApi {
  /**
   * Get current user profile
   */
  async getProfile(): Promise<UserProfile> {
    try {
      const response = await apiClient.get('/api/v1/profile');
      return response.data;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UserProfileUpdate): Promise<ApiResponse> {
    try {
      const response = await apiClient.put('/api/v1/profile', data);
      return response.data;
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(passwordData: PasswordChangeRequest): Promise<ApiResponse> {
    try {
      const response = await apiClient.put('/api/v1/profile/password', passwordData);
      return response.data;
    } catch (error) {
      console.error('Failed to change password:', error);
      throw error;
    }
  }

  /**
   * Upload user avatar
   */
  async uploadAvatar(file: File): Promise<AvatarUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await apiClient.post('/api/v1/profile/upload-avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Failed to upload avatar:', error);
      throw error;
    }
  }

  /**
   * Get user settings
   */
  async getSettings(): Promise<UserSettings> {
    try {
      const response = await apiClient.get('/api/v1/settings');
      return response.data;
    } catch (error) {
      console.error('Failed to get user settings:', error);
      throw error;
    }
  }

  /**
   * Update user settings
   */
  async updateSettings(settings: Partial<UserSettings>): Promise<ApiResponse> {
    try {
      const response = await apiClient.put('/api/v1/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Failed to update user settings:', error);
      throw error;
    }
  }

  /**
   * Reset user settings to default
   */
  async resetSettings(): Promise<ApiResponse> {
    try {
      const response = await apiClient.post('/api/v1/settings/reset');
      return response.data;
    } catch (error) {
      console.error('Failed to reset user settings:', error);
      throw error;
    }
  }

  /**
   * Get notification settings
   */
  async getNotificationSettings(): Promise<any> {
    try {
      const response = await apiClient.get('/api/v1/notifications/settings');
      return response.data;
    } catch (error) {
      console.error('Failed to get notification settings:', error);
      throw error;
    }
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(settings: any): Promise<ApiResponse> {
    try {
      const response = await apiClient.put('/api/v1/notifications/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      throw error;
    }
  }

  /**
   * Send test notification
   */
  async sendTestNotification(data: any = {}): Promise<ApiResponse> {
    try {
      const response = await apiClient.post('/api/v1/notifications/test', data);
      return response.data;
    } catch (error) {
      console.error('Failed to send test notification:', error);
      throw error;
    }
  }

  /**
   * Get notification history
   */
  async getNotificationHistory(page = 1, limit = 20): Promise<any> {
    try {
      const response = await apiClient.get('/api/v1/notifications/history', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get notification history:', error);
      throw error;
    }
  }

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format (Indian format)
   */
  validatePhoneNumber(phone: string): boolean {
    // Remove spaces and special characters
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    // Check if it's a valid length (10-15 digits)
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;
    return phoneRegex.test(cleaned);
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Format display name from profile
   */
  getDisplayName(profile: UserProfile): string {
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile.first_name) {
      return profile.first_name;
    }
    if (profile.last_name) {
      return profile.last_name;
    }
    return profile.username;
  }

  /**
   * Get user initials for avatar fallback
   */
  getUserInitials(profile: UserProfile): string {
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    if (profile.first_name) {
      return profile.first_name[0].toUpperCase();
    }
    if (profile.last_name) {
      return profile.last_name[0].toUpperCase();
    }
    return profile.username.substring(0, 2).toUpperCase();
  }

  /**
   * Check if file is valid image type
   */
  isValidImageFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return validTypes.includes(file.type);
  }

  /**
   * Check if file size is within limit (2MB)
   */
  isValidFileSize(file: File): boolean {
    const maxSize = 2 * 1024 * 1024; // 2MB
    return file.size <= maxSize;
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export default new ProfileApi();
