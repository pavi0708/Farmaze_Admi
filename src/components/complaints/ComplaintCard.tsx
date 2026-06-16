import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Camera } from 'lucide-react';
import ComplaintStatusBadge from './ComplaintStatusBadge';
import { ComplaintSummary, CATEGORY_LABELS } from '@/api/complaintApi';

interface ComplaintCardProps {
  complaint: ComplaintSummary;
}

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const ComplaintCard: React.FC<ComplaintCardProps> = ({ complaint }) => {
  const navigate = useNavigate();

  const itemNames = complaint.items.map(i => i.product_name).join(', ');

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow duration-200 border"
      onClick={() => navigate(`/complaints/${complaint.complaint_id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-gray-900">
                #{complaint.complaint_number}
              </span>
              <span className="text-sm text-gray-500">&middot;</span>
              <span className="text-sm text-gray-700">
                {CATEGORY_LABELS[complaint.category]}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-2">
              Order #{complaint.order_number} &middot; {formatDate(complaint.created_at)}
            </p>
            <p className="text-sm text-gray-600 truncate">
              {itemNames && <span>{itemNames}</span>}
              {complaint.images_count > 0 && (
                <span className="inline-flex items-center gap-1 ml-2 text-gray-400">
                  <Camera size={12} />
                  {complaint.images_count} photo{complaint.images_count > 1 ? 's' : ''}
                </span>
              )}
              {complaint.resolution_notes && (
                <span className="text-green-700 font-medium ml-2">{complaint.resolution_notes}</span>
              )}
            </p>
          </div>
          <ComplaintStatusBadge status={complaint.status} />
        </div>
      </CardContent>
    </Card>
  );
};

export default ComplaintCard;
