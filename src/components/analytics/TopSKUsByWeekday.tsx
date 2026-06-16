import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Download, Loader2, BarChart3, Expand } from "lucide-react";
import { spendAnalyticsApi, WeekdayData, TopProductData } from "@/api/spendAnalyticsApi";
import { volumeAnalyticsApi, VolumeWeekdayData } from "@/api/volumeAnalyticsApi";
import { formatCurrency, formatWeight } from "@/utils/formatters";
import { exportWeekdayProducts } from "@/utils/excelExport";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

interface TopSKUsByWeekdayProps {
  filters: any;
  type: 'spend' | 'volume';
}

const WEEKDAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function TopSKUsByWeekday({ filters, type }: TopSKUsByWeekdayProps) {
  const [weekdayData, setWeekdayData] = useState<WeekdayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showChart, setShowChart] = useState(true);
  const [selectedWeekday, setSelectedWeekday] = useState<string>('Monday');
  const [isViewAllOpen, setIsViewAllOpen] = useState(false);
  const [allWeekdayData, setAllWeekdayData] = useState<WeekdayData[]>([]);

  useEffect(() => {
    const fetchWeekdayData = async () => {
      try {
        setLoading(true); setError(null);
        let data;
        if (type === 'volume') {
          data = await volumeAnalyticsApi.getTopProductsByVolumeWeekday({
            timePeriod: (filters.timePeriod || '30d') as any,
            category: filters.category !== 'all' ? filters.category : undefined,
            startDate: filters.startDate, endDate: filters.endDate, limit: 10, branchId: filters.branchId
          });
        } else {
          data = await spendAnalyticsApi.getTopProductsByWeekday({
            timePeriod: filters.timePeriod || '30d',
            categories: filters.categories?.length ? filters.categories : undefined,
            category: !filters.categories && filters.category !== 'all' ? filters.category : undefined,
            productIds: filters.products?.length ? filters.products : undefined,
            productId: !filters.products && filters.product !== 'all' ? filters.product : undefined,
            startDate: filters.startDate, endDate: filters.endDate, limit: 10, branchId: filters.branchId
          }, type);
        }
        setWeekdayData(data);
      } catch { setError('Failed to load weekday data'); setWeekdayData([]); } finally { setLoading(false); }
    };
    fetchWeekdayData();
  }, [filters, type, filters.branchId]);

  const currentDay = weekdayData.find((d: any) => d.day_name?.toLowerCase() === selectedWeekday.toLowerCase());

  type NormalizedItem = { name: string; category: string; amount: number; quantity?: number; percentage?: number; unit?: string; };

  const normalizedItems: NormalizedItem[] = React.useMemo(() => {
    if (!currentDay) return [];
    if (type === 'volume') {
      const day = currentDay as unknown as VolumeWeekdayData;
      return (day.products || []).map((p) => ({ name: p.product_name, category: p.category_name, amount: p.product_volume_kg, quantity: p.total_quantity, percentage: p.percentage, unit: p.unit || 'kg' }));
    } else {
      const day = currentDay as unknown as WeekdayData;
      return (day.products || []).map((p: TopProductData) => ({ name: p.product_name, category: p.category, amount: p.product_spend, quantity: p.total_quantity, unit: p.unit || 'units' }));
    }
  }, [currentDay, type]);

  const { displayData, chartData, topTotal, topPercentage, dataWithSpendPercentage } = React.useMemo(() => {
    const total = normalizedItems.reduce((sum, it) => sum + (it.amount || 0), 0);
    const displayData = normalizedItems.slice(0, 10);
    const topTotal = displayData.reduce((sum, it) => sum + (it.amount || 0), 0);
    const topPercentage = total > 0 ? ((topTotal / total) * 100).toFixed(1) : '0.0';
    const dataWithSpendPercentage = displayData.map((it) => ({ ...it, spendPercentage: total > 0 ? ((it.amount / total) * 100).toFixed(1) : '0.0' }));
    const chartData = dataWithSpendPercentage.map((it) => ({ name: it.name.length > 20 ? it.name.substring(0, 20) + '...' : it.name, amount: it.amount, category: it.category }));
    return { displayData, chartData, topTotal, topPercentage, dataWithSpendPercentage };
  }, [normalizedItems]);

  const title = type === 'spend' ? 'Top SKUs by Spend by Weekday' : 'Top SKUs by Volume by Weekday';
  const formatAxisValue = (value: number) => type === 'spend' ? (value >= 1000 ? `₹${Math.round(value / 1000)}k` : `₹${value}`) : formatWeight(value);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-card border border-border rounded-xl p-3 shadow-lg text-sm">
          <p className="font-medium text-foreground mb-1">{label}</p>
          <p className="text-muted-foreground">{type === 'spend' ? `₹${payload[0].value.toLocaleString()}` : formatWeight(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  const handleViewAll = async () => {
    try {
      let allData;
      if (type === 'volume') {
        allData = await volumeAnalyticsApi.getTopProductsByVolumeWeekday({ timePeriod: (filters.timePeriod || '30d') as any, category: filters.category !== 'all' ? filters.category : undefined, startDate: filters.startDate, endDate: filters.endDate, limit: 100, branchId: filters.branchId });
      } else {
        allData = await spendAnalyticsApi.getTopProductsByWeekday({ timePeriod: filters.timePeriod || '30d', categories: filters.categories?.length ? filters.categories : undefined, category: !filters.categories && filters.category !== 'all' ? filters.category : undefined, productIds: filters.products?.length ? filters.products : undefined, productId: !filters.products && filters.product !== 'all' ? filters.product : undefined, startDate: filters.startDate, endDate: filters.endDate, limit: 100, branchId: filters.branchId }, type);
      }
      setAllWeekdayData(allData);
      setIsViewAllOpen(true);
    } catch {}
  };

  const handleExport = async () => {
    try { setIsExporting(true); exportWeekdayProducts(weekdayData, filters, type); } catch {} finally { setIsExporting(false); }
  };

  return (
    <div className="dashboard-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-playfair text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Top {displayData.length} products driving {topPercentage}% of total {type} on {selectedWeekday}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setShowChart(!showChart)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200">
            <BarChart3 className="h-3.5 w-3.5" />
          </button>
          <Dialog open={isViewAllOpen} onOpenChange={setIsViewAllOpen}>
            <DialogTrigger asChild>
              <button onClick={handleViewAll} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200">
                <Expand className="h-3.5 w-3.5" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle>All SKUs by {type === 'spend' ? 'Spend' : 'Volume'} - {selectedWeekday}</DialogTitle>
              </DialogHeader>
              <div className="overflow-auto max-h-[60vh]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="dashboard-label">#</TableHead>
                      <TableHead className="dashboard-label">Product</TableHead>
                      <TableHead className="text-right dashboard-label">Quantity</TableHead>
                      <TableHead className="text-right dashboard-label">{type === 'spend' ? 'Amount' : 'Volume'}</TableHead>
                      <TableHead className="text-right dashboard-label">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const currentAllDay = allWeekdayData.find((d: any) => d.day_name?.toLowerCase() === selectedWeekday.toLowerCase());
                      if (!currentAllDay?.products) return null;
                      const allProducts = currentAllDay.products.map((p: any) => type === 'volume'
                        ? { name: p.product_name, category: p.category_name || p.category, amount: p.product_volume_kg, quantity: p.total_quantity, unit: p.unit || 'kg' }
                        : { name: p.product_name, category: p.category, amount: p.product_spend, quantity: p.total_quantity, unit: p.unit || 'units' }
                      );
                      const total = allProducts.reduce((s, i) => s + (i.amount || 0), 0);
                      return allProducts.map((sku, index) => (
                        <TableRow key={index} className="even:bg-muted/30">
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{sku.name}</div>
                            <div className="text-xs text-muted-foreground">{sku.category}</div>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{sku.quantity?.toLocaleString() || 0} {sku.unit}</TableCell>
                          <TableCell className="text-right tabular-nums font-medium">{type === 'spend' ? formatCurrency(sku.amount) : formatWeight(sku.amount)}</TableCell>
                          <TableCell className="text-right">
                            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{total > 0 ? ((sku.amount / total) * 100).toFixed(1) : 0}%</span>
                          </TableCell>
                        </TableRow>
                      ));
                    })()}
                  </TableBody>
                </Table>
              </div>
            </DialogContent>
          </Dialog>
          <button onClick={handleExport} disabled={isExporting} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200">
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-16">
          <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
          <span className="text-sm text-muted-foreground">Loading weekday data...</span>
        </div>
      ) : error ? (
        <div className="text-sm text-destructive text-center py-4">{error}</div>
      ) : null}

      {/* Day Selector Pills */}
      <div className="flex items-center gap-1.5 mb-4">
        {WEEKDAY_ORDER.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedWeekday(day)}
            className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
              selectedWeekday === day ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            {day.slice(0, 3)}
          </button>
        ))}
      </div>

      {/* Chart or Table */}
      {showChart ? (
        <div>
          {chartData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">No data for {selectedWeekday}</div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ReBarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(30, 23%, 88%)" />
                  <XAxis dataKey="name" stroke="hsl(29, 15%, 48%)" fontSize={11} angle={-45} textAnchor="end" height={60} />
                  <YAxis stroke="hsl(29, 15%, 48%)" fontSize={11} tickFormatter={formatAxisValue} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount" fill="#B8672B" radius={[4, 4, 0, 0]} />
                </ReBarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-auto max-h-80">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="dashboard-label">#</TableHead>
                <TableHead className="dashboard-label">Product</TableHead>
                <TableHead className="text-right dashboard-label">Quantity</TableHead>
                <TableHead className="text-right dashboard-label">{type === 'spend' ? 'Amount' : 'Volume'}</TableHead>
                <TableHead className="text-right dashboard-label">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataWithSpendPercentage.map((sku, index) => (
                <TableRow key={index} className="border-border/50 even:bg-muted/30">
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-foreground">{sku.name}</div>
                    <div className="text-xs text-muted-foreground">{sku.category}</div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm">{sku.quantity?.toLocaleString() || 0} {sku.unit}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium text-sm">{type === 'spend' ? formatCurrency(sku.amount) : formatWeight(sku.amount)}</TableCell>
                  <TableCell className="text-right">
                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{sku.spendPercentage}%</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
        <span>Top {displayData.length} of {currentDay?.products?.length || 0} SKUs for {selectedWeekday}</span>
        <span className="font-medium text-foreground">Combined: {type === 'spend' ? formatCurrency(topTotal) : formatWeight(topTotal)} ({topPercentage}%)</span>
      </div>
    </div>
  );
}
