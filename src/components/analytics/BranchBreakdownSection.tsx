import React, { useState, useEffect, useMemo } from "react";
import { Loader2, Building2, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";
import analyticsApi from "@/api/analyticsApi";
import { spendAnalyticsApi } from "@/api/spendAnalyticsApi";
import { DashboardFilters } from "@/components/analytics/DashboardFilters";
import { BRANCH_PALETTE } from "@/constants/chartColors";
import CHART_COLORS from "@/constants/chartColors";

interface BranchKPI { branch_id: string; branch_name: string; total_spend: number; order_count: number; avg_order_value: number; total_volume: number; }
interface BranchTrendPoint { period: string; total_spend: number; branch_id: string; branch_name: string; }
interface BranchBreakdownSectionProps { filters: DashboardFilters; }

export default function BranchBreakdownSection({ filters }: BranchBreakdownSectionProps) {
  const [branchKPIs, setBranchKPIs] = useState<BranchKPI[]>([]);
  const [branchTrends, setBranchTrends] = useState<BranchTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBranchData = async () => {
      try {
        setLoading(true); setError(null);
        const comparisonMode = filters.comparison === "none" ? "none" : "previous_period";
        const [overviewData, trendsData] = await Promise.all([
          analyticsApi.getOverview(filters.timePeriod, comparisonMode, filters.startDate, filters.endDate, undefined, true),
          spendAnalyticsApi.getSpendTrends({ timePeriod: filters.timePeriod, granularity: "daily", startDate: filters.startDate, endDate: filters.endDate, groupByBranch: true })
        ]);
        if (overviewData?.branches) setBranchKPIs(overviewData.branches);
        if (trendsData) setBranchTrends(trendsData as unknown as BranchTrendPoint[]);
      } catch { setError("Failed to load branch breakdown data."); } finally { setLoading(false); }
    };
    fetchBranchData();
  }, [filters.timePeriod, filters.comparison, filters.startDate, filters.endDate]);

  const barChartData = useMemo(() => [...branchKPIs].sort((a, b) => b.total_spend - a.total_spend).map((b, i) => ({ name: b.branch_name, spend: b.total_spend, color: BRANCH_PALETTE[i % BRANCH_PALETTE.length] })), [branchKPIs]);

  const { lineChartData, topBranches } = useMemo(() => {
    if (!branchTrends.length) return { lineChartData: [], topBranches: [] };
    const spendByBranch: Record<string, { total: number; name: string }> = {};
    for (const point of branchTrends) {
      if (!point.branch_id) continue;
      if (!spendByBranch[point.branch_id]) spendByBranch[point.branch_id] = { total: 0, name: point.branch_name };
      spendByBranch[point.branch_id].total += point.total_spend;
    }
    const sorted = Object.entries(spendByBranch).sort(([, a], [, b]) => b.total - a.total).slice(0, 3);
    const topBranchIds = new Set(sorted.map(([id]) => id));
    const topBranchNames = sorted.map(([id, info], i) => ({ id, name: info.name, color: BRANCH_PALETTE[i % BRANCH_PALETTE.length] }));
    const dateMap: Record<string, Record<string, number>> = {};
    for (const point of branchTrends) {
      if (!point.branch_id || !topBranchIds.has(point.branch_id)) continue;
      const dateKey = point.period.slice(0, 10);
      if (!dateMap[dateKey]) dateMap[dateKey] = {};
      dateMap[dateKey][point.branch_name] = (dateMap[dateKey][point.branch_name] || 0) + point.total_spend;
    }
    const data = Object.entries(dateMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, branches]) => ({ date: new Date(date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }), ...branches }));
    return { lineChartData: data, topBranches: topBranchNames };
  }, [branchTrends]);

  const { highestBranch, lowestBranch } = useMemo(() => {
    if (branchKPIs.length < 2) return { highestBranch: null, lowestBranch: null };
    const sorted = [...branchKPIs].sort((a, b) => b.total_spend - a.total_spend);
    return { highestBranch: sorted[0], lowestBranch: sorted[sorted.length - 1] };
  }, [branchKPIs]);

  if (loading) return <div className="dashboard-card flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-primary mr-2" /><span className="text-sm text-muted-foreground">Loading branch breakdown...</span></div>;
  if (error) return <div className="dashboard-card py-8 text-center text-destructive text-sm">{error}</div>;
  if (branchKPIs.length < 2) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-primary" />
        <h2 className="font-rubik text-lg font-semibold text-foreground">Branch Comparison</h2>
        <span className="text-sm text-muted-foreground">({branchKPIs.length} branches)</span>
      </div>

      {/* Branch KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {branchKPIs.sort((a, b) => b.total_spend - a.total_spend).map((branch) => {
          const isHighest = highestBranch?.branch_id === branch.branch_id;
          const isLowest = lowestBranch?.branch_id === branch.branch_id;
          return (
            <div key={branch.branch_id} className={`stat-card ${isHighest ? 'ring-1 ring-primary/30' : ''} ${isLowest ? 'ring-1 ring-secondary/30' : ''}`}>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-sm font-medium text-foreground">{branch.branch_name}</span>
                {isHighest && <TrendingUp className="h-3.5 w-3.5 text-primary" />}
                {isLowest && <TrendingDown className="h-3.5 w-3.5 text-secondary" />}
              </div>
              <div className="text-xl font-bold tabular-nums">{formatCurrency(branch.total_spend)}</div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{branch.order_count} orders</span>
                <span>AOV {formatCurrency(branch.avg_order_value)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="dashboard-card">
          <h4 className="font-rubik text-sm font-medium text-foreground mb-4">Spend by Branch</h4>
          {barChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={barChartData.length * 48 + 40}>
              <BarChart data={barChartData} layout="vertical" margin={{ left: 10, right: 30, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={CHART_COLORS.grid} />
                <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} fontSize={11} stroke={CHART_COLORS.axis} />
                <YAxis dataKey="name" type="category" width={120} fontSize={12} tick={{ fill: CHART_COLORS.axisLabel }} />
                <Tooltip formatter={(value: number) => [formatCurrency(value), "Spend"]} />
                <Bar dataKey="spend" radius={[0, 4, 4, 0]} barSize={24}>
                  {barChartData.map((entry) => (<Cell key={entry.name} fill={entry.color} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="text-center text-muted-foreground py-8 text-sm">No data</div>}
        </div>

        <div className="dashboard-card">
          <h4 className="font-rubik text-sm font-medium text-foreground mb-4">Spend Trends — Top {topBranches.length} Branches</h4>
          {lineChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={lineChartData} margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis dataKey="date" fontSize={11} stroke={CHART_COLORS.axis} />
                <YAxis tickFormatter={(v) => formatCurrency(v)} fontSize={11} stroke={CHART_COLORS.axis} />
                <Tooltip formatter={(value: number, name: string) => [formatCurrency(value), name]} />
                <Legend />
                {topBranches.map((branch) => (<Line key={branch.id} type="monotone" dataKey={branch.name} stroke={branch.color} strokeWidth={2} dot={false} connectNulls />))}
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="text-center text-muted-foreground py-8 text-sm">No trend data</div>}
        </div>
      </div>
    </div>
  );
}
