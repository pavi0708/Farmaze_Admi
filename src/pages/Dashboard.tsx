import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { BarChart3, DollarSign, Package, TrendingDown, TrendingUp, Loader2, Download, ShoppingCart } from "lucide-react";
import DashboardFilters, { DashboardFilters as FilterType } from "@/components/analytics/DashboardFilters";
import SmartInsightsTab from "@/components/analytics/SmartInsightsTab";
import InteractiveSpendChart from "@/components/analytics/InteractiveSpendChart";
import InteractiveVolumeChart from "@/components/analytics/InteractiveVolumeChart";
import CategoryAnalysisCharts from "@/components/analytics/CategoryAnalysisCharts";
import TopSKUsComponent from "@/components/analytics/TopSKUsComponent";
import TopSKUsByWeekday from "@/components/analytics/TopSKUsByWeekday";
import analyticsApi from "@/api/analyticsApi";
import { spendAnalyticsApi } from "@/api/spendAnalyticsApi";
import { volumeAnalyticsApi } from "@/api/volumeAnalyticsApi";
import { useAuth } from "@/context/AuthContext";
import BranchFilterSelector from "@/components/analytics/BranchFilterSelector";
import BranchBreakdownSection from "@/components/analytics/BranchBreakdownSection";
import { exportSpendTrends, exportCategoryAnalysis, exportTopProducts, exportWeekdayProducts } from "@/utils/excelExport";
import SmartInsightsPopover from "@/components/analytics/SmartInsightsPopover";
import mcpInsightsApi from "@/api/mcpInsightsApi";
import SparklineKPICard from "@/components/analytics/SparklineKPICard";
import WeeklyGlanceCard from "@/components/analytics/WeeklyGlanceCard";
import ForecastWidget from "@/components/analytics/ForecastWidget";
import CategoryHealthBar from "@/components/analytics/CategoryHealthBar";
import { motion } from "framer-motion";

// Types for API response
interface OverviewData {
  current_period: {
    total_spend: number;
    total_volume: number;
    avg_order_value: number;
    order_count: number;
  };
  comparison_period?: {
    total_spend: number;
    total_volume: number;
    avg_order_value: number;
    order_count: number;
  };
  changes: {
    total_spend_change: number;
    total_volume_change: number;
    avg_order_value_change: number;
    order_count_change: number;
  };
}

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "spend", label: "Spend" },
  { value: "volume", label: "Volume" },
] as const;

