/**
 * WeeklyGlanceCard — "This Week at a Glance" text summary.
 */
import { motion } from "framer-motion";

interface WeeklyGlanceCardProps {
  overviewData: any;
}

const formatINR = (value: number) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(2)}K`;
  return `₹${value.toLocaleString('en-IN')}`;
};

export default function WeeklyGlanceCard({ overviewData }: WeeklyGlanceCardProps) {
  if (!overviewData?.current_period) return null;

  const current = overviewData.current_period;
  const changes = overviewData.changes;

  const spend = formatINR(current.total_spend || 0);
  const orderCount = current.order_count || 0;
  const avgOrder = formatINR(current.avg_order_value || 0);
  const volume = current.total_volume ? `${(current.total_volume / 1000).toFixed(1)}K kg` : '0 kg';

  const biggestMover = changes?.total_spend_change
    ? `Spend ${changes.total_spend_change > 0 ? '↑' : '↓'}${Math.abs(changes.total_spend_change).toFixed(1)}% vs last period`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="card-modern"
    >
      <h4 className="font-rubik text-sm font-semibold text-foreground mb-3">This Period at a Glance</h4>
      <div className="space-y-2.5 text-sm font-rubik text-foreground/85">
        <p>You spent <span className="font-semibold text-foreground">{spend}</span> across <span className="font-semibold text-foreground">{orderCount}</span> orders</p>
        <p>Total volume: <span className="font-semibold text-foreground">{volume}</span></p>
        <p>Avg order value: <span className="font-semibold text-foreground">{avgOrder}</span></p>
        {biggestMover && (
          <p className="text-muted-foreground text-xs">{biggestMover}</p>
        )}
      </div>
    </motion.div>
  );
}
