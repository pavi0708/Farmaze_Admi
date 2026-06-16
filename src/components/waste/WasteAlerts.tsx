import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

export interface WasteAlert {
  id: string;
  productName: string;
  orderedQty: number;
  averageQty: number;
  unit: string;
  deviationPercent: number;
  wasteCost: number;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  sparklineData: { value: number }[];
}

interface WasteAlertsProps {
  alerts: WasteAlert[];
}

const severityConfig: Record<string, { badge: string; bg: string; border: string }> = {
  HIGH: {
    badge: 'bg-red-100 text-red-700 border-red-200',
    bg: 'bg-red-50/40',
    border: 'border-l-red-500',
  },
  MEDIUM: {
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    bg: 'bg-amber-50/40',
    border: 'border-l-amber-500',
  },
  LOW: {
    badge: 'bg-gray-100 text-gray-600 border-gray-200',
    bg: 'bg-gray-50/40',
    border: 'border-l-gray-400',
  },
};

const MiniSparkline: React.FC<{ data: { value: number }[]; severity: string }> = ({ data, severity }) => {
  const color = severity === 'HIGH' ? '#ef4444' : severity === 'MEDIUM' ? '#f59e0b' : '#9ca3af';
  return (
    <ResponsiveContainer width={80} height={32}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

const WasteAlerts: React.FC<WasteAlertsProps> = ({ alerts }) => {
  if (alerts.length === 0) {
    return (
      <div className="card-modern flex flex-col items-center justify-center py-12 text-center">
        <div className="p-4 rounded-full bg-green-50 mb-4">
          <CheckCircle className="h-10 w-10 text-farmaze-green" />
        </div>
        <h3 className="text-lg font-medium font-playfair text-foreground mb-1">All Clear</h3>
        <p className="text-sm text-muted-foreground font-rubik">
          No over-ordering alerts for this period
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const config = severityConfig[alert.severity];
        return (
          <div
            key={alert.id}
            className={`card-modern border-l-4 ${config.border} ${config.bg} flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 p-4`}
          >
            {/* Severity + Product */}
            <div className="flex items-center gap-3 sm:flex-1 min-w-0">
              <Badge className={`rounded-full px-3 py-1 text-xs font-semibold uppercase border ${config.badge} shrink-0`}>
                {alert.severity}
              </Badge>
              <div className="min-w-0">
                <span className="text-sm font-medium text-foreground font-rubik block truncate">
                  {alert.productName}
                </span>
                <span className="text-xs text-muted-foreground font-rubik">
                  Ordered {alert.orderedQty} {alert.unit} vs avg {alert.averageQty} {alert.unit}
                </span>
              </div>
            </div>

            {/* Deviation + Cost */}
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="text-center">
                <span className="text-xs text-muted-foreground font-rubik block">Deviation</span>
                <span className="text-sm font-semibold text-red-600 font-rubik">
                  +{alert.deviationPercent}%
                </span>
              </div>
              <div className="text-center">
                <span className="text-xs text-muted-foreground font-rubik block">Waste Cost</span>
                <span className="text-sm font-semibold text-foreground font-rubik">
                  ₹{(alert.wasteCost || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="hidden sm:block">
                <MiniSparkline data={alert.sparklineData} severity={alert.severity} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WasteAlerts;