export default function Dashboard() {
  const { selectedBranch, branches, user } = useAuth();
  const branchId = selectedBranch?.id ?? undefined;

  const [selectedTab, setSelectedTab] = useState("overview");
  const [filters, setBaseFilters] = useState<FilterType>({
    timePeriod: "30d",
    category: "all",
    product: "all",
    comparison: "none",
  });

  const filtersWithBranch = useMemo<FilterType>(
    () => ({ ...filters, branchId }),
    [filters, branchId]
  );
  const setFilters = (newFilters: FilterType) => setBaseFilters(newFilters);
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [sparklineData, setSparklineData] = useState<{ spend: {value:number}[]; volume: {value:number}[]; orders: {value:number}[]; aov: {value:number}[] }>({ spend: [], volume: [], orders: [], aov: [] });
  const [spendChartData, setSpendChartData] = useState<any>({
    spendTrends: [],
    topProducts: [],
    categoryBreakdown: [],
    weekdayPatterns: []
  });
  
  const [volumeChartData, setVolumeChartData] = useState<any>({
    volumeTrends: [],
    topVolumeProducts: [],
    categoryVolumes: [],
    seasonalPatterns: []
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExportingSpend, setIsExportingSpend] = useState(false);

  // Stable onDataLoad callbacks
  const onSpendTrendsLoad = useCallback((data: any) => {
    setSpendChartData(prev => ({ ...prev, spendTrends: data.spendTrends || data }));
  }, []);
  const onCategoryLoad = useCallback((data: any) => {
    setSpendChartData(prev => ({ ...prev, categoryBreakdown: data.categoryBreakdown || data }));
  }, []);
  const onVolumeTrendsLoad = useCallback((data: any) => {
    setVolumeChartData(prev => ({ ...prev, volumeTrends: data.volumeTrends || data }));
  }, []);

  // Fetch overview data when filters change
  useEffect(() => {
    const fetchOverviewData = async () => {
      try {
        setLoading(true);
        setError(null);
        const comparisonMode = filters.comparison === "none" ? "none" : "previous_period";
        const apiParams: any = { timePeriod: filters.timePeriod, comparisonMode };
        if (filters.timePeriod === 'custom' && filters.startDate && filters.endDate) {
          apiParams.startDate = filters.startDate;
          apiParams.endDate = filters.endDate;
        }
        const data = await analyticsApi.getOverview(apiParams.timePeriod, apiParams.comparisonMode, apiParams.startDate, apiParams.endDate, branchId);
        setOverviewData(data);
      } catch (err) {
        console.error('Error fetching overview data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchOverviewData();
  }, [filters.timePeriod, filters.comparison, filters.startDate, filters.endDate, branchId]);

  // Fetch sparkline data (7-day daily trends)
  useEffect(() => {
    const fetchSparklines = async () => {
      try {
        const trends = await spendAnalyticsApi.getSpendTrends({ timePeriod: '7d', granularity: 'daily', branchId });
        if (trends?.length) {
          setSparklineData({
            spend: trends.map(t => ({ value: t.total_spend })),
            volume: trends.map(t => ({ value: t.total_volume_kg })),
            orders: trends.map(t => ({ value: t.order_count })),
            aov: trends.map(t => ({ value: t.order_count > 0 ? t.total_spend / t.order_count : 0 })),
          });
        }
      } catch { /* sparklines are optional */ }
    };
    fetchSparklines();
  }, [branchId]);

  // Export all spend data
  const handleExportSpendData = async () => {
    try {
      setIsExportingSpend(true);
      const [trendsData, categoryData, topProductsData, weekdayData] = await Promise.all([
        spendAnalyticsApi.getSpendTrends({ timePeriod: filters.timePeriod || '30d', granularity: 'daily', categories: filters.categories?.length ? filters.categories : undefined, category: !filters.categories && filters.category !== 'all' ? filters.category : undefined, productIds: filters.products?.length ? filters.products : undefined, productId: !filters.products && filters.product !== 'all' ? filters.product : undefined, startDate: filters.startDate, endDate: filters.endDate, branchId }),
        spendAnalyticsApi.getCategoryBreakdown({ timePeriod: filters.timePeriod || '30d', category: filters.category !== 'all' ? filters.category : undefined, productId: filters.product !== 'all' ? filters.product : undefined, startDate: filters.startDate, endDate: filters.endDate, branchId }),
        spendAnalyticsApi.getTopProducts({ timePeriod: filters.timePeriod || '30d', limit: 10, categories: filters.categories?.length ? filters.categories : undefined, category: !filters.categories && filters.category !== 'all' ? filters.category : undefined, productIds: filters.products?.length ? filters.products : undefined, productId: !filters.products && filters.product !== 'all' ? filters.product : undefined, startDate: filters.startDate, endDate: filters.endDate, branchId }),
        spendAnalyticsApi.getTopProductsByWeekday({ timePeriod: filters.timePeriod || '30d', categories: filters.categories?.length ? filters.categories : undefined, category: !filters.categories && filters.category !== 'all' ? filters.category : undefined, productIds: filters.products?.length ? filters.products : undefined, productId: !filters.products && filters.product !== 'all' ? filters.product : undefined, startDate: filters.startDate, endDate: filters.endDate, branchId }, 'spend')
      ]);
      exportSpendTrends(trendsData, filters, 'daily');
      setTimeout(() => exportCategoryAnalysis(categoryData, filters), 100);
      setTimeout(() => exportTopProducts(topProductsData, filters, 'overall'), 200);
      setTimeout(() => exportWeekdayProducts(weekdayData, filters, 'spend'), 300);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExportingSpend(false);
    }
  };

  // Smart Insights handlers
  const handleOverviewInsights = async () => {
    return await mcpInsightsApi.generateOverviewInsights({ overview: overviewData, filters, tab_type: 'overview', data_source: 'overview_api' });
  };

  const handleSpendInsights = async () => {
    return await mcpInsightsApi.generateSpendInsights({
      spendTrends: spendChartData.spendTrends || [], spend_trends: spendChartData.spendTrends || [],
      topProducts: spendChartData.topProducts || [], top_products: spendChartData.topProducts || [],
      categoryBreakdown: spendChartData.categoryBreakdown || [], category_breakdown: spendChartData.categoryBreakdown || [],
      weekdayPatterns: spendChartData.weekdayPatterns || [], weekday_patterns: spendChartData.weekdayPatterns || [],
      overviewData, current_period: overviewData?.current_period || {}, changes: overviewData?.changes || {},
      granularity: 'total', timePeriod: filters.timePeriod || '30d', filters, tab_type: 'spend', data_source: 'spend_charts'
    });
  };

  const handleVolumeInsights = async () => {
    return await mcpInsightsApi.generateVolumeInsights({
      volumeTrends: volumeChartData.volumeTrends || [], volume_trends: volumeChartData.volumeTrends || [],
      topVolumeProducts: volumeChartData.topVolumeProducts || [], top_volume_products: volumeChartData.topVolumeProducts || [],
      categoryVolumes: volumeChartData.categoryVolumes || [], category_volumes: volumeChartData.categoryVolumes || [],
      seasonalPatterns: volumeChartData.seasonalPatterns || [], seasonal_patterns: volumeChartData.seasonalPatterns || [],
      overviewData, current_period: overviewData?.current_period || {}, changes: overviewData?.changes || {},
      granularity: 'total', timePeriod: filters.timePeriod || '30d', filters, tab_type: 'volume', data_source: 'volume_charts'
    });
  };

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)} L`;
    return `₹${value.toLocaleString('en-IN')}`;
  };

  const formatVolume = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K kg`;
    return `${Math.round(value)} kg`;
  };

  // KPI cards config
  const kpiCards = overviewData ? [
    { label: "TOTAL SPEND", value: formatCurrency(overviewData.current_period?.total_spend || 0), change: overviewData.changes?.total_spend_change, icon: DollarSign, sparkline: sparklineData.spend },
    { label: "TOTAL VOLUME", value: formatVolume(overviewData.current_period?.total_volume || 0), change: overviewData.changes?.total_volume_change, icon: Package, sparkline: sparklineData.volume },
    { label: "ORDER COUNT", value: (overviewData.current_period?.order_count || 0).toLocaleString(), change: overviewData.changes?.order_count_change, icon: ShoppingCart, sparkline: sparklineData.orders },
    { label: "AVG ORDER VALUE", value: formatCurrency(overviewData.current_period?.avg_order_value || 0), change: overviewData.changes?.avg_order_value_change, icon: BarChart3, sparkline: sparklineData.aov },
  ] : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Header — inline title + branch selector */}
      <div className="border-b border-border">
        <div className="frame-container mx-auto px-5 py-3">
          <div className="flex items-center justify-between">
            <h1 className="font-playfair text-xl font-semibold text-foreground">Analytics</h1>
            <BranchFilterSelector />
          </div>
        </div>
      </div>

      <div className="frame-container mx-auto px-5 py-4 space-y-5">
        {/* Compact Inline Filters */}
        <DashboardFilters filters={filters} onFiltersChange={setFilters} />
        
        {/* Tab Bar — minimal underline style */}
        <div className="border-b border-border">
          <nav className="flex gap-6">
            {TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSelectedTab(tab.value)}
                className={`tab-modern pb-3 text-sm ${selectedTab === tab.value ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {selectedTab === "overview" && (
          <div className="space-y-5">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading dashboard data...</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-16 text-destructive">
                <span>{error}</span>
              </div>
            ) : (
              <>
                {/* Row 1: KPI Cards with Sparklines */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {kpiCards.map((kpi, i) => (
                    <SparklineKPICard
                      key={kpi.label}
                      label={kpi.label}
                      value={kpi.value}
                      change={kpi.change}
                      icon={kpi.icon}
                      sparklineData={kpi.sparkline}
                      index={i}
                    />
                  ))}
                </div>

                {/* Row 2: Glance + Forecast */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <WeeklyGlanceCard overviewData={overviewData} />
                  <ForecastWidget />
                </div>

                {/* Row 3: Category Health Bar */}
                <CategoryHealthBar filters={filtersWithBranch} />

                {/* Row 4: Smart Insights — always visible */}
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-rubik text-sm font-semibold text-foreground">Smart Insights</h3>
                  <SmartInsightsPopover
                    tabType="overview"
                    analyticsData={{ overview: overviewData, filters: filtersWithBranch }}
                    isDataLoaded={!loading && !!overviewData?.current_period}
                    onGenerateInsights={handleOverviewInsights}
                  />
                </div>
                <SmartInsightsTab filters={filtersWithBranch} overviewData={overviewData} hasData={!!overviewData?.current_period} />

                {/* Branch Breakdown */}
                {!branchId && (user as any)?.role === 'client_admin' && branches.length >= 2 && (
                  <BranchBreakdownSection filters={filters} />
                )}
              </>
            )}
          </div>
        )}

        {/* Spend Tab */}
        {selectedTab === "spend" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-rubik text-base font-semibold text-foreground">Spend Analysis</h2>
              <div className="flex items-center gap-2">
                <SmartInsightsPopover
                  tabType="spend"
                  analyticsData={{ overview: overviewData, filters: filtersWithBranch, spendTrends: spendChartData.spendTrends, topProducts: spendChartData.topProducts, categoryBreakdown: spendChartData.categoryBreakdown, weekdayPatterns: spendChartData.weekdayPatterns }}
                  isDataLoaded={!loading && (spendChartData.spendTrends.length > 0 || !!overviewData?.current_period)}
                  onGenerateInsights={handleSpendInsights}
                />
                <Button variant="ghost" size="icon" onClick={handleExportSpendData} disabled={isExportingSpend} className="h-8 w-8">
                  {isExportingSpend ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
            
            <InteractiveSpendChart filters={filtersWithBranch} onDataLoad={onSpendTrendsLoad} />
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-5 items-start">
              <div className="lg:col-span-4">
                <CategoryAnalysisCharts filters={filtersWithBranch} onDataLoad={onCategoryLoad} />
              </div>
              <div className="lg:col-span-6">
                <TopSKUsComponent filters={filtersWithBranch} type="spend" />
              </div>
            </div>
            <TopSKUsByWeekday filters={filtersWithBranch} type="spend" />
          </div>
        )}

        {/* Volume Tab */}
        {selectedTab === "volume" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-rubik text-base font-semibold text-foreground">Volume Analysis</h2>
              <SmartInsightsPopover
                tabType="volume"
                analyticsData={{ overview: overviewData, filters: filtersWithBranch, volumeTrends: volumeChartData.volumeTrends, topVolumeProducts: volumeChartData.topVolumeProducts, categoryVolumes: volumeChartData.categoryVolumes, seasonalPatterns: volumeChartData.seasonalPatterns }}
                isDataLoaded={!loading && (volumeChartData.volumeTrends.length > 0 || !!overviewData?.current_period)}
                onGenerateInsights={handleVolumeInsights}
              />
            </div>
            
            <InteractiveVolumeChart filters={filtersWithBranch} onDataLoad={onVolumeTrendsLoad} />
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-5 items-start">
              <div className="lg:col-span-4 h-full">
                <CategoryAnalysisCharts filters={filtersWithBranch} />
              </div>
              <div className="lg:col-span-6">
                <TopSKUsComponent filters={filtersWithBranch} type="volume" />
              </div>
            </div>
            <TopSKUsByWeekday filters={filtersWithBranch} type="volume" />
          </div>
        )}
      </div>
    </div>
  );
}
