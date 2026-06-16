import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, TrendingUp, Loader2 } from "lucide-react";
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { spendAnalyticsApi, SpendTrendData } from "@/api/spendAnalyticsApi";
import { exportComparisonAnalysis } from "@/utils/excelExport";

interface ComparisonAnalysisTabProps {
  filters: any;
}

interface ComparisonDataPoint {
  period: string;
  spend: number;
  volume: number;
  efficiency: number; // spend per kg
}

export default function ComparisonAnalysisTab({ filters }: ComparisonAnalysisTabProps) {
  const [periodType, setPeriodType] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [isExporting, setIsExporting] = useState(false);
  const [comparisonData, setComparisonData] = useState<ComparisonDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch spend vs volume comparison data
  useEffect(() => {
    const fetchComparisonData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await spendAnalyticsApi.getSpendTrends({
          timePeriod: filters.timePeriod || '30d',
          granularity: periodType,
          category: filters.category !== 'all' ? filters.category : undefined,
          productId: filters.product !== 'all' ? filters.product : undefined,
          startDate: filters.startDate,
          endDate: filters.endDate
        });
        
        // Transform API data to comparison format
        const transformedData: ComparisonDataPoint[] = response.map((item: SpendTrendData) => {
          const date = new Date(item.period);
          let formattedPeriod: string;
          
          // Format based on granularity
          switch(periodType) {
            case 'daily':
              formattedPeriod = date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              });
              break;
            case 'weekly':
              formattedPeriod = `Week of ${date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}`;
              break;
            case 'monthly':
              formattedPeriod = date.toLocaleDateString('en-US', { 
                month: 'short', 
                year: 'numeric' 
              });
              break;
            default:
              formattedPeriod = date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              });
          }
          
          return {
            period: formattedPeriod,
            spend: item.total_spend,
            volume: item.total_volume_kg,
            efficiency: item.total_volume_kg > 0 ? item.total_spend / item.total_volume_kg : 0
          };
        });
        
        setComparisonData(transformedData);
      } catch (err) {
        console.error('Error fetching comparison data:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load comparison data';
        setError(`Failed to load comparison data: ${errorMessage}`);
        setComparisonData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchComparisonData();
  }, [filters, periodType]);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      exportComparisonAnalysis(comparisonData, filters, periodType);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Calculate summary metrics
  const totalSpend = comparisonData.reduce((sum, item) => sum + item.spend, 0);
  const totalVolume = comparisonData.reduce((sum, item) => sum + item.volume, 0);
  const avgEfficiency = totalVolume > 0 ? totalSpend / totalVolume : 0;

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey === 'spend' && `Spend: ₹${entry.value.toLocaleString()}`}
              {entry.dataKey === 'volume' && `Volume: ${entry.value.toFixed(1)} kg`}
              {entry.dataKey === 'efficiency' && `Cost/kg: ₹${entry.value.toFixed(2)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-semibold">Spend vs Volume Comparison</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-1" />
              {isExporting ? "Exporting..." : "Export Data"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading comparison data...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64 text-red-500">
              <span>{error}</span>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="text-sm text-muted-foreground">Total Spend</div>
                  <div className="text-xl font-bold text-foreground">₹{totalSpend.toLocaleString()}</div>
                  <div className="text-xs text-green-600 mt-1">Procurement cost</div>
                </div>
                <div className="p-4 rounded-lg bg-secondary/10 border border-secondary/20">
                  <div className="text-sm text-muted-foreground">Total Volume</div>
                  <div className="text-xl font-bold text-foreground">{totalVolume.toFixed(1)} kg</div>
                  <div className="text-xs text-blue-600 mt-1">Products purchased</div>
                </div>
                <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                  <div className="text-sm text-muted-foreground">Average Cost/kg</div>
                  <div className="text-xl font-bold text-foreground">₹{avgEfficiency.toFixed(2)}</div>
                  <div className="text-xs text-purple-600 mt-1">Procurement efficiency</div>
                </div>
              </div>

              {/* Granularity Tabs */}
              <Tabs value={periodType} onValueChange={(value) => setPeriodType(value as "daily" | "weekly" | "monthly")} className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="daily">Daily</TabsTrigger>
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                </TabsList>

                {/* Comparison Chart */}
                <div className="mt-6">
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="period" 
                        className="text-xs"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        yAxisId="spend"
                        orientation="left"
                        className="text-xs"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                        domain={['auto', 'auto']}
                      />
                      <YAxis
                        yAxisId="volume"
                        orientation="right"
                        className="text-xs"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${value.toFixed(0)}kg`}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      
                      {/* Spend as bars */}
                      <Bar 
                        yAxisId="spend"
                        dataKey="spend" 
                        fill="hsl(var(--primary))"
                        fillOpacity={0.6}
                        name="Spend (₹)"
                        radius={[2, 2, 0, 0]}
                      />
                      
                      {/* Volume as line */}
                      <Line 
                        yAxisId="volume"
                        type="monotone" 
                        dataKey="volume" 
                        stroke="hsl(var(--secondary))"
                        strokeWidth={3}
                        name="Volume (kg)"
                        dot={{ fill: "hsl(var(--secondary))", strokeWidth: 2, r: 4 }}
                      />
                      
                      {/* Efficiency as line */}
                      <Line 
                        yAxisId="spend"
                        type="monotone" 
                        dataKey="efficiency" 
                        stroke="hsl(var(--accent))"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Cost/kg (₹)"
                        dot={{ fill: "hsl(var(--accent))", strokeWidth: 2, r: 3 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </Tabs>

              {/* Insights */}
              <div className="mt-6 p-4 rounded-lg bg-muted/20 border">
                <h4 className="font-medium text-foreground mb-2">Comparison Insights</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Spend and volume trends show procurement patterns over time</p>
                  <p>• Cost per kg efficiency helps identify optimal purchasing periods</p>
                  <p>• Data based on approved invoices from selected time period</p>
                  <p>• Switch between daily, weekly, and monthly views for different perspectives</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
