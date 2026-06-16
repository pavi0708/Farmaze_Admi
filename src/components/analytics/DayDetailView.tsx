
import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Define the type for the detailed day data
export interface DetailedDayData {
  name: string;
  value: number;
  variant?: string;
  grade?: string;
  origin?: string;
}

// Define the props for the component
export interface DayDetailViewProps {
  data: DetailedDayData[];
  type: "consumption" | "expenses";
  barColor?: string;
}

const DayDetailView: React.FC<DayDetailViewProps> = ({
  data,
  type,
  barColor = "#4F75BB"
}) => {
  const chartTitle = type === "consumption"
    ? "Detailed Consumption Breakdown"
    : "Detailed Expenditure Breakdown";

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-base font-medium text-gray-800">{chartTitle}</h3>
        <p className="text-sm text-gray-500">
          {type === "consumption" ? "Quantity in kg" : "Amount in ₹"}
        </p>
      </div>
      
      <div className="h-64">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500">No data available</p>
          </div>
        ) : (
          <div className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                barSize={30}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={70}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip
                  formatter={(value) =>
                    `${value} ${type === "consumption" ? "kg" : "₹"}`
                  }
                />
                <Bar
                  dataKey="value"
                  fill={barColor}
                  radius={[4, 4, 0, 0]}
                  animationDuration={1000}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default DayDetailView;
