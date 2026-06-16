
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Truck, Calendar, ArrowRight, Plus, Clock, Check, X, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import orderApi from '@/api/orderApi';
import { formatDate, parseCustomDate } from '@/utils/dateUtils';

interface Order {
  id: string;
  uuid?: string;
  orderNumber?: string;
  date: string;
  status: string;
  estimatedDelivery: string;
  items: number;
  totalAmount: number;
  supplier?: string;
  time?: string;
}

const OrdersInProgress: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Fetching recent orders from API...');
        
        // Calculate date 7 days ago for filtering
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const startDate = sevenDaysAgo.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        
        // Only fetch orders from the last 7 days
        const { orders: fetchedOrders } = await orderApi.getOrders(startDate);
        console.log('Recent orders fetched:', fetchedOrders);
        
        // Transform the API response to match our Order interface
        const transformedOrders = await Promise.all(fetchedOrders.map(async (order) => {
          // Parse the date using our utility function
          const createdDate = parseCustomDate(order.created_at);
          const formattedDate = formatDate(createdDate);
          
          // Format the delivery date (if available)
          let formattedDeliveryDate = 'Pending';
          if (order.delivered_at) {
            const deliveryDate = parseCustomDate(order.delivered_at);
            if (deliveryDate) {
              formattedDeliveryDate = formatDate(deliveryDate);
            }
          }
          
          // Instead of fetching order items for every order, use the order summary data if available
          let itemsCount = order.items_count || 0;
          let totalAmount = order.total_amount || 0;
          
          // Only fetch order items for very recent orders (last 24 hours) to reduce API load
          const orderDate = parseCustomDate(order.created_at);
          const oneDayAgo = new Date();
          oneDayAgo.setDate(oneDayAgo.getDate() - 1);
          
          // Only fetch details for recent orders (within last 24 hours)
          if (orderDate && orderDate > oneDayAgo) {
            try {
              // Fetch order items with the order date to prevent unnecessary API calls
              const orderItems = await orderApi.getOrderItems(order.order_id, order.created_at);
              itemsCount = orderItems.length;
              
              // Calculate total amount
              totalAmount = orderItems.reduce((sum, item) => {
                const itemPrice = item.unit_price || 0;
                const itemQuantity = item.quantity || 0;
                return sum + (itemPrice * itemQuantity);
              }, 0);
              
              console.log(`Order ${order.order_number} has ${itemsCount} items and total amount ${totalAmount}`);
            } catch (err) {
              console.error(`Failed to fetch items for order ${order.order_id}:`, err);
            }
          } else {
            console.log(`Skipping item fetch for older order ${order.order_number} to reduce API load`);
          }
          
          return {
            id: order.order_id,
            uuid: order.order_id,
            orderNumber: order.order_number,
            date: formattedDate,
            status: order.status,
            estimatedDelivery: formattedDeliveryDate,
            items: itemsCount,
            totalAmount: totalAmount,
            supplier: (order as any).supplier_name || 'Unknown Supplier'
          };
        }));
        
        setOrders(transformedOrders);
      } catch (error) {
        console.error('Failed to fetch recent orders:', error);
        setError('Failed to load recent orders');
        // Set empty array to show the empty state
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrders();
  }, []);
  
  const handleNewOrder = () => {
    navigate('/products');
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'order placed':
      case 'in progress':
        return <Clock size={14} className="text-farmaze-orange" />;
      case 'dispatched':
        return <Truck size={14} className="text-blue-600" />;
      case 'delivered':
        return <Check size={14} className="text-green-600" />;
      case 'canceled':
      case 'cancelled':
        return <X size={14} className="text-red-600" />;
      default:
        return <Package size={14} />;
    }
  };

  if (isLoading) {
    return (
      <div className="mb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-farmaze-brown">Recent Orders</h2>
        </div>
        
        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 size={48} className="text-farmaze-orange animate-spin mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">Loading recent orders...</h3>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="mb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-farmaze-brown">Recent Orders</h2>
        </div>
        
        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-8">
              <X size={48} className="text-red-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">Error loading orders</h3>
              <p className="text-gray-500 mb-6 text-center">{error}</p>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()} 
                className="flex items-center gap-2"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (orders.length === 0) {
    return (
      <div className="mb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-farmaze-brown">Recent Orders</h2>
        </div>
        
        <Card className="bg-white shadow-md border-0">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center py-8">
              <Package size={48} className="text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">No recent orders</h3>
              <p className="text-gray-500 mb-6 text-center">You don't have any recent orders. Place a new order to see it here.</p>
              <Button 
                variant="farmaze" 
                onClick={handleNewOrder} 
                className="flex items-center gap-2"
              >
                <Plus size={16} />
                Place New Order
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="mb-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-farmaze-brown">Recent Orders</h2>
        <Link to="/orders" className="text-farmaze-orange hover:text-farmaze-orange/80 flex items-center gap-1">
          View All <ArrowRight size={16} />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {orders.slice(0, 3).map(order => (
          <Card key={order.id} className="bg-white shadow-md border-0 hover:shadow-lg transition-all hover:-translate-y-1 duration-300">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base font-semibold text-farmaze-brown">Order #{order.orderNumber || order.id}</CardTitle>
                <Badge 
                  variant="outline" 
                  className={`
                    ${order.status === 'Order Placed' ? 'border-farmaze-orange/30 bg-farmaze-orange/10 text-farmaze-orange' : ''}
                    ${order.status === 'Dispatched' ? 'border-blue-300 bg-blue-50 text-blue-600' : ''}
                    ${order.status === 'Delivered' ? 'border-green-300 bg-green-50 text-green-600' : ''}
                    ${order.status === 'Canceled' || order.status === 'Cancelled' ? 'border-red-300 bg-red-50 text-red-600' : ''}
                    ${order.status === 'In Progress' ? 'border-farmaze-orange/30 bg-farmaze-orange/10 text-farmaze-orange' : ''}
                    flex items-center gap-1
                  `}
                >
                  {getStatusIcon(order.status)}
                  {order.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Date:</span>
                  <span className="font-medium">{order.date}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Items:</span>
                  <span className="font-medium">{order.items} items</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total:</span>
                  <span className="font-medium">₹{order.totalAmount.toFixed(1)}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Calendar size={14} className="text-gray-500 mr-1" />
                  <span className="text-gray-500 mr-2">Estimated delivery:</span>
                  <span className="font-medium">{order.estimatedDelivery}</span>
                </div>
              </div>
              <Link to={`/order/${order.uuid || order.id}`}>
                <Button 
                  variant="default" 
                  className="w-full mt-2 bg-farmaze-orange hover:bg-farmaze-orange/90"
                >
                  View Details
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default OrdersInProgress;
