/**
 * SparklineKPICard — KPI card with an embedded 7-day sparkline.
 */
import { TrendingUp, TrendingDown } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

interface SparklineKPICardProps {
  label: string;
  value: string;
  change?: number | null;
  icon: React.ElementType;
  sparklineData?: { value: number }[];
  index?: number;
}

export default function SparklineKPICard({ label, value, change, icon: Icon, sparklineData, index = 0 }: SparklineKPICardProps) {
  const isPositive = (change ?? 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4, ease: "easeOut" }}
      className="stat-card"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="dashboard-label">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="dashboard-stat font-rubik tabular-nums">{value}</div>
      <div className="flex items-center justify-between mt-2">
        {change != null ? (
          <div className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
            isPositive ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
          }`}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(change).toFixed(1)}%
          </div>
        ) : <div />}
        {sparklineData && sparklineData.length > 1 && (
          <div className="w-16 h-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <defs>
                  <linearGradient id={`spark-${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#B8672B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#B8672B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="value" stroke="#B8672B" strokeWidth={1.5} fill={`url(#spark-${index})`} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </motion.div>
  );
}
