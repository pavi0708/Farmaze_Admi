import React from 'react';
import { CheckCircle, Clock, Eye, Wrench, XCircle } from 'lucide-react';
import { ComplaintStatus, STATUS_LABELS } from '@/api/complaintApi';

interface TimelineEntry {
  status: ComplaintStatus;
  timestamp: string;
  note?: string;
}

interface ComplaintTimelineProps {
  history: TimelineEntry[];
  currentStatus: ComplaintStatus;
}

const STATUS_ICONS: Record<ComplaintStatus, React.ElementType> = {
  submitted: Clock,
  under_review: Eye,
  in_progress: Wrench,
  resolved: CheckCircle,
  closed: XCircle,
};

const ALL_STATUSES: ComplaintStatus[] = [
  'submitted',
  'under_review',
  'in_progress',
  'resolved',
];

const formatTimestamp = (ts: string): string => {
  const date = new Date(ts);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const ComplaintTimeline: React.FC<ComplaintTimelineProps> = ({ history, currentStatus }) => {
  const completedStatuses = new Set(history.map(h => h.status));
  const historyMap = new Map(history.map(h => [h.status, h]));

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700">Status Timeline</h3>
      <div className="flex items-center justify-between gap-2">
        {ALL_STATUSES.map((status, index) => {
          const isCompleted = completedStatuses.has(status);
          const isCurrent = status === currentStatus;
          const Icon = STATUS_ICONS[status];
          const entry = historyMap.get(status);
          const isLast = index === ALL_STATUSES.length - 1;

          return (
            <React.Fragment key={status}>
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className={`
                    w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all
                    ${isCompleted
                      ? 'bg-farmaze-orange border-farmaze-orange text-white shadow-md'
                      : isCurrent
                        ? 'bg-farmaze-orange/10 border-farmaze-orange text-farmaze-orange'
                        : 'bg-white border-gray-300 text-gray-400'
                    }
                  `}
                >
                  <Icon size={16} />
                </div>
                <p className={`text-xs font-medium mt-1.5 text-center max-w-[80px] ${isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'}`}>
                  {STATUS_LABELS[status]}
                </p>
                {entry && (
                  <p className="text-[10px] text-gray-500 mt-0.5 text-center">
                    {formatTimestamp(entry.timestamp)}
                  </p>
                )}
              </div>

              {/* Connector line */}
              {!isLast && (
                <div className="flex-1 h-0.5 mb-8">
                  <div
                    className={`h-full rounded transition-all ${
                      completedStatuses.has(ALL_STATUSES[index + 1])
                        ? 'bg-farmaze-orange'
                        : 'bg-gray-200'
                    }`}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default ComplaintTimeline;
