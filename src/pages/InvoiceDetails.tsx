import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInvoiceById, viewInvoicePdf, Invoice } from '@/api/invoiceApi';
import { parseCustomDate, formatDate, formatTime } from '@/utils/dateUtils';
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ShoppingBag,
  CreditCard
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import FadeInSection from '@/components/ui/FadeInSection';

const InvoiceDetails = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      if (!invoiceId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch invoice details
        const invoiceData = await getInvoiceById(invoiceId);
        setInvoice(invoiceData);
      } catch (err) {
        console.error('Error fetching invoice details:', err);
        setError('Failed to load invoice details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoiceDetails();
  }, [invoiceId]);

  const handleDownloadInvoice = async () => {
    if (!invoice) return;
    
    setIsDownloading(true);
    
    try {
      // Pass the invoice number as the second parameter to use it as the filename
      await viewInvoicePdf(invoice.id, invoice.invoice_number);
      console.log(`Invoice ${invoice.id} downloaded successfully`);
    } catch (error) {
      console.error(`Failed to download invoice ${invoice.id}:`, error);
      alert('Failed to download invoice. Please try again later.');
    } finally {
      setIsDownloading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'paid') {
      return 'text-green-600 border-green-600 bg-green-50';
    } else if (statusLower === 'pending') {
      return 'text-amber-600 border-amber-600 bg-amber-50';
    } else if (statusLower === 'overdue') {
      return 'text-red-600 border-red-600 bg-red-50';
    }
    return 'text-gray-600 border-gray-600 bg-gray-50';
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'paid') {
      return <CheckCircle size={14} />;
    } else if (statusLower === 'pending') {
      return <Clock size={14} />;
    } else if (statusLower === 'overdue') {
      return <AlertCircle size={14} />;
    }
    return null;
  };

  const getInvoiceStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'generated' || statusLower === 'approved') {
      return <CheckCircle size={14} className="text-green-500" />;
    } else if (statusLower === 'pending') {
      return <Clock size={14} className="text-amber-500" />;
    } else {
      return <AlertCircle size={14} className="text-gray-400" />;
    }
  };

  const getInvoiceStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'generated' || statusLower === 'approved') {
      return 'text-green-600 border-green-200 bg-green-50';
    } else if (statusLower === 'pending') {
      return 'text-amber-600 border-amber-200 bg-amber-50';
    } else {
      return 'text-gray-500 border-gray-200 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-4"
            onClick={() => navigate('/invoices')}
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Invoices
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-4"
            onClick={() => navigate('/invoices')}
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Invoices
          </Button>
          <h1 className="text-2xl font-bold text-farmaze-brown">Invoice Details</h1>
        </div>
        
        <Card>
          <CardContent className="p-8 text-center">
            <XCircle size={48} className="mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Invoice</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-4"
            onClick={() => navigate('/invoices')}
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Invoices
          </Button>
          <h1 className="text-2xl font-bold text-farmaze-brown">Invoice Details</h1>
        </div>
        
        <Card>
          <CardContent className="p-8 text-center">
            <FileText size={48} className="mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">Invoice Not Found</h2>
            <p className="text-gray-600 mb-6">The invoice you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/invoices')}>Return to Invoices</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Format dates
  const createdDate = parseCustomDate(invoice.generated_at);
  const formattedCreatedDate = createdDate ? formatDate(createdDate) : 'N/A';
  const formattedCreatedTime = createdDate ? formatTime(createdDate) : '';
  
  // Due date is typically 30 days after generation for invoices
  const dueDate = createdDate ? new Date(createdDate.getTime() + (30 * 24 * 60 * 60 * 1000)) : null;
  const formattedDueDate = dueDate ? formatDate(dueDate) : 'N/A';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center mb-6 gap-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/invoices')} 
          className="mr-4 hover:bg-farmaze-orange/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Invoices
        </Button>
        <h1 className="text-2xl font-bold text-farmaze-brown">Invoice #{invoice.invoice_number || invoice.id}</h1>
        <div className="ml-auto">
          <Button 
            variant="outline" 
            className="border-farmaze-orange text-farmaze-orange hover:bg-farmaze-orange/10 shadow-sm"
            onClick={handleDownloadInvoice}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Downloading...
              </>
            ) : (
              <>
                <Download size={16} className="mr-2" />
                Download Invoice
              </>
            )}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <FadeInSection>
            <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-2 bg-gradient-to-r from-farmaze-orange/5 to-farmaze-brown/5">
                <CardTitle className="text-lg flex items-center">
                  <FileText className="mr-2 h-5 w-5 text-farmaze-orange" />
                  Invoice Status
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-gray-500" />
                    <span className="text-gray-700">Issued on {formattedCreatedDate}</span>
                  </div>
                  <div className="flex gap-2">
                    <Badge 
                      variant="outline" 
                      className={`${getInvoiceStatusColor(invoice.status)} flex items-center gap-1`}
                    >
                      {getInvoiceStatusIcon(invoice.status)}
                      {invoice.status.toUpperCase()}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`${getStatusColor(invoice.status)} flex items-center gap-1`}
                    >
                      {getStatusIcon(invoice.status)}
                      {invoice.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Invoice Date</h3>
                    <p className="text-lg font-medium">{formattedCreatedDate}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Due Date</h3>
                    <p className="text-lg font-medium">{formattedDueDate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeInSection>
          
          <FadeInSection delay={0.1}>
            <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-2 bg-gradient-to-r from-farmaze-orange/5 to-farmaze-brown/5">
                <CardTitle className="text-lg flex items-center">
                  <ShoppingBag className="mr-2 h-5 w-5 text-farmaze-orange" />
                  Related Orders
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {!invoice.order_id ? (
                  <div className="text-center py-8">
                    <ShoppingBag size={40} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No orders associated with this invoice.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[invoice.order_id].map((orderId, index) => (
                      <div key={index} className="flex justify-between items-center py-3 px-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-farmaze-orange/10 flex items-center justify-center mr-4 shadow-sm">
                            <ShoppingBag size={18} className="text-farmaze-orange" />
                          </div>
                          <div>
                            <h3 className="font-medium">Order #{orderId}</h3>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/order/${orderId}`)}
                        >
                          View Order
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </FadeInSection>
        </div>
        
        <div className="space-y-6">
          <FadeInSection delay={0.2}>
            <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-2 bg-gradient-to-r from-farmaze-orange/5 to-farmaze-brown/5">
                <CardTitle className="text-lg flex items-center">
                  <CreditCard className="mr-2 h-5 w-5 text-farmaze-orange" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">₹{invoice.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">₹0.00</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center py-2">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-lg font-bold text-farmaze-brown">₹{invoice.total_amount.toFixed(2)}</span>
                  </div>
                  
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Payment Status</h3>
                    <Badge 
                      variant="outline" 
                      className={`${getStatusColor(invoice.status)} flex items-center gap-1`}
                    >
                      {getStatusIcon(invoice.status)}
                      {invoice.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeInSection>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetails;
