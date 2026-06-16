
import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card } from "@/components/ui/card";

interface MonthlyData {
  month: string;
  value: number;
  trend: number;
}

interface MonthlyDetailViewProps {
  data: MonthlyData[];
  activeView: "consumption" | "expenses";
}

const MonthlyDetailView: React.FC<MonthlyDetailViewProps> = ({ data, activeView }) => {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-6 text-[#3a2e2e]">
        Monthly {activeView === "consumption" ? "Consumption" : "Cost"} Trends
      </h2>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip
              formatter={(value) => [
                `${value} ${activeView === "consumption" ? "kg" : "$"}`,
                "Amount"
              ]}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={activeView === "consumption" ? "#F16870" : "#3498db"} 
              name={activeView === "consumption" ? "Actual Consumption" : "Actual Cost"}
              activeDot={{ r: 8 }}
            />
            <Line 
              type="monotone" 
              dataKey="trend" 
              stroke="#8884d8" 
              strokeDasharray="5 5" 
              name="Trend Line" 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Average</h3>
          <p className="text-2xl font-bold text-[#3a2e2e]">
            {Math.round(data.reduce((acc, curr) => acc + curr.value, 0) / data.length)}
            <span className="text-sm font-normal text-gray-500 ml-1">
              {activeView === "consumption" ? "kg" : "$"}
            </span>
          </p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Highest</h3>
          <p className="text-2xl font-bold text-[#3a2e2e]">
            {Math.max(...data.map(item => item.value))}
            <span className="text-sm font-normal text-gray-500 ml-1">
              {activeView === "consumption" ? "kg" : "$"}
            </span>
          </p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Growth</h3>
          <p className="text-2xl font-bold text-[#3a2e2e]">
            {data.length > 1 
              ? Math.round(((data[data.length - 1].value - data[0].value) / data[0].value) * 100) 
              : 0}
            <span className="text-sm font-normal text-gray-500 ml-1">%</span>
          </p>
        </div>
      </div>
    </Card>
  );
};

export default MonthlyDetailView;
