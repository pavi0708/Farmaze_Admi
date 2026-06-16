import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseCustomDate, formatDate, formatTime } from '@/utils/dateUtils';
import orderApi from '@/api/orderApi';
import { downloadInvoiceFor } from '@/utils/downloadInvoice';
import { useInteractionTracking, useAnalyticsTracking } from '@/hooks/useActivityTracking';
import { EditOrderModal } from '@/components/orders/EditOrderModal';
import { ReorderDialog } from '@/components/orders/ReorderDialog';
import { useAuth } from '@/context/AuthContext';
import {
  Calendar,
  Package,
  Truck,
  Search,
  ShoppingBag,
  Plus,
  ChevronRight,
  Download,
  ArrowDown,
  ArrowUp,
  X,
  Check,
  Clock,
  Edit,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Receipt,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { addDays, format } from "date-fns";
import { DateRange } from "react-day-picker";
import Pagination from "@/components/products/Pagination";

interface OrderProduct {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: string;
  estimatedDelivery: string;
  items: number;
  totalAmount: number;
  products?: OrderProduct[];
  deliveryFee?: number;
  tax?: number;
  hasFreeDelivery?: boolean;
  time?: string;
  uuid?: string; // The original UUID from the backend API
  invoiceStatus?: string; // Added invoice status
  notes?: string; // Order notes (delivery instructions, special requests)
  branchName?: string; // Branch name for multi-branch clients
}

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterForDays, setFilterForDays] = useState(false);

  // Multi-branch support
  const { branches } = useAuth();
  const [branchFilter, setBranchFilter] = useState<string>('all');

  // Analytics tracking hooks
  const { trackClick, trackSearch } = useInteractionTracking();
  const { trackAnalyticsView } = useAnalyticsTracking();
  const [dateFilter, setDateFilter] = useState('Last 7 days');
  const [dateRange, setDateRange] = useState<DateRange>({ from: addDays(new Date(), -6), to: new Date() });
  const [customPickerOpen, setCustomPickerOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [downloadingOrder, setDownloadingOrder] = useState('');
  const [downloadingInvoice, setDownloadingInvoice] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Edit order modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderItems, setSelectedOrderItems] = useState<any[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  // Cancel order modal state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelOrderData, setCancelOrderData] = useState<any>(null);
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);

  // Reorder dialog state
  const [reorderDialogOpen, setReorderDialogOpen] = useState(false);
  const [reorderOrder, setReorderOrder] = useState<Order | null>(null);

  // Function to get date range based on filter
  const getDateRange = (filter: string) => {
    if (filter === 'Custom' && dateRange.from && dateRange.to) {
      // Format dates in YYYY-MM-DD format without timezone conversion
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      return {
        startDate: formatDate(dateRange.from),
        endDate: formatDate(dateRange.to)
      };
    }
    const endDate = new Date();
    const startDate = new Date();

    switch (filter) {
      case 'Last 7 days':
        setFilterForDays(true);
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'Last 30 days':
        setFilterForDays(true);
        startDate.setDate(endDate.getDate() - 30);
        break;
      case 'Last 90 days':
        setFilterForDays(true);
        startDate.setDate(endDate.getDate() - 90);
        break;
      case 'Last 6 months':
        setFilterForDays(true);
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      case 'Last year':
        setFilterForDays(true);
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case 'All time':
        setFilterForDays(false);
        return { startDate: undefined, endDate: undefined };
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Format dates in local timezone to avoid UTC conversion issues
    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const formattedStartDate = formatLocalDate(startDate);
    const formattedEndDate = formatLocalDate(endDate);
    
    console.log('🔍 Date range calculation:', {
      filter,
      startDate: formattedStartDate,
      endDate: formattedEndDate,
      startDateObj: startDate,
      endDateObj: endDate
    });

    return {
      startDate: formattedStartDate,
      endDate: formattedEndDate
    };
  };

  useEffect(() => {
    // Fetch orders whenever dateFilter or dateRange changes
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const { startDate, endDate } = getDateRange(dateFilter);
        console.log('Fetching orders with date range:', { startDate, endDate });
        const response = await orderApi.getOrders(startDate, endDate);
        
        if (response && response.orders) {
          const transformedOrders = response.orders.map((order) => {
            // Parse the date using our utility function for the format "17/03/2025 10:51 pm"
            const createdDate = parseCustomDate(order.created_at);
            const formattedDate = formatDate(createdDate);
            const formattedTime = formatTime(createdDate);
            
            // Format the delivery date (if available)
            let formattedDeliveryDate = 'Pending';
            if (order.delivered_at) {
              const deliveryDate = parseCustomDate(order.delivered_at);
              if (deliveryDate) {
                formattedDeliveryDate = formatDate(deliveryDate);
              }
            }
            
            return {
              id: order.order_id,
              orderNumber: order.order_number,
              date: formattedDate,
              status: order.status,
              estimatedDelivery: formattedDeliveryDate,
              items: (order as any).items_count ?? 0,
              totalAmount: (order as any).total_amount ?? 0,
              time: formattedTime,
              uuid: order.order_id,
              invoiceStatus: order.invoice_status || 'Not Generated',
              notes: (order as any).notes || '',
              branchName: order.branch_name || ''
            };
          });

          console.log('Setting transformed orders:', transformedOrders);
          setOrders(transformedOrders);
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error);
        // No mock data in production - just set empty array
        setOrders([]);
      } finally {
        setIsLoading(false);
        console.log('Finished loading orders');
      }
    };
    
    fetchOrders();

    // Poll every 30s for status updates (e.g. admin marks order as delivered)
    const pollInterval = setInterval(fetchOrders, 30000);
    return () => clearInterval(pollInterval);
  }, [dateFilter, dateRange]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'order placed':
      case 'in progress':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'dispatched':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'canceled':
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'order placed':
      case 'in progress':
        return <Clock size={14} />;
      case 'dispatched':
        return <Truck size={14} />;
      case 'delivered':
        return <Check size={14} />;
      case 'canceled':
      case 'cancelled':
        return <X size={14} />;
      default:
        return <Package size={14} />;
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortOrders = (ordersToSort: Order[]) => {
    return [...ordersToSort].sort((a, b) => {
      let comparison = 0;
      switch (sortColumn) {
        case 'id':
          comparison = a.id.localeCompare(b.id);
          break;
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'items':
          comparison = a.items - b.items;
          break;
        default:
          comparison = 0;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  const filterOrdersByStatus = (ordersToFilter: Order[]) => {
    if (activeTab === 'all') return ordersToFilter;
    
    return ordersToFilter.filter(order => {
      const status = order.status.toLowerCase();
      switch (activeTab) {
        case 'delivered':
          return status === 'delivered';
        case 'inProgress':
          return status === 'in progress' || status === 'order placed' || status === 'dispatched';
        case 'canceled':
          return status === 'canceled' || status === 'cancelled';
        default:
          return true;
      }
    });
  };

  const filterOrdersByDate = (orders: Order[], filter: string) => {
    if (!orders) return [];

    const today = new Date();
    const filterDate = new Date();

    switch (filter) {
      case 'Last 7 days':
        filterDate.setDate(today.getDate() - 7);
        break;
      case 'Last 30 days':
        filterDate.setDate(today.getDate() - 30);
        break;
      case 'Last 90 days':
        filterDate.setDate(today.getDate() - 90);
        break;
      case 'Last 6 months':
        filterDate.setMonth(today.getMonth() - 6);
        break;
      case 'Last year':
        filterDate.setFullYear(today.getFullYear() - 1);
        break;
      case 'All time':
      case 'Custom':
        return orders;
      default:
        return orders;
    }

    return orders.filter(order => {
      const orderDate = new Date(order.date);
      return orderDate >= filterDate && orderDate <= today;
    });
  };

  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply branch filter
    if (branchFilter !== 'all') {
      filtered = filtered.filter(order => order.branchName === branchFilter);
    }

    // Apply date filter
    filtered = filterOrdersByDate(filtered, dateFilter);

    // Apply status filter
    filtered = filterOrdersByStatus(filtered);

    return filtered;
  }, [orders, searchTerm, branchFilter, dateFilter, activeTab]);

  const sortedOrders = useMemo(() => {
    return sortOrders(filteredOrders);
  }, [filteredOrders, sortColumn, sortDirection]);

  // Summary derived from the same filtered list the table shows, so the
  // cards always match what the user sees. AOV excludes cancelled orders.
  const totalOrders = filteredOrders.length;
  const averageOrderValue = useMemo(() => {
    const qualifying = filteredOrders.filter(o => {
      const s = o.status.toLowerCase();
      return s !== 'canceled' && s !== 'cancelled' && (o.totalAmount || 0) > 0;
    });
    if (qualifying.length === 0) return 0;
    const sum = qualifying.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
    return Math.round(sum / qualifying.length);
  }, [filteredOrders]);

  // Calculate paginated orders
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedOrders.slice(startIndex, endIndex);
  }, [sortedOrders, currentPage, itemsPerPage]);

  const handleNewOrder = () => {
    navigate('/products');
  };

  // Helper function to check if order can be edited
  const canEditOrder = (status: string) => {
    const statusLower = status.toLowerCase().replace(/_/g, ' ');
    return statusLower === 'order placed' || statusLower === 'in progress';
  };

  // Helper function to check if order can be cancelled
  const canCancelOrder = (status: string) => {
    const statusLower = status.toLowerCase().replace(/_/g, ' ');
    return statusLower === 'order placed' || statusLower === 'in progress';
  };

  // Handle edit order
  const handleEditOrder = async (order: Order) => {
    setSelectedOrder(order);
    setIsUpdating(true);
    try {
      // Fetch order items for the selected order with forceLoad to bypass 7-day restriction
      const orderItems = await orderApi.getOrderItems(order.uuid || order.id, order.date, true);
      setSelectedOrderItems(orderItems);
      setEditModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch order items:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle cancel order
  const handleCancelOrder = async (order: any) => {
    setCancelOrderData(order);
    setCancelDialogOpen(true);
  };

  // Confirm cancel order
  const confirmCancelOrder = async () => {
    if (!cancelOrderData) return;
    
    setIsCancellingOrder(true);
    try {
      await orderApi.cancelOrder(cancelOrderData.order_id || cancelOrderData.id);
      handleOrderUpdated();
      setCancelDialogOpen(false);
      setCancelOrderData(null);
    } catch (error) {
      console.error('Failed to cancel order:', error);
      alert('Failed to cancel order. Please try again.');
    } finally {
      setIsCancellingOrder(false);
    }
  };

  // Handle order update - refresh the orders list
  const handleOrderUpdated = async () => {
    try {
      // Refresh orders list
      const { startDate, endDate } = getDateRange(dateFilter);
      const response = await orderApi.getOrders(startDate, endDate);
      if (response && response.orders) {
        const transformedOrders = response.orders.map((order) => {
          const createdDate = parseCustomDate(order.created_at);
          const formattedDate = formatDate(createdDate);
          const formattedTime = formatTime(createdDate);
          
          let formattedDeliveryDate = 'Pending';
          if (order.delivered_at) {
            const deliveryDate = parseCustomDate(order.delivered_at);
            if (deliveryDate) {
              formattedDeliveryDate = formatDate(deliveryDate);
            }
          }
          
          return {
            id: order.order_id,
            orderNumber: order.order_number,
            date: formattedDate,
            status: order.status,
            estimatedDelivery: formattedDeliveryDate,
            items: (order as any).items_count ?? 0,
            totalAmount: (order as any).total_amount ?? 0,
            time: formattedTime,
            uuid: order.order_id,
            invoiceStatus: order.invoice_status || 'Not Generated',
            notes: (order as any).notes || '',
            branchName: order.branch_name || ''
          };
        });
        setOrders(transformedOrders);
        setTotalOrders(response.total_orders);
        setAverageOrderValue(response.average_order_value);
      }
    } catch (error) {
      console.error('Failed to refresh orders:', error);
    }
  };

  // Handle reorder
  const handleReorder = (order: Order) => {
    setReorderOrder(order);
    setReorderDialogOpen(true);
  };

  if (orders.length === 0 && !filterForDays) {
    return (
      <div className="frame-container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-farmaze-brown mb-6">Your Orders</h1>
        
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-10">
            <div className="flex flex-col items-center justify-center py-8">
              <ShoppingBag size={64} className="text-gray-300 mb-6" />
              <h2 className="text-xl font-semibold text-gray-700 mb-3">No orders yet</h2>
              <p className="text-gray-500 mb-8 text-center max-w-md">
                You haven't placed any orders yet. Start shopping to place your first order.
              </p>
              <Button 
                variant="farmaze" 
                size="lg" 
                onClick={handleNewOrder}
                className="gap-2"
              >
                <Plus size={18} />
                Place Your First Order
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="frame-container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-farmaze-brown mb-2">Order History</h1>
        <p className="text-gray-500">View and manage your recent orders</p>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="flex gap-2 flex-grow">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (e.target.value) {
                    trackSearch(e.target.value, filteredOrders.length);
                  }
                }}
                className="pl-10 pr-4 py-2 w-full md:w-72"
              />
            </div>
            {branches && branches.length > 1 && (
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Branches</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.branch_name}>{branch.branch_name}</option>
                ))}
              </select>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {([
              { label: '7D', value: 'Last 7 days' },
              { label: '30D', value: 'Last 30 days' },
              { label: '90D', value: 'Last 90 days' },
              { label: '6M', value: 'Last 6 months' },
              { label: '1Y', value: 'Last year' },
              { label: 'All', value: 'All time' },
            ] as const).map((preset) => (
              <Button
                key={preset.value}
                variant={dateFilter === preset.value ? "default" : "outline"}
                size="sm"
                className={`h-9 px-3 text-xs font-medium ${dateFilter === preset.value ? 'bg-farmaze-green hover:bg-farmaze-green/90 text-white' : ''}`}
                onClick={() => {
                  setDateFilter(preset.value);
                  setCustomPickerOpen(false);
                }}
              >
                {preset.label}
              </Button>
            ))}
            <Popover open={customPickerOpen} onOpenChange={setCustomPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={dateFilter === 'Custom' ? "default" : "outline"}
                  size="sm"
                  className={`h-9 px-3 text-xs font-medium gap-1.5 ${dateFilter === 'Custom' ? 'bg-farmaze-green hover:bg-farmaze-green/90 text-white' : ''}`}
                  onClick={() => {
                    if (dateFilter !== 'Custom') {
                      const now = new Date();
                      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                      setDateRange({ from: firstDayOfMonth, to: now });
                    }
                  }}
                >
                  <Calendar size={14} />
                  {dateFilter === 'Custom' && dateRange.from && dateRange.to
                    ? `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d')}`
                    : 'Custom'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={(newDate) => {
                    if (newDate) {
                      setDateRange(newDate);
                      setDateFilter('Custom');
                      if (newDate.from && newDate.to) {
                        setFilterForDays(true);
                        setCustomPickerOpen(false);
                      }
                    }
                  }}
                  numberOfMonths={2}
                  disabled={(date) => date > new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <Button 
          variant="farmaze" 
          onClick={handleNewOrder}
          className="gap-2 w-full sm:w-auto"
        >
          <Plus size={16} />
          New Order
        </Button>
      </div>
      
      <Tabs 
        defaultValue="all" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="mb-6"
      >
        <TabsList className="grid grid-cols-4 md:w-auto md:inline-flex">
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
          <TabsTrigger value="inProgress">In Progress</TabsTrigger>
          <TabsTrigger value="canceled">Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {/* Desktop Table View */}
      <Card className="hidden md:block mb-8">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-gray-700 text-sm">
              <tr>
                <th
                  className="px-4 py-3 text-left cursor-pointer"
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center">
                    Order
                    {sortColumn === 'id' && (
                      sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left cursor-pointer"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center">
                    Date
                    {sortColumn === 'date' && (
                      sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left">Branch</th>
                <th
                  className="px-4 py-3 text-left cursor-pointer"
                  onClick={() => handleSort('items')}
                >
                  <div className="flex items-center">
                    Items
                    {sortColumn === 'items' && (
                      sortDirection === 'asc' ? <ArrowUp size={14} className="ml-1" /> : <ArrowDown size={14} className="ml-1" />
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedOrders.length === 0 ? (
                <tr className='text-center'>
                  <td className="px-4 py-4 font-medium" colSpan={6}>
                    <p className="text-gray-500">No orders match your search criteria.</p>
                  </td>
                </tr>
              ) : (paginatedOrders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 font-medium">{order.orderNumber}</td>
                  <td className="px-4 py-4">
                    <div>{order.date}</div>
                    <div className="text-gray-500 text-xs">{order.time}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {order.branchName || '—'}
                  </td>
                  <td className="px-4 py-4">{order.items} items</td>
                  <td className="px-4 py-4">
                    <Badge
                      variant="outline"
                      className={`${getStatusColor(order.status)} flex items-center gap-1 w-fit`}
                    >
                      {getStatusIcon(order.status)}
                      {order.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      {canEditOrder(order.status) && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-blue-600 border-blue-200 hover:bg-blue-50"
                          onClick={() => handleEditOrder(order)}
                          title="Edit order"
                        >
                          <Edit size={14} />
                        </Button>
                      )}
                      {canCancelOrder(order.status) && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleCancelOrder(order)}
                          title="Cancel order"
                        >
                          <XCircle size={14} />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-primary border-primary/30 hover:bg-primary/10"
                        onClick={() => handleReorder(order)}
                        title="Reorder"
                      >
                        <RefreshCw size={14} />
                      </Button>
                      {(order.status === 'dispatched' || order.status === 'delivered') && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1 border-green-300 text-green-700 hover:bg-green-50"
                          onClick={() => navigate(`/grn/${order.uuid || order.id}`)}
                          title="Record Delivery"
                        >
                          <Check size={12} />
                          GRN
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => navigate(`/order/${order.uuid || order.id}`)}
                      >
                        View
                      </Button>
                      {order.invoiceStatus === 'approved' && (
                        order.status === 'delivered' ||
                        order.status === 'invoice_approved' ||
                        order.status === 'invoice_generated'
                      ) && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-blue-600 border-blue-200 hover:bg-blue-50"
                          onClick={() => {
                            setDownloadingInvoice(order.id);
                            downloadInvoiceFor(order.uuid || order.id, order.orderNumber)
                              .catch((error) => {
                                console.error(`Failed to download invoice for order ${order.id}:`, error);
                              })
                              .finally(() => setDownloadingInvoice(''));
                          }}
                          disabled={downloadingInvoice === order.id}
                          title="Download invoice"
                        >
                          {downloadingInvoice === order.id ? (
                            <span className="animate-spin text-xs">⏳</span>
                          ) : (
                            <Receipt size={14} />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setDownloadingOrder(order.id);
                          orderApi.downloadOrderSummary(order.uuid || order.id, order.orderNumber)
                            .catch((error) => {
                              console.error(`Failed to download order ${order.id}:`, error);
                            })
                            .finally(() => setDownloadingOrder(''));
                        }}
                        disabled={downloadingOrder === order.id}
                        title="Download summary"
                      >
                        {downloadingOrder === order.id ? (
                          <span className="animate-spin text-xs">⏳</span>
                        ) : (
                          <Download size={14} />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
                
        <Pagination 
          totalItems={sortedOrders.length} 
          shownItems={paginatedOrders.length}
          currentPage={currentPage}
          totalPages={Math.ceil(sortedOrders.length / itemsPerPage)}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </Card>
      
      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {sortedOrders.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">No orders match your search criteria.</p>
            </CardContent>
          </Card>
        ) : (
          paginatedOrders.map(order => (
            <Card 
              key={order.id} 
              className="hover:shadow-md transition-all"
            >
              <CardContent className="p-0">
                <div className="flex flex-col">
                  <div className="p-4 border-b">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-farmaze-brown text-lg mb-1">
                          {order.orderNumber}
                        </h3>
                        <div className="flex items-center text-sm text-gray-500 gap-2">
                          <Calendar size={14} />
                          <span>{order.date}</span>
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`${getStatusColor(order.status)} flex items-center gap-1`}
                      >
                        {getStatusIcon(order.status)}
                        {order.status.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      {order.branchName && (
                        <>
                          <div className="text-gray-500">Branch:</div>
                          <div className="font-medium">{order.branchName}</div>
                        </>
                      )}

                      <div className="text-gray-500">Items:</div>
                      <div className="font-medium">{order.items} items</div>

                      {order.notes && (
                        <>
                          <div className="text-gray-500">Notes:</div>
                          <div className="text-gray-500 text-sm italic">{order.notes}</div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4 flex justify-end items-center bg-gray-50">
                    <div className="flex flex-wrap gap-2">
                      {canEditOrder(order.status) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-blue-200 text-blue-600 hover:bg-blue-50"
                          onClick={() => handleEditOrder(order)}
                        >
                          <Edit size={14} className="mr-1" />
                          Edit
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-farmaze-orange text-farmaze-orange hover:bg-farmaze-orange/10"
                        onClick={() => handleReorder(order)}
                      >
                        <RefreshCw size={14} className="mr-1" />
                        Reorder
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-farmaze-orange text-farmaze-orange hover:bg-farmaze-orange/10"
                        onClick={() => navigate(`/order/${order.uuid || order.id}`)}
                      >
                        View Details <ChevronRight size={16} />
                      </Button>
                      {order.invoiceStatus === 'approved' && (
                        order.status === 'delivered' ||
                        order.status === 'invoice_approved' ||
                        order.status === 'invoice_generated'
                      ) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-blue-500 text-blue-600 hover:bg-blue-50"
                          onClick={() => {
                            setDownloadingInvoice(order.id);
                            downloadInvoiceFor(order.uuid || order.id, order.orderNumber)
                              .catch((error) => {
                                console.error(`Failed to download invoice for order ${order.id}:`, error);
                              })
                              .finally(() => setDownloadingInvoice(''));
                          }}
                          disabled={downloadingInvoice === order.id}
                        >
                          {downloadingInvoice === order.id ? (
                            <span className="animate-spin mr-2">⏳</span>
                          ) : (
                            <Receipt size={16} className="mr-2" />
                          )}
                          Invoice
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-farmaze-brown text-farmaze-brown hover:bg-farmaze-brown/10"
                        onClick={() => {
                          try {
                            setDownloadingOrder(order.id);
                            orderApi.downloadOrderSummary(order.id, order.orderNumber)
                              .then(() => {
                                console.log(`Order ${order.orderNumber} summary downloaded successfully`);
                              })
                              .catch((error) => {
                                console.error(`Failed to download order ${order.id}:`, error);
                                alert('Failed to download order summary. Please try again later.');
                              })
                              .finally(() => {
                                setDownloadingOrder('');
                              });
                          } catch (error) {
                            console.error(`Failed to download order ${order.id}:`, error);
                            setDownloadingOrder('');
                          }
                        }}
                        disabled={downloadingOrder === order.id}
                      >
                        {downloadingOrder === order.id ? (
                          <span className="animate-spin mr-2">⏳</span>
                        ) : (
                          <Download size={16} className="mr-2" />
                        )}
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-farmaze-orange/10 rounded-full">
                <ShoppingBag size={24} className="text-farmaze-orange" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Orders</p>
                <h3 className="text-2xl font-bold text-gray-800">{totalOrders}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Package size={24} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Average Order Value</p>
                <h3 className="text-2xl font-bold text-gray-800">₹{averageOrderValue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</h3>
                <p className="text-xs text-gray-400">Based on delivered/invoiced orders</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Order Modal */}
      <EditOrderModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedOrder(null);
          setSelectedOrderItems([]);
        }}
        orderItems={selectedOrderItems}
        orderId={selectedOrder?.uuid || selectedOrder?.id || ''}
        orderStatus={selectedOrder?.status || ''}
        onOrderUpdated={handleOrderUpdated}
      />

      {/* Reorder Dialog */}
      {reorderOrder && (
        <ReorderDialog
          order={reorderOrder}
          open={reorderDialogOpen}
          onClose={() => {
            setReorderDialogOpen(false);
            setReorderOrder(null);
          }}
        />
      )}

      {/* Cancel Order Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Cancel Order
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel order <span className="font-semibold">{cancelOrderData?.order_number || cancelOrderData?.orderNumber}</span>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelOrder}
              disabled={isCancellingOrder}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isCancellingOrder ? 'Cancelling...' : 'Yes, Cancel Order'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Orders;
