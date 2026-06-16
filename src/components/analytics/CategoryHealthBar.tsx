/**
 * CategoryHealthBar — Horizontal stacked bar showing category spend percentages.
 */
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { spendAnalyticsApi, CategoryBreakdownData } from "@/api/spendAnalyticsApi";
import { formatCurrency } from "@/utils/formatters";
import { CATEGORY_PALETTE } from "@/constants/chartColors";

interface CategoryHealthBarProps {
  filters: any;
}

export default function CategoryHealthBar({ filters }: CategoryHealthBarProps) {
  const [categories, setCategories] = useState<CategoryBreakdownData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const data = await spendAnalyticsApi.getCategoryBreakdown({
          timePeriod: filters.timePeriod || '30d',
          startDate: filters.startDate,
          endDate: filters.endDate,
          branchId: filters.branchId,
        });
        setCategories(data.sort((a, b) => b.percentage - a.percentage).slice(0, 6));
      } catch {
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [filters.timePeriod, filters.startDate, filters.endDate, filters.branchId]);

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-card">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
          <span className="text-sm text-muted-foreground">Loading categories...</span>
        </div>
      </motion.div>
    );
  }

  if (categories.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      className="dashboard-card"
    >
      <h4 className="font-rubik text-sm font-semibold text-foreground mb-4">Category Breakdown</h4>

      {/* Stacked bar */}
      <div className="w-full h-6 rounded-full overflow-hidden flex">
        {categories.map((cat, i) => (
          <div
            key={cat.category_name}
            className="h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${Math.max(cat.percentage, 2)}%`,
              backgroundColor: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length],
            }}
            title={`${cat.category_name}: ${cat.percentage.toFixed(1)}%`}
          />
        ))}
      </div>

      {/* Labels */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
        {categories.slice(0, 6).map((cat, i) => (
          <div key={cat.category_name} className="flex items-center gap-2 text-sm">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length] }}
            />
            <span className="text-foreground truncate">{cat.category_name}</span>
            <span className="text-muted-foreground text-xs ml-auto tabular-nums">
              {formatCurrency(cat.category_spend)}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
