// GA4 Analytics Service - No external imports needed

// GA4 Configuration
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';

declare global {
  interface Window {
    gtag: any;
    dataLayer: any[];
  }
}

class AnalyticsService {
  private isInitialized = false;

  // Initialize GA4
  init() {
    if (this.isInitialized || !GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === 'G-XXXXXXXXXX') {
      return;
    }

    // Load GA4 script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };

    // Configure GA4
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_title: document.title,
      page_location: window.location.href,
    });

    this.isInitialized = true;
    console.log('GA4 Analytics initialized');
  }

  // Track page views
  trackPageView(pageName: string, pageTitle?: string) {
    if (!this.isInitialized) return;

    window.gtag('config', GA_MEASUREMENT_ID, {
      page_title: pageTitle || pageName,
      page_location: window.location.href,
    });

    console.log('GA4 Page view tracked:', pageName);
  }

  // Track custom events
  trackEvent(eventName: string, parameters?: Record<string, any>) {
    if (!this.isInitialized) return;

    window.gtag('event', eventName, {
      event_category: 'user_interaction',
      event_label: parameters?.label,
      value: parameters?.value,
      ...parameters,
    });

    console.log('GA4 Event tracked:', eventName, parameters);
  }

  // Track user login
  trackLogin(method: string, userId?: string) {
    this.trackEvent('login', {
      method,
      user_id: userId,
    });
  }

  // Track order creation
  trackOrderCreated(orderId: string, value: number, currency: string = 'INR') {
    this.trackEvent('purchase', {
      transaction_id: orderId,
      value,
      currency,
      event_category: 'ecommerce',
    });
  }

  // Track profile updates
  trackProfileUpdate(updateType: string) {
    this.trackEvent('profile_update', {
      update_type: updateType,
      event_category: 'user_profile',
    });
  }

  // Track analytics views
  trackAnalyticsView(section: string, filters?: Record<string, any>) {
    this.trackEvent('view_analytics', {
      analytics_section: section,
      filters: JSON.stringify(filters),
      event_category: 'analytics',
    });
  }

  // Track button clicks
  trackButtonClick(buttonName: string, location: string) {
    this.trackEvent('click', {
      button_name: buttonName,
      location,
      event_category: 'ui_interaction',
    });
  }

  // Track form submissions
  trackFormSubmission(formName: string, success: boolean) {
    this.trackEvent('form_submit', {
      form_name: formName,
      success,
      event_category: 'form_interaction',
    });
  }

  // Track search queries
  trackSearch(searchTerm: string, resultsCount: number) {
    this.trackEvent('search', {
      search_term: searchTerm,
      results_count: resultsCount,
      event_category: 'search',
    });
  }

  // Track feature usage
  trackFeatureUsage(featureName: string, action: string) {
    this.trackEvent('feature_usage', {
      feature_name: featureName,
      action,
      event_category: 'feature_adoption',
    });
  }

  // Track errors
  trackError(errorType: string, errorMessage: string, location: string) {
    this.trackEvent('exception', {
      description: `${errorType}: ${errorMessage}`,
      fatal: false,
      location,
      event_category: 'error',
    });
  }

  // Track session duration (call on page unload)
  trackSessionEnd(sessionDuration: number) {
    this.trackEvent('session_end', {
      session_duration: sessionDuration,
      event_category: 'engagement',
    });
  }

  // Set user properties
  setUserProperties(properties: Record<string, any>) {
    if (!this.isInitialized) return;

    window.gtag('config', GA_MEASUREMENT_ID, {
      custom_map: properties,
    });
  }

  // Set user ID for cross-session tracking
  setUserId(userId: string) {
    if (!this.isInitialized) return;

    window.gtag('config', GA_MEASUREMENT_ID, {
      user_id: userId,
    });
  }
}

// Export singleton instance
export const analytics = new AnalyticsService();
export default analytics;
