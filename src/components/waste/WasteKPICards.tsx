import React from 'react';
import { TrendingDown, AlertTriangle, Package, ArrowDown } from 'lucide-react';

interface WasteKPI {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  trend?: { direction: 'up' | 'down'; percentage: number };
  variant: 'destructive' | 'warning' | 'info' | 'positive';
}

interface WasteKPICardsProps {
  wasteCost: number;
  overOrderedCount: number;
  productsAtRisk: number;
  wasteTrend: { direction: 'up' | 'down'; percentage: number };
  period: string;
}

const WasteKPICards: React.FC<WasteKPICardsProps> = ({
  wasteCost,
  overOrderedCount,
  productsAtRisk,
  wasteTrend,
}) => {
  const safeTrend = wasteTrend || { direction: 'down' as const, percentage: 0 };

  const kpis: WasteKPI[] = [
    {
      title: 'Potential Waste Cost',
      value: `₹${(wasteCost || 0).toLocaleString('en-IN')}`,
      subtitle: 'this month',
      icon: <TrendingDown className="h-5 w-5" />,
      variant: 'destructive',
    },
    {
      title: 'Over-ordered Events',
      value: (overOrderedCount || 0).toString(),
      subtitle: 'occurrences',
      icon: <AlertTriangle className="h-5 w-5" />,
      variant: 'warning',
    },
    {
      title: 'Products at Risk',
      value: (productsAtRisk || 0).toString(),
      subtitle: 'flagged',
      icon: <Package className="h-5 w-5" />,
      variant: 'info',
    },
    {
      title: 'Waste Trend',
      value: `${safeTrend.percentage}%`,
      subtitle: safeTrend.direction === 'down' ? 'improving' : 'worsening',
      icon: <ArrowDown className={`h-5 w-5 transition-transform ${safeTrend.direction === 'up' ? 'rotate-180' : ''}`} />,
      trend: safeTrend,
      variant: safeTrend.direction === 'down' ? 'positive' : 'destructive',
    },
  ];

  const variantStyles: Record<string, { iconBg: string; iconColor: string; valueColor: string }> = {
    destructive: {
      iconBg: 'bg-red-50',
      iconColor: 'text-red-600',
      valueColor: 'text-red-600',
    },
    warning: {
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      valueColor: 'text-amber-700',
    },
    info: {
      iconBg: 'bg-blue-50',
      iconColor: 'text-primary',
      valueColor: 'text-primary',
    },
    positive: {
      iconBg: 'bg-green-50',
      iconColor: 'text-farmaze-green',
      valueColor: 'text-farmaze-green',
    },
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const style = variantStyles[kpi.variant];
        return (
          <div key={kpi.title} className="stat-card">
            <div className="flex items-start justify-between mb-3">
              <span className="dashboard-label font-rubik">{kpi.title}</span>
              <div className={`p-2 rounded-lg ${style.iconBg} ${style.iconColor}`}>
                {kpi.icon}
              </div>
            </div>
            <div className={`text-3xl font-semibold font-rubik mb-1 ${style.valueColor}`}>
              {kpi.value}
            </div>
            <span className="text-sm text-muted-foreground font-rubik">{kpi.subtitle}</span>
          </div>
        );
      })}
    </div>
  );
};

export default WasteKPICards;
