import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { parseCustomDate, formatDate, formatTime } from '@/utils/dateUtils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Check,
  ArrowRight,
  ShoppingBag,
  Loader2,
  Building2,
  User,
  Package,
  ClipboardList,
  Truck,
  CircleDot,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import orderApi, { type OrderSummary, type OrderDetail } from '@/api/orderApi';

const ITEMS_PREVIEW_COUNT = 5;

const OrderSuccess = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [items, setItems] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllItems, setShowAllItems] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        const [orderData, orderItems] = await Promise.all([
          orderApi.getOrderById(orderId),
          orderApi.getOrderItems(orderId, undefined, true),
        ]);
        setOrder(orderData);
        setItems(orderItems);
      } catch (err) {
        console.error('Failed to fetch order details:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchOrder, 400);
    return () => clearTimeout(timer);
  }, [orderId]);

  const createdDate = order?.created_at ? parseCustomDate(order.created_at) : null;
  const formattedDate = createdDate ? formatDate(createdDate) : null;
  const formattedTime = createdDate ? formatTime(createdDate) : null;

  const visibleItems = showAllItems ? items : items.slice(0, ITEMS_PREVIEW_COUNT);
  const hasMoreItems = items.length > ITEMS_PREVIEW_COUNT;

  return (
    <div className="flex items-start justify-center pt-6 sm:pt-10 px-4 pb-8">
      <div className="w-full max-w-md">

        {/* ── Hero: Checkmark + Thank You ── */}
        <div className="text-center mb-5">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 ring-4 ring-green-50">
            <Check className="h-6 w-6 text-green-600" strokeWidth={3} />
          </div>
          <h1 className="text-xl font-bold font-playfair text-foreground">
            Thank you for your order!
          </h1>
          <p className="mt-1 text-sm text-muted-foreground font-rubik">
            Your order has been placed successfully
          </p>
        </div>

        {/* ── Confirmation Card ── */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">

          {/* Order number banner */}
          <div className="bg-green-50 border-b border-green-100 px-4 py-2.5 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-green-700 font-rubik font-medium uppercase tracking-wide">
                Order Confirmation
              </p>
              {order?.order_number ? (
                <p className="text-base font-bold font-rubik text-green-900">
                  #{order.order_number}
                </p>
              ) : loading ? (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Loader2 className="h-3 w-3 animate-spin text-green-600" />
                  <span className="text-xs text-green-700 font-rubik">Loading...</span>
                </div>
              ) : null}
            </div>
            {order?.status && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/80 text-[11px] font-medium font-rubik text-green-800 border border-green-200">
                <CircleDot className="h-2.5 w-2.5" />
                {order.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </span>
            )}
          </div>

          {/* Order meta */}
          <div className="px-4 py-3 space-y-3">

            {/* Client + Branch + Date in a compact row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-rubik text-muted-foreground">
              {order?.client_name && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {order.client_name}
                </span>
              )}
              {order?.branch_name && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {order.branch_name}
                </span>
              )}
              {formattedDate && (
                <span>{formattedDate}</span>
              )}
              {formattedTime && (
                <span>{formattedTime}</span>
              )}
            </div>

            <Separator />

            {/* Items receipt */}
            {loading ? (
              <div className="flex items-center justify-center py-4 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm font-rubik">Loading items...</span>
              </div>
            ) : items.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] text-muted-foreground font-rubik font-medium uppercase tracking-wide">
                    Order Items
                  </p>
                  <span className="text-[11px] font-rubik text-muted-foreground">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <div className="rounded-lg border divide-y">
                  {visibleItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-2.5 py-1.5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[11px] text-muted-foreground font-rubik w-5 shrink-0 text-right">
                          {(showAllItems ? index : index) + 1}.
                        </span>
                        <span className="text-[13px] font-rubik text-foreground truncate">
                          {item.product_name}
                        </span>
                      </div>
                      <span className="text-[13px] font-semibold font-rubik text-foreground whitespace-nowrap ml-3">
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                  ))}
                </div>
                {hasMoreItems && (
                  <button
                    onClick={() => setShowAllItems(!showAllItems)}
                    className="mt-1.5 w-full flex items-center justify-center gap-1 text-xs font-rubik text-primary hover:text-primary/80 py-1"
                  >
                    {showAllItems ? (
                      <>Show less <ChevronUp className="h-3 w-3" /></>
                    ) : (
                      <>Show all {items.length} items <ChevronDown className="h-3 w-3" /></>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground font-rubik text-center py-3">
                Order submitted — items will appear shortly.
              </p>
            )}

            <Separator />

            {/* What happens next — compact inline */}
            <div className="flex items-center gap-3 text-[11px] font-rubik text-muted-foreground">
              <span className="flex items-center gap-1">
                <ClipboardList className="h-3 w-3 text-green-600" />
                Review
              </span>
              <span className="text-muted-foreground/40">&rarr;</span>
              <span className="flex items-center gap-1">
                <Package className="h-3 w-3 text-blue-600" />
                Pack
              </span>
              <span className="text-muted-foreground/40">&rarr;</span>
              <span className="flex items-center gap-1">
                <Truck className="h-3 w-3 text-purple-600" />
                Deliver
              </span>
            </div>
          </div>

          {/* Action buttons footer */}
          <div className="border-t bg-muted/30 px-4 py-3 flex gap-2">
            <Button
              size="sm"
              className="flex-1 font-rubik"
              onClick={() => navigate(`/order/${orderId}`)}
            >
              View Order
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 font-rubik"
              onClick={() => navigate('/orders')}
            >
              <ShoppingBag className="h-3.5 w-3.5 mr-1" />
              All Orders
            </Button>
          </div>
        </div>

        {/* Continue shopping link */}
        <p className="text-center mt-4">
          <button
            onClick={() => navigate('/smart-order')}
            className="text-xs font-rubik text-primary hover:underline"
          >
            Continue placing orders &rarr;
          </button>
        </p>
      </div>
    </div>
  );
};

export default OrderSuccess;
