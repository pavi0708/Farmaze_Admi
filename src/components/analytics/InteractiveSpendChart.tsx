import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Calendar, Table2, BarChart3 } from "lucide-react";
import { exportSpendTrends } from "@/utils/excelExport";
import { formatCurrency, formatWeight, formatCurrencyDetailed, calculateAverageOrderValue, calculateMedian } from "@/utils/formatters";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { spendAnalyticsApi, SpendTrendData } from "@/api/spendAnalyticsApi";
import { calculatePreviousPeriod } from "@/utils/dateUtils";
import { getFestivalsInRange, FestivalDate } from "@/utils/festivals";

interface ChartDataPoint {
  period: string;
  rawDate: string;
  spend: number;
  volume: number;
  previousSpend?: number;
  previousVolume?: number;
}

interface InteractiveSpendChartProps {
  filters: any;
  onDataLoad?: (data: any) => void;
}

interface MonthlySummaryRow {
  period: string;
  rawDate: string;
  totalSpend: number;
  orderCount: number;
  avgOrderValue: number;
  volumeKg: number;
  isCurrentMonth: boolean;
}

const PERIOD_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
] as const;

export default function InteractiveSpendChart({ filters, onDataLoad }: InteractiveSpendChartProps) {
  const [periodType, setPeriodType] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [viewMode, setViewMode] = useState<"chart" | "summary">("chart");
  const [isExporting, setIsExporting] = useState(false);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummaryRow[]>([]);
  const [monthlySummaryLoading, setMonthlySummaryLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSpendTrends = async () => {
      try {
        setLoading(true);
        setError(null);
        const baseParams = {
          timePeriod: filters.timePeriod || '30d', granularity: periodType,
          categories: filters.categories?.length ? filters.categories : undefined,
          category: !filters.categories && filters.category !== 'all' ? filters.category : undefined,
          productIds: filters.products?.length ? filters.products : undefined,
          productId: !filters.products && filters.product !== 'all' ? filters.product : undefined,
          startDate: filters.startDate, endDate: filters.endDate, branchId: filters.branchId
        };
        const showComp = filters.comparison !== "none";
        const prevPeriod = showComp ? calculatePreviousPeriod(filters.timePeriod || '30d', filters.startDate, filters.endDate) : null;

        const [response, prevResponse] = await Promise.all([
          spendAnalyticsApi.getSpendTrends(baseParams),
          prevPeriod ? spendAnalyticsApi.getSpendTrends({
            ...baseParams, timePeriod: 'custom', startDate: prevPeriod.start, endDate: prevPeriod.end
          }).catch(() => [] as SpendTrendData[]) : Promise.resolve([] as SpendTrendData[])
        ]);

        const formatPeriod = (date: Date) => {
          switch(periodType) {
            case 'daily': return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            case 'weekly': return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
            case 'monthly': return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            default: return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }
        };

        const transformedData: ChartDataPoint[] = response.map((item: SpendTrendData, i: number) => {
          const prev = prevResponse[i];
          return {
            period: formatPeriod(new Date(item.period)),
            rawDate: item.period,
            spend: item.total_spend,
            volume: item.total_volume_kg,
            ...(prev ? { previousSpend: prev.total_spend, previousVolume: prev.total_volume_kg } : {})
          };
        });
        setChartData(transformedData);
        if (onDataLoad) onDataLoad({ spendTrends: response, chartData: transformedData, granularity: periodType, filters });
      } catch (err) {
        console.error('Error fetching spend trends:', err);
        setError('Failed to load spend trends data');
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSpendTrends();
  }, [filters, periodType, filters.branchId]);

  useEffect(() => {
    if (viewMode !== "summary") return;
    const fetchMonthlySummary = async () => {
      try {
        setMonthlySummaryLoading(true);
        const response = await spendAnalyticsApi.getSpendTrends({
          timePeriod: filters.timePeriod || '30d', granularity: 'monthly',
          categories: filters.categories?.length ? filters.categories : undefined,
          category: !filters.categories && filters.category !== 'all' ? filters.category : undefined,
          productIds: filters.products?.length ? filters.products : undefined,
          productId: !filters.products && filters.product !== 'all' ? filters.product : undefined,
          startDate: filters.startDate, endDate: filters.endDate, branchId: filters.branchId
        });
        const now = new Date();
        const summary: MonthlySummaryRow[] = response.map((item: SpendTrendData) => {
          const date = new Date(item.period);
          return {
            period: date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
            rawDate: item.period, totalSpend: item.total_spend, orderCount: item.order_count,
            avgOrderValue: item.order_count > 0 ? item.total_spend / item.order_count : 0,
            volumeKg: item.total_volume_kg,
            isCurrentMonth: date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
          };
        });
        setMonthlySummary(summary);
      } catch { setMonthlySummary([]); } finally { setMonthlySummaryLoading(false); }
    };
    fetchMonthlySummary();
  }, [viewMode, filters, filters.branchId]);

  const handleExport = async () => {
    try { setIsExporting(true); exportSpendTrends(chartData, filters, periodType); } catch {} finally { setIsExporting(false); }
  };

  const showComparison = filters.comparison !== "none";

  const medianSpend = useMemo(() => {
    const values = chartData.map(d => d.spend).filter(v => v > 0);
    return calculateMedian(values);
  }, [chartData]);

  const festivalMarkers = useMemo(() => {
    if (chartData.length === 0 || periodType !== 'daily') return [];
    const dates = chartData.map(d => d.rawDate).filter(Boolean);
    if (dates.length === 0) return [];
    const festivals = getFestivalsInRange(dates[0], dates[dates.length - 1]);
    return festivals.map(f => {
      const label = new Date(f.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const match = chartData.find(d => d.period === label);
      return match ? { ...f, periodLabel: label } : null;
    }).filter((f): f is FestivalDate & { periodLabel: string } => f !== null);
  }, [chartData, periodType]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      const data = payload[0]?.payload;
      const hasPrev = showComparison && data?.previousSpend != null;
      const changePct = hasPrev && data.previousSpend > 0
        ? ((data.spend - data.previousSpend) / data.previousSpend * 100).toFixed(1)
        : null;
      return (
        <div className="bg-card border border-border rounded-xl p-3 shadow-lg text-sm">
          <p className="font-medium text-foreground mb-1.5">{label}</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span className="text-muted-foreground">Spend:</span>
              <span className="font-medium tabular-nums">{formatCurrency(data.spend)}</span>
              {changePct && (
                <span className={`text-xs font-medium ${Number(changePct) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {Number(changePct) >= 0 ? '+' : ''}{changePct}%
                </span>
              )}
            </div>
            {hasPrev && (
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#9CA3AF' }} />
                <span className="text-muted-foreground">Prev Spend:</span>
                <span className="font-medium tabular-nums text-muted-foreground">{formatCurrency(data.previousSpend)}</span>
              </div>
            )}
            {payload.find((p: any) => p.dataKey === 'volume') && (
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#F16870' }} />
                <span className="text-muted-foreground">Volume:</span>
                <span className="font-medium tabular-nums">{formatWeight(data.volume || 0)}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-rubik text-base font-semibold text-foreground">Spend Trend Analysis</h3>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-muted/50 rounded-lg p-0.5">
            <button onClick={() => setViewMode("chart")} className={`p-1.5 rounded-md transition-all duration-200 ${viewMode === 'chart' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              <BarChart3 className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setViewMode("summary")} className={`p-1.5 rounded-md transition-all duration-200 ${viewMode === 'summary' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              <Table2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <button onClick={handleExport} disabled={isExporting} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200">
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {viewMode === "summary" ? (
        monthlySummaryLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Loading monthly summary...</span>
          </div>
        ) : monthlySummary.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <Calendar className="h-6 w-6 mr-2 opacity-40" />
            <span className="text-sm">No monthly data available</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2.5 px-3 dashboard-label">Month</th>
                  <th className="text-right py-2.5 px-3 dashboard-label">Total Spend</th>
                  <th className="text-right py-2.5 px-3 dashboard-label">Orders</th>
                  <th className="text-right py-2.5 px-3 dashboard-label">Avg Order Value</th>
                  <th className="text-right py-2.5 px-3 dashboard-label">Volume (kg)</th>
                </tr>
              </thead>
              <tbody>
                {monthlySummary.map((row) => (
                  <tr key={row.rawDate} className={`border-b border-border/50 transition-colors hover:bg-muted/30 ${row.isCurrentMonth ? 'bg-primary/5' : ''}`}>
                    <td className="py-2.5 px-3 font-medium text-foreground">
                      {row.isCurrentMonth && <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mr-2" />}
                      {row.period}
                    </td>
                    <td className="text-right py-2.5 px-3 tabular-nums font-medium">{formatCurrencyDetailed(row.totalSpend)}</td>
                    <td className="text-right py-2.5 px-3 tabular-nums">{row.orderCount}</td>
                    <td className="text-right py-2.5 px-3 tabular-nums">{formatCurrencyDetailed(row.avgOrderValue)}</td>
                    <td className="text-right py-2.5 px-3 tabular-nums">{formatWeight(row.volumeKg)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border font-semibold">
                  <td className="py-2.5 px-3">Total</td>
                  <td className="text-right py-2.5 px-3 tabular-nums">{formatCurrencyDetailed(monthlySummary.reduce((s, r) => s + r.totalSpend, 0))}</td>
                  <td className="text-right py-2.5 px-3 tabular-nums">{monthlySummary.reduce((s, r) => s + r.orderCount, 0)}</td>
                  <td className="text-right py-2.5 px-3 tabular-nums">{formatCurrencyDetailed(calculateAverageOrderValue(monthlySummary.reduce((s, r) => s + r.totalSpend, 0), monthlySummary.reduce((s, r) => s + r.orderCount, 0)))}</td>
                  <td className="text-right py-2.5 px-3 tabular-nums">{formatWeight(monthlySummary.reduce((s, r) => s + r.volumeKg, 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )
      ) : (
        <>
          {/* Period Pills + Legend */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPeriodType(opt.value as any)}
                  className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
                    periodType === opt.value ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {showComparison && (
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 bg-primary rounded" />
                  Current
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 rounded" style={{ background: '#9CA3AF', borderTop: '1px dashed #9CA3AF' }} />
                  Previous Period
                </span>
              </div>
            )}
          </div>

          {/* Comparison Summary */}
          {showComparison && chartData.length > 0 && chartData[0]?.previousSpend != null && (
            <div className="flex items-center gap-4 mb-4 px-3 py-2 bg-muted/30 rounded-lg text-sm">
              <div>
                <span className="text-muted-foreground">Current: </span>
                <span className="font-semibold tabular-nums">{formatCurrency(chartData.reduce((s, d) => s + d.spend, 0))}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Previous: </span>
                <span className="font-semibold tabular-nums text-muted-foreground">{formatCurrency(chartData.reduce((s, d) => s + (d.previousSpend || 0), 0))}</span>
              </div>
              {(() => {
                const curr = chartData.reduce((s, d) => s + d.spend, 0);
                const prev = chartData.reduce((s, d) => s + (d.previousSpend || 0), 0);
                const pct = prev > 0 ? ((curr - prev) / prev * 100).toFixed(1) : null;
                return pct ? (
                  <span className={`font-medium ${Number(pct) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {Number(pct) >= 0 ? '+' : ''}{pct}%
                  </span>
                ) : null;
              })()}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-80">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Loading spend trends...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-80 text-destructive text-sm">{error}</div>
          ) : (
            <ResponsiveContainer width="100%" height={360}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="spendGradientPolished" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#B8672B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#B8672B" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="volumeGradientPolished" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F16870" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#F16870" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 23%, 88%)" />
                <XAxis dataKey="period" tick={{ fill: 'hsl(29, 15%, 48%)', fontSize: 11 }} axisLine={{ stroke: 'hsl(30, 23%, 88%)' }} />
                <YAxis yAxisId="left" tick={{ fill: 'hsl(29, 15%, 48%)', fontSize: 11 }} axisLine={{ stroke: 'hsl(30, 23%, 88%)' }} tickFormatter={(v) => `₹${v >= 1000 ? (v/1000).toFixed(0) + 'K' : v}`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: 'hsl(29, 15%, 48%)', fontSize: 11 }} axisLine={{ stroke: 'hsl(30, 23%, 88%)' }} tickFormatter={(v) => `${v >= 1000 ? (v/1000).toFixed(0) + 'K' : v} kg`} />
                <Tooltip content={<CustomTooltip />} />
                {medianSpend > 0 && (
                  <ReferenceLine yAxisId="left" y={medianSpend} stroke="#9CA3AF" strokeDasharray="6 4" strokeWidth={1} label={{ value: `Median: ${formatCurrency(medianSpend)}`, position: 'right', fontSize: 10, fill: '#9CA3AF' }} />
                )}
                {festivalMarkers.map((f) => (
                  <ReferenceLine key={f.date} yAxisId="left" x={f.periodLabel} stroke="#E5A764" strokeDasharray="4 4" strokeWidth={1} label={{ value: f.shortName, position: 'top', fontSize: 9, fill: '#B8672B', angle: -45 }} />
                ))}
                {showComparison && (
                  <Area yAxisId="left" type="monotone" dataKey="previousSpend" stroke="#9CA3AF" strokeWidth={1.5} strokeDasharray="5 5" fill="none" name="Previous Spend" />
                )}
                <Area yAxisId="left" type="monotone" dataKey="spend" stroke="#B8672B" strokeWidth={2} fill="url(#spendGradientPolished)" name="Spend" />
                <Area yAxisId="right" type="monotone" dataKey="volume" stroke="#F16870" strokeWidth={1.5} fill="url(#volumeGradientPolished)" name="Volume" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </>
      )}
    </div>
  );
}
