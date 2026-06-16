import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Eye, Wrench, CheckCircle, XCircle } from 'lucide-react';
import { ComplaintStatus, STATUS_LABELS, STATUS_COLORS } from '@/api/complaintApi';

interface ComplaintStatusBadgeProps {
  status: ComplaintStatus;
}

const STATUS_ICONS: Record<ComplaintStatus, React.ReactNode> = {
  submitted: <Clock size={12} />,
  under_review: <Eye size={12} />,
  in_progress: <Wrench size={12} />,
  resolved: <CheckCircle size={12} />,
  closed: <XCircle size={12} />,
};

const ComplaintStatusBadge: React.FC<ComplaintStatusBadgeProps> = ({ status }) => {
  return (
    <Badge variant="outline" className={`${STATUS_COLORS[status]} flex items-center gap-1`}>
      {STATUS_ICONS[status]}
      {STATUS_LABELS[status]}
    </Badge>
  );
};

export default ComplaintStatusBadge;
