import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import ComplaintStatusBadge from '@/components/complaints/ComplaintStatusBadge';
import ComplaintTimeline from '@/components/complaints/ComplaintTimeline';
import complaintApi, { CATEGORY_LABELS } from '@/api/complaintApi';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const ComplaintDetail: React.FC = () => {
  const { complaintId } = useParams<{ complaintId: string }>();
  const navigate = useNavigate();
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const { data: complaint, isLoading, isError } = useQuery({
    queryKey: ['complaint', complaintId],
    queryFn: () => complaintApi.getComplaintById(complaintId!),
    enabled: !!complaintId,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-2xl space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !complaint) {
    return (
      <div className="container mx-auto py-16 px-4 max-w-2xl text-center">
        <p className="text-lg font-playfair font-semibold text-foreground mb-2">Complaint not found</p>
        <button
          onClick={() => navigate('/support')}
          className="text-sm text-primary hover:underline font-rubik"
        >
          ← Back to Support
        </button>
      </div>
    );
  }

  const isResolved = complaint.status === 'resolved' || complaint.status === 'closed';

  return (
    <div className="container mx-auto py-6 px-4 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
        {/* Back */}
        <button
          onClick={() => navigate('/support')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground font-rubik"
        >
          <ArrowLeft size={16} />
          Back to Support
        </button>

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold font-playfair text-foreground">
            #{complaint.complaint_number}
          </h1>
          <ComplaintStatusBadge status={complaint.status} />
        </div>

        {/* Timeline */}
        <Card className="rounded-xl border-border">
          <CardContent className="p-5">
            <ComplaintTimeline history={complaint.status_history} currentStatus={complaint.status} />
          </CardContent>
        </Card>

        {/* Details */}
        <Card className="rounded-xl border-border">
          <CardContent className="p-5 space-y-4">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Category</p>
              <p className="text-sm font-medium text-foreground">{CATEGORY_LABELS[complaint.category]}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Order</p>
              <Link
                to={`/order/${complaint.order_id}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                Order #{complaint.order_number}
              </Link>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Filed on</p>
              <p className="text-sm text-foreground">{formatDate(complaint.created_at)}</p>
            </div>
            {complaint.description && (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Description</p>
                <p className="text-sm text-foreground">{complaint.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Affected Items */}
        {complaint.items.length > 0 && (
          <Card className="rounded-xl border-border">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground mb-3 font-medium">Affected Items</p>
              <div className="space-y-2">
                {complaint.items.map(item => (
                  <div
                    key={item.order_detail_id}
                    className="flex items-center justify-between py-1.5 text-sm"
                  >
                    <span className="text-foreground font-medium">{item.product_name}</span>
                    <span className="text-muted-foreground">
                      {item.quantity_ordered} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Photos */}
        {complaint.images.length > 0 && (
          <Card className="rounded-xl border-border">
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground mb-3 font-medium">Photos</p>
              <div className="grid grid-cols-3 gap-2">
                {complaint.images.map(img => (
                  <button
                    key={img.id}
                    onClick={() => setLightboxUrl(img.image_url)}
                    className="w-24 h-24 rounded-lg overflow-hidden border border-border hover:ring-2 hover:ring-primary/30 transition-all"
                  >
                    <img src={img.image_url} alt={img.file_name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resolution */}
        {isResolved && complaint.resolution_notes && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
            <p className="text-sm text-green-800 font-medium">{complaint.resolution_notes}</p>
            <div className="flex gap-3 text-xs text-green-700">
              {complaint.resolved_at && <span>Resolved on {formatDate(complaint.resolved_at)}</span>}
              {complaint.resolved_by && <span>by {complaint.resolved_by}</span>}
            </div>
          </div>
        )}

        {/* Lightbox */}
        <Dialog open={!!lightboxUrl} onOpenChange={() => setLightboxUrl(null)}>
          <DialogContent className="max-w-lg p-2">
            <DialogTitle className="sr-only">Photo preview</DialogTitle>
            {lightboxUrl && (
              <img src={lightboxUrl} alt="Complaint photo" className="w-full rounded-lg" />
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
};

export default ComplaintDetail;
