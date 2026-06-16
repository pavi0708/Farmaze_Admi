import React, { useState, useEffect, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import WasteKPICards from '@/components/waste/WasteKPICards';
import WasteAlerts, { type WasteAlert } from '@/components/waste/WasteAlerts';
import WasteCostTrendChart, { type MonthlyWasteCost } from '@/components/waste/WasteCostTrendChart';
import TopOverOrderedTable, { type OverOrderedProduct } from '@/components/waste/TopOverOrderedTable';
import WasteAIInsight from '@/components/waste/WasteAIInsight';
import analyticsApi from '@/api/analyticsApi';
import { useAuth } from '@/context/AuthContext';
import BranchFilterSelector from '@/components/analytics/BranchFilterSelector';

const WasteAnalytics: React.FC = () => {
  const { selectedBranch } = useAuth();
  const branchId = selectedBranch?.id ?? undefined;
  const [period, setPeriod] = useState('30');
  const [isLoading, setIsLoading] = useState(true);

  // Real API data state
  const [alerts, setAlerts] = useState<WasteAlert[]>([]);
  const [trendData, setTrendData] = useState<MonthlyWasteCost[]>([]);
  const [overOrderedProducts, setOverOrderedProducts] = useState<OverOrderedProduct[]>([]);
  const [kpiData, setKpiData] = useState<{
    wasteCost: number;
    overOrderedCount: number;
    productsAtRisk: number;
    wasteTrend: { direction: 'up' | 'down'; percentage: number };
  }>({
    wasteCost: 0,
    overOrderedCount: 0,
    productsAtRisk: 0,
    wasteTrend: { direction: 'down', percentage: 0 },
  });

  useEffect(() => {
    const loadWasteData = async () => {
      setIsLoading(true);
      try {
        const days = Number(period);
        // Calculate months for trend (roughly days/30)
        const months = Math.max(3, Math.ceil(days / 30) * 2);

        // Fetch all three endpoints in parallel
        const [overviewData, trendsData, topProductsData] = await Promise.all([
          analyticsApi.getWasteOverview(days, branchId),
          analyticsApi.getWasteTrends(months, branchId),
          analyticsApi.getWasteTopProducts(days, 10, branchId),
        ]);

        // Map overview products to WasteAlert[]
        if (overviewData.products && overviewData.products.length > 0) {
          const mappedAlerts: WasteAlert[] = overviewData.products
            .filter((p: any) => p.risk_level && p.risk_level !== 'NONE')
            .slice(0, 10)
            .map((p: any) => ({
              id: p.product_id,
              productName: p.product_name,
              orderedQty: Math.round(p.avg_daily_qty * (1 + (p.max_deviation_pct || 0) / 100)),
              averageQty: p.avg_daily_qty,
              unit: p.unit || 'kg',
              deviationPercent: p.max_deviation_pct || 0,
              wasteCost: p.waste_cost,
              severity: p.risk_level as 'HIGH' | 'MEDIUM' | 'LOW',
              sparklineData: [],  // Not available from API
            }));
          setAlerts(mappedAlerts);
        } else {
          setAlerts([]);
        }

        // Map trends monthly_totals to MonthlyWasteCost[]
        if (trendsData.monthly_totals && trendsData.monthly_totals.length > 0) {
          const mappedTrends: MonthlyWasteCost[] = trendsData.monthly_totals.map((t: any) => {
            // Convert YYYY-MM to short month name
            const [year, monthNum] = t.month.split('-');
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const shortMonth = monthNames[parseInt(monthNum, 10) - 1] || t.month;
            return { month: shortMonth, cost: t.waste_cost };
          });
          setTrendData(mappedTrends);
        } else {
          setTrendData([]);
        }

        // Map top products to OverOrderedProduct[]
        if (topProductsData.products && topProductsData.products.length > 0) {
          const mappedProducts: OverOrderedProduct[] = topProductsData.products.map((p: any) => ({
            id: p.product_id,
            product: p.product_name,
            avgQty: p.avg_daily_qty,
            unit: p.unit || 'kg',
            timesOverOrdered: p.order_days || 0,
            totalWasteCost: p.waste_cost,
            lastOccurrence: 'Recent',
            severity: (p.risk_level || 'low').toLowerCase() as 'high' | 'medium' | 'low',
          }));
          setOverOrderedProducts(mappedProducts);
        } else {
          setOverOrderedProducts([]);
        }

        // Set KPI from overview summary
        if (overviewData.summary) {
          const s = overviewData.summary;
          // Calculate trend by comparing with longer period
          const trendPct = trendData.length >= 2
            ? Math.round(((trendData[trendData.length - 1]?.cost || 0) - (trendData[trendData.length - 2]?.cost || 0)) / ((trendData[trendData.length - 2]?.cost || 1)) * 100)
            : 0;

          setKpiData({
            wasteCost: s.total_waste_cost || 0,
            overOrderedCount: s.flagged_products || 0,
            productsAtRisk: s.flagged_products || 0,
            wasteTrend: {
              direction: trendPct <= 0 ? 'down' : 'up',
              percentage: Math.abs(trendPct),
            },
          });
        }
      } catch (error) {
        console.error('Error loading waste data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWasteData();
  }, [period, branchId]);

  // Calculate monthly saving from waste insights
  const monthlySaving = useMemo(() => {
    return Math.round(kpiData.wasteCost * 0.6); // potential saving if following suggestions
  }, [kpiData.wasteCost]);

  const savingPercent = useMemo(() => {
    return kpiData.wasteCost > 0 ? Math.round((monthlySaving / kpiData.wasteCost) * 100) : 0;
  }, [monthlySaving, kpiData.wasteCost]);

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-8 pb-12">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-farmaze-orange"></div>
          <span className="ml-3 text-muted-foreground">Loading waste intelligence...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold font-playfair text-foreground">
            Waste Intelligence
          </h1>
          <p className="text-sm text-muted-foreground font-rubik mt-1">
            Identify over-ordering patterns and reduce waste costs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <BranchFilterSelector />
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px] font-rubik text-sm">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Section 1 - KPI Cards */}
      <WasteKPICards
        wasteCost={kpiData.wasteCost}
        overOrderedCount={kpiData.overOrderedCount}
        productsAtRisk={kpiData.productsAtRisk}
        wasteTrend={kpiData.wasteTrend}
        period={period}
      />

      {/* Section 2 - Active Waste Alerts */}
      <div>
        <h2 className="text-lg font-medium font-playfair text-foreground mb-3">
          Active Waste Alerts
        </h2>
        {alerts.length > 0 ? (
          <WasteAlerts alerts={alerts} />
        ) : (
          <div className="rounded-lg border p-6 text-center text-muted-foreground">
            No waste alerts for this period. Your ordering patterns look healthy!
          </div>
        )}
      </div>

      {/* Section 3 & 4 - Chart + Table side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WasteCostTrendChart data={trendData} />
        <TopOverOrderedTable products={overOrderedProducts} />
      </div>

      {/* Section 5 - AI Insight */}
      <WasteAIInsight monthlySaving={monthlySaving} savingPercent={savingPercent} />
    </div>
  );
};

export default WasteAnalytics;
