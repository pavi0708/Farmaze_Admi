import React, { useState, useEffect } from "react";
import { Download, Loader2 } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { spendAnalyticsApi, CategoryBreakdownData } from "@/api/spendAnalyticsApi";
import { exportCategoryAnalysis } from "@/utils/excelExport";
import { formatCurrency } from "@/utils/formatters";
import { calculatePreviousPeriod } from "@/utils/dateUtils";

interface CategoryAnalysisChartsProps {
  filters: any;
  onDataLoad?: (data: any) => void;
}

const WARM_PALETTE = ["#B8672B", "#D4944A", "#F0C078", "#F9DEB5", "#FFF3E0", "#F16870"];

interface CategoryChartData {
  name: string;
  spend: number;
  volume: number;
  percentage: number;
  color: string;
  changePct?: number | null;
}

export default function CategoryAnalysisCharts({ filters, onDataLoad }: CategoryAnalysisChartsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [categoryData, setCategoryData] = useState<CategoryChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        setLoading(true);
        setError(null);
        const baseParams = {
          timePeriod: filters.timePeriod || '30d',
          category: filters.category !== 'all' ? filters.category : undefined,
          productId: filters.product !== 'all' ? filters.product : undefined,
          startDate: filters.startDate, endDate: filters.endDate, branchId: filters.branchId
        };
        const showComp = filters.comparison !== "none";
        const prevPeriod = showComp ? calculatePreviousPeriod(filters.timePeriod || '30d', filters.startDate, filters.endDate) : null;

        const [response, prevResponse] = await Promise.all([
          spendAnalyticsApi.getCategoryBreakdown(baseParams),
          prevPeriod ? spendAnalyticsApi.getCategoryBreakdown({
            ...baseParams, timePeriod: 'custom', startDate: prevPeriod.start, endDate: prevPeriod.end
          }).catch(() => []) : Promise.resolve([])
        ]);

        const prevMap = new Map<string, number>();
        (prevResponse as CategoryBreakdownData[]).forEach((c) => prevMap.set(c.category_name, c.category_spend));

        const transformedData: CategoryChartData[] = response.map((item: CategoryBreakdownData, index: number) => ({
          name: item.category_name, spend: item.category_spend, volume: item.category_volume_kg,
          percentage: item.percentage, color: WARM_PALETTE[index % WARM_PALETTE.length],
          changePct: prevMap.has(item.category_name) && prevMap.get(item.category_name)! > 0
            ? ((item.category_spend - prevMap.get(item.category_name)!) / prevMap.get(item.category_name)! * 100)
            : null
        }));
        setCategoryData(transformedData);
        if (onDataLoad) onDataLoad({ categoryBreakdown: response, chartData: transformedData, filters });
      } catch {
        setError('Failed to load category data');
        setCategoryData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCategoryData();
  }, [filters]);

  const handleExport = async () => {
    try { setIsExporting(true); exportCategoryAnalysis(categoryData, filters); } catch {} finally { setIsExporting(false); }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-xl p-3 shadow-lg text-sm">
          <p className="font-medium text-foreground mb-1.5">{data.name}</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: data.color }} />
              <span className="text-muted-foreground">Spend:</span>
              <span className="font-medium tabular-nums">{formatCurrency(data.spend)}</span>
            </div>
            <p className="text-muted-foreground text-xs">{data.percentage.toFixed(1)}% of total</p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (error) {
    return (
      <div className="dashboard-card flex items-center justify-center h-64 text-destructive text-sm">{error}</div>
    );
  }

  return (
    <div className="dashboard-card h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-rubik text-base font-semibold text-foreground">Category Breakdown</h3>
        <button onClick={handleExport} disabled={isExporting} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200">
          <Download className="h-3.5 w-3.5" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2} dataKey="spend">
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="mt-4 space-y-2">
            {categoryData.map((category) => (
              <div key={category.name} className="flex justify-between items-center py-1.5 px-2 rounded-lg hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: category.color }} />
                  <span className="text-sm text-foreground">{category.name}</span>
                  <span className="text-xs text-muted-foreground">({category.percentage.toFixed(1)}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium tabular-nums">{formatCurrency(category.spend)}</span>
                  {category.changePct != null && (
                    <span className={`text-xs font-medium tabular-nums ${category.changePct >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {category.changePct >= 0 ? '+' : ''}{category.changePct.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
