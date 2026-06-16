import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts';

export interface WeeklyPatternData {
  day: string;
  quantity: number;
  isToday: boolean;
}

interface WeeklyPatternChartProps {
  data: WeeklyPatternData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-white p-3 shadow-md border border-gray-100 font-rubik text-sm">
      <p className="font-medium text-foreground">{label}</p>
      <p className="text-muted-foreground">Avg Quantity: <span className="font-semibold text-foreground">{payload[0].value?.toFixed(1)}</span></p>
    </div>
  );
};

const WeeklyPatternChart: React.FC<WeeklyPatternChartProps> = ({ data }) => {
  const maxDay = data.reduce((max, d) => d.quantity > max.quantity ? d : max, data[0]);
  const minDay = data.reduce((min, d) => d.quantity < min.quantity ? d : min, data[0]);

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="h-[3px] bg-gradient-to-r from-[#4A6FA5] to-[#4A6FA5]/30 -mt-6 -mx-6 mb-6 rounded-t-xl" />
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-playfair text-lg font-medium text-foreground">Weekly Ordering Pattern</h2>
        <div className="flex gap-4 text-xs font-rubik text-muted-foreground">
          {maxDay && <span>📈 Highest: <span className="font-semibold text-foreground">{maxDay.day}</span></span>}
          {minDay && <span>📉 Lowest: <span className="font-semibold text-foreground">{minDay.day}</span></span>}
        </div>
      </div>
      <p className="text-sm text-muted-foreground font-rubik mb-6">Average total quantity ordered per day of the week</p>

      <div className="w-full h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 40, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: '#9ca3af', fontFamily: 'Rubik' }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis
              type="category"
              dataKey="day"
              tick={{ fontSize: 12, fill: '#374151', fontFamily: 'Rubik', fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="quantity" radius={[0, 6, 6, 0]} barSize={24}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isToday ? '#f97316' : 'hsl(217,91%,60%)'}
                  opacity={entry.isToday ? 1 : 0.75}
                />
              ))}
              <LabelList
                dataKey="quantity"
                position="right"
                style={{ fontSize: 11, fill: '#6b7280', fontFamily: 'Rubik' }}
                formatter={(v: number) => v.toFixed(0)}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-4 mt-4 text-xs font-rubik text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
          Other days
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-farmaze-orange" />
          Today
        </span>
      </div>
    </div>
  );
};

export default WeeklyPatternChart;
