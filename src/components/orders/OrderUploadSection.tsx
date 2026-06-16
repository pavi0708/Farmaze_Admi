// Order Upload Section Component
// Senior Frontend Engineer Implementation

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  FileImage, 
  Upload, 
  CheckCircle, 
  Info,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

import TextOrderUpload from './TextOrderUpload';
import DocumentOrderUpload from './DocumentOrderUpload';
import { 
  OrderUploadSectionProps, 
  OrderUploadResponse 
} from '@/types/orderUpload';

interface UploadHistory {
  id: string;
  type: 'text' | 'document';
  timestamp: Date;
  status: 'success' | 'error';
  message: string;
}

export const OrderUploadSection: React.FC<OrderUploadSectionProps> = ({
  onUploadSuccess,
  className = '',
  showTextUpload = true,
  showDocumentUpload = true,
}) => {
  const [activeTab, setActiveTab] = useState<string>(showTextUpload ? 'text' : 'document');
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([]);
  const [totalUploads, setTotalUploads] = useState(0);

  // Handle successful upload
  const handleUploadSuccess = useCallback((response: OrderUploadResponse, type: 'text' | 'document') => {
    const historyEntry: UploadHistory = {
      id: response.uploaded_order_id,
      type,
      timestamp: new Date(),
      status: 'success',
      message: response.message,
    };

    setUploadHistory(prev => [historyEntry, ...prev.slice(0, 4)]); // Keep last 5 entries
    setTotalUploads(prev => prev + 1);

    // Call parent callback
    onUploadSuccess?.(response);

    // Show consolidated success message
    toast.success(`${type === 'text' ? 'Text' : 'Document'} order uploaded!`, {
      description: 'Your order is now pending admin review.',
      duration: 4000,
    });
  }, [onUploadSuccess]);

  // Handle upload error
  const handleUploadError = useCallback((error: string, type: 'text' | 'document') => {
    const historyEntry: UploadHistory = {
      id: `error-${Date.now()}`,
      type,
      timestamp: new Date(),
      status: 'error',
      message: error,
    };

    setUploadHistory(prev => [historyEntry, ...prev.slice(0, 4)]);
  }, []);

  // Format timestamp for display
  const formatTimestamp = (timestamp: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return timestamp.toLocaleDateString();
  };

  // Determine which tabs to show
  const availableTabs = [];
  if (showTextUpload) {
    availableTabs.push({ value: 'text', label: 'Text Order', icon: FileText });
  }
  if (showDocumentUpload) {
    availableTabs.push({ value: 'document', label: 'Document Order', icon: FileImage });
  }

  // If no tabs are enabled, show info message
  if (availableTabs.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Order upload functionality is currently disabled.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // If only one tab is enabled, don't show tabs UI
  if (availableTabs.length === 1) {
    const singleTab = availableTabs[0];
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Upload history summary */}
        {uploadHistory.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Recent Uploads</CardTitle>
                <Badge variant="outline" className="text-xs">
                  {totalUploads} total
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {uploadHistory.slice(0, 3).map((entry) => (
                  <div key={entry.id} className="flex items-center gap-3 text-sm">
                    <div className={`w-2 h-2 rounded-full ${
                      entry.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="flex-1 truncate">
                      {entry.type === 'text' ? '📝' : '📎'} {entry.message}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(entry.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Single upload component */}
        {singleTab.value === 'text' ? (
          <TextOrderUpload
            onUploadSuccess={(response) => handleUploadSuccess(response, 'text')}
            onUploadError={(error) => handleUploadError(error, 'text')}
          />
        ) : (
          <DocumentOrderUpload
            onUploadSuccess={(response) => handleUploadSuccess(response, 'document')}
            onUploadError={(error) => handleUploadError(error, 'document')}
          />
        )}
      </div>
    );
  }

  // Multiple tabs UI
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-600" />
                Order Upload
              </CardTitle>
              <CardDescription>
                Upload your orders via text input or document files for admin review
              </CardDescription>
            </div>
            
            {totalUploads > 0 && (
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{totalUploads}</div>
                <div className="text-xs text-gray-500">uploads today</div>
              </div>
            )}
          </div>
        </CardHeader>

        {/* Recent upload history */}
        {uploadHistory.length > 0 && (
          <CardContent className="pt-0">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Activity
              </h4>
              <div className="space-y-2">
                {uploadHistory.slice(0, 3).map((entry) => (
                  <div key={entry.id} className="flex items-center gap-3 text-sm bg-gray-50 rounded-lg p-2">
                    {entry.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-red-500 flex-shrink-0" />
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {entry.type === 'text' ? 'Text' : 'Document'}
                        </Badge>
                        <span className="truncate">{entry.message}</span>
                      </div>
                    </div>
                    
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {formatTimestamp(entry.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Upload tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          {availableTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {showTextUpload && (
          <TabsContent value="text" className="mt-6">
            <TextOrderUpload
              onUploadSuccess={(response) => handleUploadSuccess(response, 'text')}
              onUploadError={(error) => handleUploadError(error, 'text')}
            />
          </TabsContent>
        )}

        {showDocumentUpload && (
          <TabsContent value="document" className="mt-6">
            <DocumentOrderUpload
              onUploadSuccess={(response) => handleUploadSuccess(response, 'document')}
              onUploadError={(error) => handleUploadError(error, 'document')}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Help section */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">How it works:</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-700">
                <li>Choose between text input or document upload</li>
                <li>Enter your order details or upload a file</li>
                <li>Submit for admin review and approval</li>
                <li>Receive confirmation once processed</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderUploadSection;
