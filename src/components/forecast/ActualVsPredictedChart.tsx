import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

export interface ActualVsPredictedPoint {
  date: string;
  actual?: number;
  predicted?: number;
  confidenceHigh?: number;
  confidenceLow?: number;
}

interface ActualVsPredictedChartProps {
  data: ActualVsPredictedPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-white p-3 shadow-md border border-gray-100 font-rubik text-sm">
      <p className="font-medium text-foreground mb-1.5">{label}</p>
      {payload.map((entry: any, idx: number) => {
        if (entry.dataKey === 'confidenceHigh' || entry.dataKey === 'confidenceLow') return null;
        return (
          <div key={idx} className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground capitalize">{entry.dataKey}:</span>
            <span className="font-medium">{entry.value?.toFixed(1)}</span>
          </div>
        );
      })}
    </div>
  );
};

const ActualVsPredictedChart: React.FC<ActualVsPredictedChartProps> = ({ data }) => {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="h-[3px] bg-gradient-to-r from-[#4A6FA5] to-[#4A6FA5]/30 -mt-6 -mx-6 mb-6 rounded-t-xl" />
      <h2 className="font-playfair text-lg font-medium text-foreground mb-1">Actual vs Predicted</h2>
      <p className="text-sm text-muted-foreground font-rubik mb-6">Last 30 days actual quantities compared with model predictions</p>

      <div className="w-full h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(217,91%,60%)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="hsl(217,91%,60%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="confidenceBand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16A34A" stopOpacity={0.08} />
                <stop offset="95%" stopColor="#16A34A" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'Rubik' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'Rubik' }}
              tickLine={false}
              axisLine={false}
              label={{ value: 'Quantity', angle: -90, position: 'insideLeft', style: { fontSize: 11, fill: '#9ca3af', fontFamily: 'Rubik' } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontFamily: 'Rubik', fontSize: 12 }}
              iconType="line"
            />
            {/* Confidence band */}
            <Area
              type="monotone"
              dataKey="confidenceHigh"
              stroke="none"
              fill="url(#confidenceBand)"
              name="Confidence Band"
              legendType="none"
            />
            <Area
              type="monotone"
              dataKey="confidenceLow"
              stroke="none"
              fill="transparent"
              name="confidenceLow"
              legendType="none"
            />
            {/* Actual line */}
            <Area
              type="monotone"
              dataKey="actual"
              stroke="hsl(217,91%,60%)"
              strokeWidth={2}
              fill="url(#actualGradient)"
              name="Actual"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2 }}
            />
            {/* Predicted line */}
            <Area
              type="monotone"
              dataKey="predicted"
              stroke="#16A34A"
              strokeWidth={2}
              strokeDasharray="6 3"
              fill="none"
              name="Predicted"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, fill: '#16A34A' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ActualVsPredictedChart;
