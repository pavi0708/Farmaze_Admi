import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Package } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { DashboardFilters } from "@/components/analytics/DashboardFilters";
import { volumeAnalyticsApi, VolumeTrendData } from "@/api/volumeAnalyticsApi";
import { formatWeight, calculateMedian } from "@/utils/formatters";
import { calculatePreviousPeriod } from "@/utils/dateUtils";
import { getFestivalsInRange, FestivalDate } from "@/utils/festivals";

interface ChartDataPoint {
  period: string;
  rawDate: string;
  volume: number;
  items: number;
  previousVolume?: number;
}

interface InteractiveVolumeChartProps {
  filters: DashboardFilters;
  onDataLoad?: (data: any) => void;
}

const PERIOD_OPTIONS = [
  { value: "month", label: "Monthly", drill: "monthly" },
  { value: "week", label: "Weekly", drill: "weekly" },
  { value: "day", label: "Daily", drill: "daily" },
] as const;

export default function InteractiveVolumeChart({ filters, onDataLoad }: InteractiveVolumeChartProps) {
  const [drillLevel, setDrillLevel] = useState<"monthly" | "weekly" | "daily">("monthly");
  const [periodType, setPeriodType] = useState<"month" | "week" | "day">("month");
  const [isExporting, setIsExporting] = useState(false);
  const [volumeData, setVolumeData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVolumeData = async () => {
      try {
        setLoading(true);
        setError(null);
        const baseParams = {
          timePeriod: (filters.timePeriod || '30d') as '7d' | '30d' | '90d' | 'custom',
          granularity: drillLevel === "monthly" ? "daily" as const : "daily" as const,
          category: filters.category !== 'all' ? filters.category : undefined,
          productId: filters.product !== 'all' ? filters.product : undefined,
          startDate: filters.startDate, endDate: filters.endDate, branchId: filters.branchId
        };
        const showComp = filters.comparison !== "none";
        const prevPeriod = showComp ? calculatePreviousPeriod(filters.timePeriod || '30d', filters.startDate, filters.endDate) : null;

        const [volumeTrends, prevTrends] = await Promise.all([
          volumeAnalyticsApi.getVolumeTrends(baseParams),
          prevPeriod ? volumeAnalyticsApi.getVolumeTrends({
            ...baseParams, timePeriod: 'custom', startDate: prevPeriod.start, endDate: prevPeriod.end
          }).catch(() => [] as VolumeTrendData[]) : Promise.resolve([] as VolumeTrendData[])
        ]);

        const chartData: ChartDataPoint[] = volumeTrends.map((item: VolumeTrendData, i: number) => {
          const prev = prevTrends[i];
          return {
            period: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            rawDate: item.date,
            volume: item.total_volume_kg,
            items: item.order_count,
            ...(prev ? { previousVolume: prev.total_volume_kg } : {})
          };
        });
        setVolumeData(chartData);
        if (onDataLoad) onDataLoad({ volumeTrends, chartData, granularity: periodType, filters });
      } catch {
        setError('Failed to load volume data');
        setVolumeData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchVolumeData();
  }, [filters, drillLevel, filters.branchId]);

  const handleExport = () => { setIsExporting(true); setTimeout(() => setIsExporting(false), 1000); };

  const showComparison = filters.comparison !== "none";

  const medianVolume = useMemo(() => {
    const values = volumeData.map(d => d.volume).filter(v => v > 0);
    return calculateMedian(values);
  }, [volumeData]);

  const festivalMarkers = useMemo(() => {
    if (volumeData.length === 0 || drillLevel !== 'daily') return [];
    const dates = volumeData.map(d => d.rawDate).filter(Boolean);
    if (dates.length === 0) return [];
    const festivals = getFestivalsInRange(dates[0], dates[dates.length - 1]);
    return festivals.map(f => {
      const label = new Date(f.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const match = volumeData.find(d => d.period === label);
      return match ? { ...f, periodLabel: label } : null;
    }).filter((f): f is FestivalDate & { periodLabel: string } => f !== null);
  }, [volumeData, drillLevel]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload?.length) {
      const data = payload[0].payload;
      const hasPrev = showComparison && data?.previousVolume != null;
      const changePct = hasPrev && data.previousVolume > 0
        ? ((data.volume - data.previousVolume) / data.previousVolume * 100).toFixed(1)
        : null;
      return (
        <div className="bg-card border border-border rounded-xl p-3 shadow-lg text-sm">
          <p className="font-medium text-foreground mb-1.5">{data.period}</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#F16870' }} />
              <span className="text-muted-foreground">Volume:</span>
              <span className="font-medium tabular-nums">{data.volume.toLocaleString()} kg</span>
              {changePct && (
                <span className={`text-xs font-medium ${Number(changePct) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {Number(changePct) >= 0 ? '+' : ''}{changePct}%
                </span>
              )}
            </div>
            {hasPrev && (
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#9CA3AF' }} />
                <span className="text-muted-foreground">Prev Volume:</span>
                <span className="font-medium tabular-nums text-muted-foreground">{data.previousVolume.toLocaleString()} kg</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground" />
              <span className="text-muted-foreground">Items:</span>
              <span className="font-medium tabular-nums">{data.items.toLocaleString()}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-rubik text-base font-semibold text-foreground">Volume Analysis</h3>
        <button onClick={handleExport} disabled={isExporting} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200">
          <Download className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Period Pills + Legend */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setPeriodType(opt.value); setDrillLevel(opt.drill); }}
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
              <span className="w-4 h-0.5 rounded" style={{ background: '#F16870' }} />
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
      {showComparison && volumeData.length > 0 && volumeData[0]?.previousVolume != null && (
        <div className="flex items-center gap-4 mb-4 px-3 py-2 bg-muted/30 rounded-lg text-sm">
          <div>
            <span className="text-muted-foreground">Current: </span>
            <span className="font-semibold tabular-nums">{volumeData.reduce((s, d) => s + d.volume, 0).toLocaleString()} kg</span>
          </div>
          <div>
            <span className="text-muted-foreground">Previous: </span>
            <span className="font-semibold tabular-nums text-muted-foreground">{volumeData.reduce((s, d) => s + (d.previousVolume || 0), 0).toLocaleString()} kg</span>
          </div>
          {(() => {
            const curr = volumeData.reduce((s, d) => s + d.volume, 0);
            const prev = volumeData.reduce((s, d) => s + (d.previousVolume || 0), 0);
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
          <span className="ml-2 text-sm text-muted-foreground">Loading volume data...</span>
        </div>
      ) : error || volumeData.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-80 text-muted-foreground">
          <Package className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm font-medium">{error || 'No volume data available'}</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={360}>
          <AreaChart data={volumeData}>
            <defs>
              <linearGradient id="volGradientPolished" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F16870" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#F16870" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 23%, 88%)" />
            <XAxis dataKey="period" tick={{ fill: 'hsl(29, 15%, 48%)', fontSize: 11 }} axisLine={{ stroke: 'hsl(30, 23%, 88%)' }} />
            <YAxis tick={{ fill: 'hsl(29, 15%, 48%)', fontSize: 11 }} axisLine={{ stroke: 'hsl(30, 23%, 88%)' }} tickFormatter={(v) => `${v >= 1000 ? (v/1000).toFixed(0) + 'K' : v}`} />
            <Tooltip content={<CustomTooltip />} />
            {medianVolume > 0 && (
              <ReferenceLine y={medianVolume} stroke="#9CA3AF" strokeDasharray="6 4" strokeWidth={1} label={{ value: `Median: ${formatWeight(medianVolume)}`, position: 'right', fontSize: 10, fill: '#9CA3AF' }} />
            )}
            {festivalMarkers.map((f) => (
              <ReferenceLine key={f.date} x={f.periodLabel} stroke="#E5A764" strokeDasharray="4 4" strokeWidth={1} label={{ value: f.shortName, position: 'top', fontSize: 9, fill: '#B8672B', angle: -45 }} />
            ))}
            {showComparison && (
              <Area type="monotone" dataKey="previousVolume" stroke="#9CA3AF" strokeWidth={1.5} strokeDasharray="5 5" fill="none" name="Previous Volume" />
            )}
            <Area type="monotone" dataKey="volume" stroke="#F16870" strokeWidth={2} fill="url(#volGradientPolished)" name="Volume (kg)" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
