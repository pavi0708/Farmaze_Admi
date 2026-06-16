import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Package, Download, Loader2, Crown, Eye } from "lucide-react";
import AllSKUsModal from "./AllSKUsModal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { spendAnalyticsApi, TopProductData } from "@/api/spendAnalyticsApi";
import { volumeAnalyticsApi, TopVolumeProductData } from "@/api/volumeAnalyticsApi";
import { exportTopProducts } from "@/utils/excelExport";
import { formatCurrency, formatWeight, formatPercentage } from "@/utils/formatters";
import { calculatePreviousPeriod } from "@/utils/dateUtils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TopSKUsComponentProps {
  filters: any;
  type?: 'spend' | 'volume';
}

interface TopProductItem {
  rank: number; name: string; unit?: string; category: string; sku: string;
  spend: number; volume: number; percentage: number; avgUnitPrice: number;
  orderFrequency: number; trend: string; trendDirection: "up" | "down";
  productId: string; changePct?: number | null;
}

export default function TopSKUsComponent({ filters, type = 'spend' }: TopSKUsComponentProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [topSKUs, setTopSKUs] = useState<TopProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [granularity, setGranularity] = useState<'total' | 'daily' | 'weekly' | 'monthly'>('total');
  const [showAllModal, setShowAllModal] = useState(false);

  useEffect(() => {
    const fetchTopProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const showComp = filters.comparison !== "none";
        const prevPeriod = showComp ? calculatePreviousPeriod(filters.timePeriod || '30d', filters.startDate, filters.endDate) : null;

        let transformedData: TopProductItem[] = [];
        let prevMap = new Map<string, number>(); // productId -> spend or volume

        if (type === 'volume') {
          const baseParams = {
            timePeriod: (filters.timePeriod || '30d') as any, granularity, limit: 10,
            category: filters.category !== 'all' ? filters.category : undefined,
            startDate: filters.startDate, endDate: filters.endDate, branchId: filters.branchId
          };
          const [response, prevResponse] = await Promise.all([
            volumeAnalyticsApi.getTopProductsByVolume(baseParams),
            prevPeriod ? volumeAnalyticsApi.getTopProductsByVolume({
              ...baseParams, timePeriod: 'custom' as any, startDate: prevPeriod.start, endDate: prevPeriod.end
            }).catch(() => []) : Promise.resolve([])
          ]);
          (prevResponse as TopVolumeProductData[]).forEach((p) => prevMap.set(p.product_id, p.total_volume_kg));
          transformedData = response.map((item: TopVolumeProductData, index: number) => ({
            rank: index + 1, name: item.product_name, unit: 'kg', category: item.category_name,
            sku: `SKU-${item.product_id.slice(0, 8)}`, productId: item.product_id, spend: 0, volume: item.total_volume_kg,
            percentage: item.percentage, avgUnitPrice: 0, orderFrequency: item.order_frequency,
            trend: `${item.avg_volume_per_order.toFixed(1)} kg/order`, trendDirection: "up" as const,
            changePct: prevMap.has(item.product_id) && prevMap.get(item.product_id)! > 0
              ? ((item.total_volume_kg - prevMap.get(item.product_id)!) / prevMap.get(item.product_id)! * 100)
              : null
          }));
        } else {
          const baseParams = {
            timePeriod: filters.timePeriod || '30d', granularity, limit: 10,
            categories: filters.categories?.length ? filters.categories : undefined,
            category: !filters.categories && filters.category !== 'all' ? filters.category : undefined,
            productIds: filters.products?.length ? filters.products : undefined,
            productId: !filters.products && filters.product !== 'all' ? filters.product : undefined,
            startDate: filters.startDate, endDate: filters.endDate, branchId: filters.branchId
          };
          const [response, prevResponse] = await Promise.all([
            spendAnalyticsApi.getTopProducts(baseParams),
            prevPeriod ? spendAnalyticsApi.getTopProducts({
              ...baseParams, timePeriod: 'custom', startDate: prevPeriod.start, endDate: prevPeriod.end
            }).catch(() => []) : Promise.resolve([])
          ]);
          (prevResponse as TopProductData[]).forEach((p) => prevMap.set(p.product_id, p.product_spend));
          transformedData = response.map((item: TopProductData, index: number) => ({
            rank: index + 1, name: item.product_name, unit: item.unit, category: item.category,
            sku: item.product_sku || `SKU-${item.product_id.slice(0, 8)}`, productId: item.product_id,
            spend: item.product_spend, volume: item.product_volume_kg, percentage: 0,
            avgUnitPrice: item.avg_unit_price, orderFrequency: item.order_frequency,
            trend: "+0%", trendDirection: "up" as const,
            changePct: prevMap.has(item.product_id) && prevMap.get(item.product_id)! > 0
              ? ((item.product_spend - prevMap.get(item.product_id)!) / prevMap.get(item.product_id)! * 100)
              : null
          }));
        }
        const total = type === 'spend' ? transformedData.reduce((s, i) => s + i.spend, 0) : transformedData.reduce((s, i) => s + i.volume, 0);
        transformedData.forEach(item => { item.percentage = total > 0 ? ((type === 'spend' ? item.spend : item.volume) / total) * 100 : 0; });
        transformedData.sort((a, b) => type === 'spend' ? b.spend - a.spend : b.volume - a.volume);
        setTopSKUs(transformedData);
      } catch {
        setError('Failed to load top products data');
        setTopSKUs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTopProducts();
  }, [filters, type, granularity]);

  const handleExport = async () => {
    try { setIsExporting(true); exportTopProducts(topSKUs, filters, 'overall'); } catch {} finally { setIsExporting(false); }
  };

  const title = type === 'spend' ? 'Top SKUs by Spend' : 'Top SKUs by Volume';
  const spendHeader = type === 'spend'
    ? (granularity === 'total' ? 'Total Spend' : `Avg ${granularity.charAt(0).toUpperCase() + granularity.slice(1)} Spend`)
    : (granularity === 'total' ? 'Total Volume' : `Avg ${granularity.charAt(0).toUpperCase() + granularity.slice(1)} Volume`);

  return (
    <div className="dashboard-card h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-rubik text-base font-semibold text-foreground">{title}</h3>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setShowAllModal(true)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200">
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button onClick={handleExport} disabled={isExporting} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200">
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Granularity Pills */}
      <div className="flex items-center gap-1.5 mb-4">
        {(['total', 'daily', 'weekly', 'monthly'] as const).map((opt) => (
          <button
            key={opt}
            onClick={() => setGranularity(opt)}
            className={`px-3 py-1 text-xs rounded-full transition-all duration-200 ${
              granularity === opt ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            {opt.charAt(0).toUpperCase() + opt.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading top products...</span>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64 text-destructive text-sm">{error}</div>
      ) : (
        <div className="overflow-auto max-h-[400px]">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="w-12 dashboard-label">#</TableHead>
                <TableHead className="dashboard-label">Product Name</TableHead>
                <TableHead className="text-right dashboard-label">{spendHeader}</TableHead>
                <TableHead className="text-right dashboard-label">% of Total</TableHead>
                <TableHead className="text-right dashboard-label">Avg Unit Price</TableHead>
                {filters.comparison !== "none" && <TableHead className="text-right dashboard-label">Change</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {topSKUs.map((sku) => (
                <TableRow key={sku.sku} className="border-border/50 even:bg-muted/30 hover:bg-muted/40 transition-colors">
                  <TableCell className="font-medium text-center">
                    {sku.rank === 1 ? <Crown className="h-4 w-4 text-primary mx-auto" /> : sku.rank}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground text-sm">{sku.name}</div>
                    <div className="text-xs text-muted-foreground">{sku.category}{sku.unit ? ` · ${sku.unit}` : ''}</div>
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums text-sm">
                    {type === 'spend' ? formatCurrency(sku.spend) : formatWeight(sku.volume)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums text-sm">
                    {formatPercentage(sku.percentage)}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums text-sm">
                    {formatCurrency(sku.avgUnitPrice)}
                  </TableCell>
                  {filters.comparison !== "none" && (
                    <TableCell className="text-right tabular-nums text-sm">
                      {sku.changePct != null ? (
                        <span className={`inline-flex items-center gap-0.5 font-medium ${sku.changePct >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {sku.changePct >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {sku.changePct >= 0 ? '+' : ''}{sku.changePct.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">New</span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AllSKUsModal isOpen={showAllModal} onClose={() => setShowAllModal(false)} type={type} filters={filters} granularity={granularity} />
    </div>
  );
}
