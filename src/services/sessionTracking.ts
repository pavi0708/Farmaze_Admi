import analytics from './analytics';

interface SessionData {
  sessionId: string;
  userId?: string;
  startTime: number;
  lastActivity: number;
  pageViews: string[];
  actions: Array<{
    action: string;
    timestamp: number;
    details?: any;
  }>;
  deviceInfo: {
    userAgent: string;
    screen: string;
    language: string;
    timezone: string;
  };
}

class SessionTrackingService {
  private sessionData: SessionData | null = null;
  private sessionTimeout = 30 * 60 * 1000; // 30 minutes
  private activityTimer: NodeJS.Timeout | null = null;

  // Initialize session tracking
  init(userId?: string) {
    const existingSession = this.getStoredSession();
    
    if (existingSession && this.isSessionValid(existingSession)) {
      // Resume existing session
      this.sessionData = existingSession;
      this.updateLastActivity();
    } else {
      // Start new session
      this.startNewSession(userId);
    }

    this.setupActivityListeners();
    this.startActivityTimer();
    
    console.log('Session tracking initialized:', this.sessionData?.sessionId);
  }

  // Start a new session
  private startNewSession(userId?: string) {
    this.sessionData = {
      sessionId: this.generateSessionId(),
      userId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      pageViews: [],
      actions: [],
      deviceInfo: this.getDeviceInfo(),
    };

    this.storeSession();
    
    // Track session start in GA4
    analytics.trackEvent('session_start', {
      session_id: this.sessionData.sessionId,
      user_id: userId,
    });
  }

  // Track page view
  trackPageView(pageName: string) {
    if (!this.sessionData) return;

    this.sessionData.pageViews.push(pageName);
    this.updateLastActivity();
    this.storeSession();

    // Track in GA4
    analytics.trackPageView(pageName);
  }

  // Track user action
  trackAction(action: string, details?: any) {
    if (!this.sessionData) return;

    this.sessionData.actions.push({
      action,
      timestamp: Date.now(),
      details,
    });
    
    this.updateLastActivity();
    this.storeSession();

    // Track in GA4
    analytics.trackEvent('user_action', {
      action,
      session_id: this.sessionData.sessionId,
      ...details,
    });
  }

  // Update user ID (for login)
  setUserId(userId: string) {
    if (!this.sessionData) return;

    this.sessionData.userId = userId;
    this.storeSession();

    // Update GA4 user ID
    analytics.setUserId(userId);
  }

  // Get session duration
  getSessionDuration(): number {
    if (!this.sessionData) return 0;
    return Date.now() - this.sessionData.startTime;
  }

  // Get session statistics
  getSessionStats() {
    if (!this.sessionData) return null;

    return {
      sessionId: this.sessionData.sessionId,
      duration: this.getSessionDuration(),
      pageViews: this.sessionData.pageViews.length,
      actions: this.sessionData.actions.length,
      uniquePages: [...new Set(this.sessionData.pageViews)].length,
      deviceInfo: this.sessionData.deviceInfo,
    };
  }

  // End session
  endSession() {
    if (!this.sessionData) return;

    const sessionDuration = this.getSessionDuration();
    
    // Track session end in GA4
    analytics.trackSessionEnd(Math.floor(sessionDuration / 1000));
    
    // Send session data to backend (optional)
    this.sendSessionToBackend();
    
    // Clear session data
    this.clearStoredSession();
    this.sessionData = null;
    
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
      this.activityTimer = null;
    }

    console.log('Session ended, duration:', Math.floor(sessionDuration / 1000), 'seconds');
  }

  // Private methods
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      screen: `${screen.width}x${screen.height}`,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  private updateLastActivity() {
    if (this.sessionData) {
      this.sessionData.lastActivity = Date.now();
    }
  }

  private isSessionValid(session: SessionData): boolean {
    const now = Date.now();
    return (now - session.lastActivity) < this.sessionTimeout;
  }

  private storeSession() {
    if (this.sessionData) {
      localStorage.setItem('farmaze_session', JSON.stringify(this.sessionData));
    }
  }

  private getStoredSession(): SessionData | null {
    try {
      const stored = localStorage.getItem('farmaze_session');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private clearStoredSession() {
    localStorage.removeItem('farmaze_session');
  }

  private setupActivityListeners() {
    // Track user activity to extend session
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, () => {
        this.updateLastActivity();
      }, { passive: true });
    });

    // Handle page unload
    window.addEventListener('beforeunload', () => {
      this.endSession();
    });

    // Handle visibility change (tab switching)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackAction('tab_hidden');
      } else {
        this.trackAction('tab_visible');
        this.updateLastActivity();
      }
    });
  }

  private startActivityTimer() {
    // Check for session timeout every minute
    this.activityTimer = setInterval(() => {
      if (this.sessionData && !this.isSessionValid(this.sessionData)) {
        this.endSession();
      }
    }, 60000);
  }

  private async sendSessionToBackend() {
    if (!this.sessionData) return;

    try {
      const sessionStats = this.getSessionStats();
      
      // Send to your backend API (optional)
      await fetch('/api/v1/analytics/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('farmaze_token')}`,
        },
        body: JSON.stringify(sessionStats),
      });
    } catch (error) {
      console.warn('Failed to send session data to backend:', error);
    }
  }
}

// Export singleton instance
export const sessionTracking = new SessionTrackingService();
export default sessionTracking;
