
import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";

interface WeeklyData {
  week: string;
  value: number;
  category: string;
}

interface WeeklyDetailViewProps {
  data: WeeklyData[];
  activeView: "consumption" | "expenses" | "stocks";
}

const WeeklyDetailView: React.FC<WeeklyDetailViewProps> = ({ data, activeView }) => {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-6 text-[#3a2e2e]">
        Weekly {activeView === "consumption" ? "Consumption" : activeView === "expenses" ? "Cost" : "Stock"} Analysis
      </h2>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip
              formatter={(value) => [
                `${value} ${activeView === "consumption" ? "kg" : activeView === "expenses" ? "$" : "units"}`,
                "Amount"
              ]}
            />
            <Bar
              dataKey="value"
              fill={activeView === "consumption" ? "#F16870" : activeView === "expenses" ? "#3498db" : "#27ae60"}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default WeeklyDetailView;
