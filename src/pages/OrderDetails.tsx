import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import orderApi, { OrderDetail, OrderSummary } from '@/api/orderApi';
import { downloadInvoiceFor } from '@/utils/downloadInvoice';
import complaintApi, { ComplaintSummary, CATEGORY_LABELS } from '@/api/complaintApi';
import ComplaintStatusBadge from '@/components/complaints/ComplaintStatusBadge';
import { parseCustomDate, formatDate, formatTime } from '@/utils/dateUtils';
import {
  ArrowLeft,
  Download,
  FileText,
  Receipt,
  Truck,
  Package,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ShoppingBag,
  Map,
  Plus,
  Edit3,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import FadeInSection from '@/components/ui/FadeInSection';
import { EditOrderModal } from '@/components/orders/EditOrderModal';
import OrderStatusStepper from '@/components/orders/OrderStatusStepper';
import Pagination from '@/components/products/Pagination';

const OrderDetails = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [orderItems, setOrderItems] = useState<OrderDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadType, setDownloadType] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Complaint state
  const [orderComplaints, setOrderComplaints] = useState<ComplaintSummary[]>([]);

  // Pagination state for order items
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch order details
        const orderData = await orderApi.getOrderById(orderId);
        setOrder(orderData);
        
        // Check if the order is within the 7-day window
        const orderDate = parseCustomDate(orderData.created_at);
        const now = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        
        // Pass the order date string to the getOrderItems function
        // Force load items regardless of age when viewing order details
        const items = await orderApi.getOrderItems(orderId, orderData.created_at, true);
        
        if (items.length > 0) {
          console.log('Successfully fetched order items');
          setOrderItems(items);
        } else {
          console.log('No items found for this order');
          setOrderItems([]);
        }

        // Fetch complaints for this order
        try {
          const complaints = await complaintApi.getComplaintsByOrderId(orderId);
          setOrderComplaints(complaints);
        } catch (complaintErr) {
          console.error('Error fetching order complaints:', complaintErr);
        }
      } catch (err) {
        console.error('Error fetching order details:', err);
        setError('Failed to load order details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrderDetails();

    // Poll every 30s for status updates
    const pollInterval = setInterval(fetchOrderDetails, 30000);
    return () => clearInterval(pollInterval);
  }, [orderId]);

  const handleDownloadSummary = async () => {
    if (!orderId) return;
    
    setIsDownloading(true);
    setDownloadType('summary');
    try {
      const blob = await orderApi.downloadOrderSummary(orderId);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${order?.order_number || orderId}_summary.pdf`;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading order summary:', err);
      alert('Failed to download order summary. Please try again later.');
    } finally {
      setIsDownloading(false);
      setDownloadType('');
    }
  };

  // Handle download invoice
  const handleDownloadInvoice = async () => {
    if (!orderId) return;

    setIsDownloading(true);
    setDownloadType('invoice');
    try {
      await downloadInvoiceFor(orderId, order?.order_number || orderId);
    } catch (err) {
      console.error('Error downloading invoice:', err);
      alert('Failed to download invoice. Please try again later.');
    } finally {
      setIsDownloading(false);
      setDownloadType('');
    }
  };

  // Handle download delivery challan
  const handleDownloadDC = async () => {
    if (!orderId) return;
    
    setIsDownloading(true);
    setDownloadType('dc');
    try {
      const blob = await orderApi.downloadDeliveryChallan(orderId);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${order?.order_number || orderId}_dc.pdf`;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading D.C.:', err);
      alert('Failed to download D.C. Please try again later.');
    } finally {
      setIsDownloading(false);
      setDownloadType('');
    }
  };

  // Function to refetch order details after edit
  const handleOrderUpdated = () => {
    // Refetch order details
    const fetchOrderDetails = async () => {
      if (!orderId) return;
      
      try {
        const orderData = await orderApi.getOrderById(orderId);
        setOrder(orderData);
        
        const items = await orderApi.getOrderItems(orderId, orderData.created_at);
        setOrderItems(items);
      } catch (err) {
        console.error('Error refetching order details:', err);
      }
    };
    
    fetchOrderDetails();
  };

  // Check if a complaint can be reported for this order
  const canReportIssue = () => {
    if (!order) return false;
    const reportableStatuses = ['dispatched', 'delivered', 'completed'];
    return reportableStatuses.some(status =>
      order.status.toLowerCase().includes(status.toLowerCase())
    );
  };

  // Active (unresolved) complaint for this order
  const activeComplaint = orderComplaints.find(c => !['resolved', 'closed'].includes(c.status));

  // Check if order can be edited
  const canEditOrCancelOrder = () => {
    if (!order) return false;
    const editableStatuses = ['order placed', 'pending', 'confirmed', 'processing'];
    return editableStatuses.some(status => 
      order.status.toLowerCase().includes(status.toLowerCase())
    );
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'delivered' || statusLower === 'completed') {
      return 'text-green-600 border-green-600 bg-green-50';
    } else if (statusLower === 'processing' || statusLower === 'confirmed') {
      return 'text-blue-600 border-blue-600 bg-blue-50';
    } else if (statusLower === 'pending' || statusLower === 'placed') {
      return 'text-orange-600 border-orange-600 bg-orange-50';
    } else if (statusLower === 'cancelled' || statusLower === 'rejected') {
      return 'text-red-600 border-red-600 bg-red-50';
    }
    return 'text-gray-600 border-gray-600 bg-gray-50';
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'delivered' || statusLower === 'completed') {
      return <CheckCircle size={14} />;
    } else if (statusLower === 'processing' || statusLower === 'confirmed') {
      return <Clock size={14} />;
    } else if (statusLower === 'pending' || statusLower === 'placed') {
      return <AlertCircle size={14} />;
    } else if (statusLower === 'cancelled' || statusLower === 'rejected') {
      return <XCircle size={14} />;
    }
    return null;
  };

  // Calculate order total
  const calculateTotal = () => {
    return orderItems.reduce((total, item) => {
      return total + (item.unit_price || 0) * item.quantity;
    }, 0);
  };

  // Pagination logic for order items
  const totalPages = Math.ceil(orderItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = orderItems.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  if (isLoading) {
    return (
      <div className="frame-container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-4"
            onClick={() => navigate('/orders')}
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Orders
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
      <div className="frame-container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-4"
            onClick={() => navigate('/orders')}
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Orders
          </Button>
          <h1 className="text-2xl font-bold text-farmaze-brown">Order Details</h1>
        </div>
        
        <Card>
          <CardContent className="p-8 text-center">
            <XCircle size={48} className="mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Order</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="frame-container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-4"
            onClick={() => navigate('/orders')}
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Orders
          </Button>
          <h1 className="text-2xl font-bold text-farmaze-brown">Order Details</h1>
        </div>
        
        <Card>
          <CardContent className="p-8 text-center">
            <Package size={48} className="mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-6">The order you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/orders')}>Return to Orders</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Format dates
  const createdDate = parseCustomDate(order.created_at);
  const formattedCreatedDate = createdDate ? formatDate(createdDate) : 'N/A';
  const formattedCreatedTime = createdDate ? formatTime(createdDate) : '';
  
  const formattedDeliveredDate = order.estimated_delivery_date ? formatDate(new Date(order.estimated_delivery_date)) : 'Pending';

  return (
    <div className="frame-container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center mb-6 gap-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/orders')} 
          className="mr-4 hover:bg-farmaze-orange/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
        <h1 className="text-2xl font-bold text-farmaze-brown">Order #{order.order_number}</h1>
        <div className="ml-auto flex flex-wrap gap-2">
          {canEditOrCancelOrder() && (
            <Button
              variant="outline"
              className="border-farmaze-brown text-farmaze-brown hover:bg-farmaze-brown/10 shadow-sm"
              onClick={() => setShowEditModal(true)}
            >
              <Edit3 size={16} className="mr-2" />
              Edit Order
            </Button>
          )}

          {canReportIssue() && (
            <Button
              variant="outline"
              className="border-red-400 text-red-600 hover:bg-red-50 shadow-sm"
              onClick={() => navigate(`/order/${orderId}/complaint`)}
            >
              <AlertTriangle size={16} className="mr-2" />
              Report Issue
            </Button>
          )}
          
          {/* Download Options */}
          <Button 
            variant="outline" 
            className="border-farmaze-orange text-farmaze-orange hover:bg-farmaze-orange/10 shadow-sm"
            onClick={handleDownloadSummary}
            disabled={isDownloading && downloadType === 'summary'}
          >
            {isDownloading && downloadType === 'summary' ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Downloading...
              </>
            ) : (
              <>
                <Download size={16} className="mr-2" />
                Summary
              </>
            )}
          </Button>

          <Button
            variant="outline"
            className={`shadow-sm ${
              order.invoice_status === 'approved' &&
              (order.status === 'delivered' || order.status === 'invoice_approved' || order.status === 'invoice_generated')
                ? 'border-blue-500 text-blue-500 hover:bg-blue-50'
                : 'border-gray-300 text-gray-400 cursor-not-allowed'
            }`}
            onClick={handleDownloadInvoice}
            title={
              order.invoice_status !== 'approved'
                ? 'Invoice not approved yet'
                : order.status !== 'delivered' && order.status !== 'invoice_approved' && order.status !== 'invoice_generated'
                  ? 'Order not delivered yet'
                  : 'Download invoice'
            }
            disabled={
              (isDownloading && downloadType === 'invoice') ||
              order.invoice_status !== 'approved' ||
              (order.status !== 'delivered' && order.status !== 'invoice_approved' && order.status !== 'invoice_generated')
            }
          >
            {isDownloading && downloadType === 'invoice' ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Downloading...
              </>
            ) : (
              <>
                <Receipt size={16} className="mr-2" />
                Invoice
              </>
            )}
          </Button>

          <Button
            variant="outline"
            className={`shadow-sm ${
              (order.dc_status === 'approved' || order.dc_status === 'delivered')
                ? 'border-green-500 text-green-500 hover:bg-green-50'
                : 'border-gray-300 text-gray-400 cursor-not-allowed'
            }`}
            onClick={handleDownloadDC}
            disabled={(isDownloading && downloadType === 'dc') || (order.dc_status !== 'approved' && order.dc_status !== 'delivered')}
          >
            {isDownloading && downloadType === 'dc' ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Downloading...
              </>
            ) : (
              <>
                <FileText size={16} className="mr-2" />
                D.C.
              </>
            )}
          </Button>
        </div>
      </div>
      
      {/* Order Status Stepper - Full Width at Top */}
      <FadeInSection>
        <div className="mb-6">
          <OrderStatusStepper
            status={order.status}
            createdDate={formattedCreatedDate}
            deliveredDate={formattedDeliveredDate}
          />
        </div>
      </FadeInSection>

      {/* Complaint Banner */}
      {activeComplaint && (
        <FadeInSection>
          <div className="mb-6 flex items-center justify-between gap-4 p-4 rounded-lg border border-yellow-300 bg-yellow-50">
            <div className="flex items-center gap-3">
              <AlertTriangle size={18} className="text-yellow-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  You have an open complaint for this order
                </p>
                <p className="text-sm text-yellow-700">
                  #{activeComplaint.complaint_number} &middot; {CATEGORY_LABELS[activeComplaint.category]} &middot;{' '}
                  <ComplaintStatusBadge status={activeComplaint.status} />
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-yellow-400 text-yellow-700 hover:bg-yellow-100 flex-shrink-0"
              onClick={() => navigate(`/complaints/${activeComplaint.complaint_id}`)}
            >
              View Details
            </Button>
          </div>
        </FadeInSection>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items - Expanded Section */}
        <div className="lg:col-span-2 space-y-6">
          <FadeInSection delay={0.1}>
            <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-2 bg-gradient-to-r from-farmaze-orange/5 to-farmaze-brown/5">
                <CardTitle className="text-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <ShoppingBag className="mr-2 h-5 w-5 text-farmaze-orange" />
                    Order Items ({orderItems.length})
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-gray-500" />
                    <span className="text-sm text-gray-600">Ordered on {formattedCreatedDate}</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {error ? (
                  <div className="text-center py-8 bg-amber-50 rounded-lg border border-amber-200 m-6">
                    <AlertCircle size={40} className="mx-auto text-amber-500 mb-4" />
                    <p className="text-amber-700 font-medium">{error}</p>
                    <p className="text-amber-600 mt-2 text-sm">This helps reduce database load and improve application performance.</p>
                  </div>
                ) : orderItems.length === 0 ? (
                  <div className="text-center py-12 m-6">
                    <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500 text-lg">No items found for this order.</p>
                  </div>
                ) : (
                  <>
                    <div className="divide-y divide-gray-100">
                      {paginatedItems.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-3 px-6 hover:bg-gray-50 transition-colors duration-200">
                          <div className="flex items-center flex-1">
                            <div className="h-10 w-10 rounded-full bg-farmaze-orange/10 flex items-center justify-center mr-3 shadow-sm">
                              <ShoppingBag size={18} className="text-farmaze-orange" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 text-base truncate">{item.product_name}</h3>
                              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                {item.unit_price && (
                                  <span>₹{item.unit_price.toFixed(2)} per {item.unit}</span>
                                )}
                                {item.sku && (
                                  <span className="text-gray-400">SKU: {item.sku}</span>
                                )}
                              </div>
                              {item.remarks && (
                                <p className="text-sm text-gray-500 mt-1 italic">Note: {item.remarks}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-4 flex-shrink-0 flex items-center gap-3">
                            <div className="text-lg font-bold text-gray-900">
                              {item.unit_price ? `₹${(item.unit_price * item.quantity).toFixed(2)}` : `${item.quantity} ${item.unit}`}
                            </div>
                            {canReportIssue() && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/order/${orderId}/complaint?item=${item.id}`);
                                }}
                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                title="Report issue with this item"
                              >
                                <AlertTriangle size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Pagination for Order Items */}
                    {orderItems.length > itemsPerPage && (
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={orderItems.length}
                        shownItems={paginatedItems.length}
                        onPageChange={handlePageChange}
                        itemsPerPage={itemsPerPage}
                        onItemsPerPageChange={handleItemsPerPageChange}
                      />
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </FadeInSection>
        </div>
        
        <div className="space-y-6">
          <FadeInSection delay={0.2}>
            <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
              {/* <CardHeader className="pb-2 bg-gradient-to-r from-farmaze-orange/5 to-farmaze-brown/5">
                <CardTitle className="text-lg flex items-center">
                  <Package className="mr-2 h-5 w-5 text-farmaze-orange" />
                  Order Summary
                </CardTitle>
              </CardHeader> */}
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Number</span>
                    <span className="font-medium">#{order.order_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Date</span>
                    <span>{formattedCreatedDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <Badge 
                      variant="outline" 
                      className={`${getStatusColor(order.status)} flex items-center gap-1`}
                    >
                      {getStatusIcon(order.status)}
                      {order.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items</span>
                    <span>{orderItems.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Delivery</span>
                    <span>{formattedDeliveredDate}</span>
                  </div>
                </div>
                
                {/* <Separator className="my-4" />
                
                  <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>₹{calculateTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Delivery Fee</span>
                    <span className="text-green-600 font-medium">FREE</span>
                  </div>
                </div> */}
                
                <Separator className="my-4" />
                
                {/* <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-farmaze-brown">₹{calculateTotal().toFixed(2)}</span>
                </div> */}
              </CardContent>
            </Card>
          </FadeInSection>
          
          <FadeInSection delay={0.3}>
            <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-2 bg-gradient-to-r from-farmaze-orange/5 to-farmaze-brown/5">
                <CardTitle className="text-lg flex items-center">
                  <Truck className="mr-2 h-5 w-5 text-farmaze-orange" />
                  Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Delivery Address</h3>
                    <p className="text-gray-800">
                      {order.delivery_address ? (
                        <>
                          {order.delivery_address.address_line_1}
                          {order.delivery_address.address_line_2 && ', ' + order.delivery_address.address_line_2}<br />
                          {order.delivery_address.city}, {order.delivery_address.zip_code}<br />
                          {order.delivery_address.country}
                        </>
                      ) : order.client_contact?.address ? (
                        <>
                          {order.client_contact.address.address_line_1}
                          {order.client_contact.address.address_line_2 && ', ' + order.client_contact.address.address_line_2}<br />
                          {order.client_contact.address.city}, {order.client_contact.address.zip_code}<br />
                          {order.client_contact.address.country}
                        </>
                      ) : (
                        <>
                          123 Farm Avenue, Rural District<br />
                          Bangalore, Karnataka 560001<br />
                          India
                        </>
                      )}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Contact</h3>
                    <p className="text-gray-800">
                      Phone: {order.contact_phone || order.client_contact?.phone || '+91 98765 43210'}<br />
                      Email: {order.contact_email || order.client_contact?.email || 'customer@example.com'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeInSection>
        </div>
      </div>

      {/* Edit Order Modal */}
      <EditOrderModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        orderItems={orderItems}
        orderId={orderId || ''}
        orderStatus={order?.status || ''}
        onOrderUpdated={handleOrderUpdated}
      />
    </div>
  );
};

export default OrderDetails;
