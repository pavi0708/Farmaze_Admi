import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
  Cell,
} from 'recharts';

export interface MonthlyWasteCost {
  month: string;
  cost: number;
}

interface WasteCostTrendChartProps {
  data: MonthlyWasteCost[];
}

const getBarColor = (cost: number, max: number): string => {
  const ratio = cost / max;
  if (ratio > 0.75) return '#ef4444'; // red
  if (ratio > 0.5) return '#f97316'; // orange
  if (ratio > 0.25) return '#eab308'; // yellow
  return '#16A34A'; // green
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-white p-3 shadow-lg border border-gray-100 font-rubik">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-sm font-semibold text-foreground">
        ₹{(payload[0].value || 0).toLocaleString('en-IN')}
      </p>
    </div>
  );
};

const WasteCostTrendChart: React.FC<WasteCostTrendChartProps> = ({ data }) => {
  const maxCost = Math.max(...data.map((d) => d.cost));

  return (
    <div className="card-modern">
      <h3 className="text-lg font-medium font-playfair text-foreground mb-4">
        Waste Cost Trend
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fontFamily: 'Rubik', fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fontFamily: 'Rubik', fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="cost" radius={[6, 6, 0, 0]} barSize={36}>
              {data.map((entry, index) => (
                <Cell key={index} fill={getBarColor(entry.cost, maxCost)} />
              ))}
            </Bar>
            <Line
              type="monotone"
              dataKey="cost"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WasteCostTrendChart;
