import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ComplaintCard from '@/components/complaints/ComplaintCard';
import complaintApi, { ComplaintSummary, ComplaintStatus } from '@/api/complaintApi';
import orderApi from '@/api/orderApi';

type FilterTab = 'all' | 'open' | 'resolved' | 'closed';

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'closed', label: 'Closed' },
];

const OPEN_STATUSES: ComplaintStatus[] = ['submitted', 'under_review', 'in_progress'];

/** Parse DD/MM/YYYY HH:MM am/pm format returned by the backend */
const parseOrderDate = (dateStr: string): Date => {
  // Format: "26/02/2026 10:30 am"
  const [datePart] = dateStr.split(' ');
  const [day, month, year] = datePart.split('/');
  return new Date(Number(year), Number(month) - 1, Number(day));
};

const filterComplaints = (complaints: ComplaintSummary[], tab: FilterTab): ComplaintSummary[] => {
  if (tab === 'all') return complaints;
  if (tab === 'open') return complaints.filter(c => OPEN_STATUSES.includes(c.status));
  return complaints.filter(c => c.status === tab);
};

const Support: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ['complaints'],
    queryFn: () => complaintApi.getComplaints(),
  });

  const { data: ordersData } = useQuery({
    queryKey: ['recent-orders-for-complaint'],
    queryFn: () => orderApi.getOrders(),
  });

  const filtered = filterComplaints(complaints, activeTab);
  const recentOrders = ordersData?.orders?.slice(0, 7) ?? [];

  return (
    <div className="container mx-auto py-6 px-4 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-playfair text-foreground">Support</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Track and manage your order issues</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-primary text-primary-foreground rounded-lg px-4 py-2.5 font-medium">
                <AlertTriangle size={16} className="mr-1.5" />
                Report Issue
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 rounded-xl shadow-lg p-1">
              <p className="px-3 py-2 text-xs font-medium text-muted-foreground">Select an order</p>
              {recentOrders.length === 0 && (
                <p className="px-3 py-2 text-sm text-muted-foreground">No recent orders</p>
              )}
              {recentOrders.map(order => (
                <DropdownMenuItem
                  key={order.order_id}
                  className="cursor-pointer rounded-lg"
                  onClick={() => navigate(`/order/${order.order_id}/complaint`)}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Order #{order.order_number}</span>
                    <span className="text-xs text-muted-foreground">
                      {parseOrderDate(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 border-b border-border mb-5">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'text-primary border-primary'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Complaint List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle size={48} className="text-primary mb-3" />
            <p className="text-lg font-playfair font-semibold text-foreground">No issues reported</p>
            <p className="text-sm text-muted-foreground mt-1">
              When you report an issue with an order, it will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(c => (
              <motion.div
                key={c.complaint_id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <ComplaintCard complaint={c} />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Support;
