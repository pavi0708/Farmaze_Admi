import { useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import analytics from '@/services/analytics';
import sessionTracking from '@/services/sessionTracking';

// Hook for tracking page views
export const usePageTracking = () => {
  const location = useLocation();
  const previousPath = useRef<string>('');

  useEffect(() => {
    const currentPath = location.pathname;
    
    if (currentPath !== previousPath.current) {
      // Track page view
      const pageName = getPageNameFromPath(currentPath);
      analytics.trackPageView(pageName);
      sessionTracking.trackPageView(pageName);
      
      previousPath.current = currentPath;
    }
  }, [location]);
};

// Hook for tracking user interactions
export const useInteractionTracking = () => {
  const trackClick = useCallback((buttonName: string, location?: string) => {
    analytics.trackButtonClick(buttonName, location || window.location.pathname);
    sessionTracking.trackAction('button_click', { buttonName, location });
  }, []);

  const trackFormSubmit = useCallback((formName: string, success: boolean) => {
    analytics.trackFormSubmission(formName, success);
    sessionTracking.trackAction('form_submit', { formName, success });
  }, []);

  const trackSearch = useCallback((searchTerm: string, resultsCount: number) => {
    analytics.trackSearch(searchTerm, resultsCount);
    sessionTracking.trackAction('search', { searchTerm, resultsCount });
  }, []);

  const trackFeatureUsage = useCallback((featureName: string, action: string) => {
    analytics.trackFeatureUsage(featureName, action);
    sessionTracking.trackAction('feature_usage', { featureName, action });
  }, []);

  return {
    trackClick,
    trackFormSubmit,
    trackSearch,
    trackFeatureUsage,
  };
};

// Hook for tracking session duration
export const useSessionTracking = () => {
  const sessionStart = useRef<number>(Date.now());

  useEffect(() => {
    const handleBeforeUnload = () => {
      const sessionDuration = Date.now() - sessionStart.current;
      analytics.trackSessionEnd(Math.floor(sessionDuration / 1000)); // Convert to seconds
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const getSessionDuration = useCallback(() => {
    return Math.floor((Date.now() - sessionStart.current) / 1000);
  }, []);

  return { getSessionDuration };
};

// Hook for tracking errors
export const useErrorTracking = () => {
  const trackError = useCallback((error: Error, location?: string) => {
    analytics.trackError(
      error.name,
      error.message,
      location || window.location.pathname
    );
  }, []);

  const trackApiError = useCallback((endpoint: string, statusCode: number, message: string) => {
    analytics.trackError(
      'API_ERROR',
      `${endpoint} - ${statusCode}: ${message}`,
      window.location.pathname
    );
  }, []);

  return {
    trackError,
    trackApiError,
  };
};

// Hook for tracking analytics views
export const useAnalyticsTracking = () => {
  const trackAnalyticsView = useCallback((section: string, filters?: Record<string, any>) => {
    analytics.trackAnalyticsView(section, filters);
  }, []);

  const trackOrderCreated = useCallback((orderId: string, value: number) => {
    analytics.trackOrderCreated(orderId, value);
  }, []);

  const trackProfileUpdate = useCallback((updateType: string) => {
    analytics.trackProfileUpdate(updateType);
  }, []);

  return {
    trackAnalyticsView,
    trackOrderCreated,
    trackProfileUpdate,
  };
};

// Helper function to get page name from path
function getPageNameFromPath(path: string): string {
  const pathMap: Record<string, string> = {
    '/': 'Dashboard',
    '/orders': 'Orders',
    '/analytics': 'Analytics',
    '/profile': 'Profile',
    '/products': 'Products',
    '/invoices': 'Invoices',
    '/reports': 'Reports',
  };

  // Check for exact matches first
  if (pathMap[path]) {
    return pathMap[path];
  }

  // Handle dynamic routes
  if (path.startsWith('/orders/')) {
    return 'Order Details';
  }
  if (path.startsWith('/products/')) {
    return 'Product Details';
  }
  if (path.startsWith('/analytics/')) {
    return 'Analytics Details';
  }

  // Default fallback
  return path.replace('/', '').replace(/\//g, ' > ') || 'Unknown Page';
}

// Combined hook for all tracking functionality
export const useActivityTracking = () => {
  usePageTracking();
  const sessionTracking = useSessionTracking();
  const interactionTracking = useInteractionTracking();
  const errorTracking = useErrorTracking();
  const analyticsTracking = useAnalyticsTracking();

  return {
    ...sessionTracking,
    ...interactionTracking,
    ...errorTracking,
    ...analyticsTracking,
  };
};
