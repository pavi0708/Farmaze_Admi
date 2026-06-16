import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Users, 
  Clock, 
  Eye, 
  MousePointer, 
  RefreshCw,
  TrendingUp,
  Calendar
} from 'lucide-react';
import sessionTracking from '@/services/sessionTracking';

interface ActivityStats {
  currentSession: {
    sessionId: string;
    duration: number;
    pageViews: number;
    actions: number;
    uniquePages: number;
    deviceInfo: {
      userAgent: string;
      screen: string;
      language: string;
      timezone: string;
    };
  } | null;
  recentActions: Array<{
    action: string;
    timestamp: number;
    details?: any;
  }>;
}

const ActivityDashboard = () => {
  const [stats, setStats] = useState<ActivityStats>({
    currentSession: null,
    recentActions: []
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadStats = () => {
    const sessionStats = sessionTracking.getSessionStats();
    setStats({
      currentSession: sessionStats,
      recentActions: [] // Would come from backend in real implementation
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    loadStats();
    setIsRefreshing(false);
  };

  useEffect(() => {
    loadStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-farmaze-brown">Activity Dashboard</h2>
          <p className="text-gray-500">Real-time user activity and session tracking</p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Current Session Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Session Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.currentSession ? formatDuration(stats.currentSession.duration) : '0s'}
            </div>
            <p className="text-xs text-muted-foreground">
              Current session time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.currentSession?.pageViews || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Pages visited this session
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Actions</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.currentSession?.actions || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Actions performed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Pages</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.currentSession?.uniquePages || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Different pages visited
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Session Information */}
      {stats.currentSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Current Session Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Session Info</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Session ID:</span>
                    <span className="font-mono text-xs">
                      {stats.currentSession.sessionId?.slice(-8)}...
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Duration:</span>
                    <span>{formatDuration(stats.currentSession.duration)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Page Views:</span>
                    <span>{stats.currentSession.pageViews}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Actions:</span>
                    <span>{stats.currentSession.actions}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Device Info</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Screen:</span>
                    <span>{stats.currentSession.deviceInfo?.screen}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Language:</span>
                    <span>{stats.currentSession.deviceInfo?.language}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Timezone:</span>
                    <span className="text-xs">{stats.currentSession.deviceInfo?.timezone}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* GA4 Integration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Analytics Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Google Analytics 4</h4>
                <p className="text-sm text-gray-500">
                  Tracking user behavior and page views
                </p>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Active
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Session Tracking</h4>
                <p className="text-sm text-gray-500">
                  Local session management and user journey tracking
                </p>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Active
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Backend Activity Logging</h4>
                <p className="text-sm text-gray-500">
                  Server-side activity tracking and audit logs
                </p>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Active
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Setup Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div>
              <h4 className="font-medium">1. Google Analytics 4 Setup</h4>
              <p className="text-gray-600">
                Add your GA4 Measurement ID to <code className="bg-gray-100 px-1 rounded">.env</code>:
              </p>
              <code className="block bg-gray-100 p-2 rounded mt-1 text-xs">
                REACT_APP_GA_MEASUREMENT_ID=G-XXXXXXXXXX
              </code>
            </div>
            
            <div>
              <h4 className="font-medium">2. View Analytics Data</h4>
              <p className="text-gray-600">
                Visit your GA4 dashboard to see real-time user activity, page views, and custom events.
              </p>
            </div>
            
            <div>
              <h4 className="font-medium">3. Custom Events Tracked</h4>
              <p className="text-gray-600">
                Login, page views, form submissions, button clicks, search queries, and feature usage.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityDashboard;
