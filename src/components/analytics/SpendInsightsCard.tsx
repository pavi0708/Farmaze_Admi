import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Target, Download, AlertTriangle, Lightbulb } from "lucide-react";
import { spendAnalyticsApi } from "@/api/spendAnalyticsApi";
import { mcpInsightsApi } from "@/api/mcpInsightsApi";
import { exportSpendInsights } from "@/utils/excelExport";
import { formatCurrency, formatWeight, formatPercentage, calculateAverageOrderValue, calculateCostPerKg } from "@/utils/formatters";

interface SpendInsightsCardProps {
  filters: any;
  overviewData?: any; // Pass existing dashboard data
  spendTrendsData?: any[]; // Pass existing chart data
  topProductsData?: any[]; // Pass existing chart data
  categoriesData?: any[]; // Pass existing chart data
}

interface MCPInsight {
  type: "positive" | "warning" | "negative";
  title: string;
  description: string;
  metric?: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
  confidence?: number;
}

interface SpendInsight {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  description: string;
  color: string;
}

export default function SpendInsightsCard({ 
  filters, 
  overviewData, 
  spendTrendsData = [], 
  topProductsData = [], 
  categoriesData = [] 
}: SpendInsightsCardProps) {
  const [insights, setInsights] = useState<SpendInsight[]>([]);
  const [mcpInsights, setMcpInsights] = useState<MCPInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [mcpLoading, setMcpLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true);
        
        // Use the data that's already available from dashboard props - NO MORE API CALLS!
        console.log('🎉 USING EXISTING DASHBOARD DATA:', {
          overviewData: overviewData,
          spendTrendsData: { length: spendTrendsData.length, sample: spendTrendsData[0] },
          topProductsData: { length: topProductsData.length, sample: topProductsData[0] },
          categoriesData: { length: categoriesData.length, sample: categoriesData[0] }
        });

        // Use the passed data directly - no HTTP stream issues!
        const storedTrendsData = [...spendTrendsData];
        const storedTopProductsData = [...topProductsData];
        const storedCategoriesData = [...categoriesData];

        console.log('💾 SpendInsightsCard - STORED DATA ARRAYS:', {
          storedTrendsData: { length: storedTrendsData.length, sample: storedTrendsData[0] },
          storedTopProductsData: { length: storedTopProductsData.length, sample: storedTopProductsData[0] },
          storedCategoriesData: { length: storedCategoriesData.length, sample: storedCategoriesData[0] }
        });

        const totalSpend = storedTrendsData.reduce((sum, item) => sum + item.total_spend, 0);
        const totalVolume = storedTrendsData.reduce((sum, item) => sum + item.total_volume_kg, 0);
        const totalOrders = storedTrendsData.reduce((sum, item) => sum + item.order_count, 0);
        const avgOrderValue = calculateAverageOrderValue(totalSpend, totalOrders);
        const costPerKg = calculateCostPerKg(totalSpend, totalVolume);
        
        // Calculate trends (compare first and last periods)
        const spendTrend = storedTrendsData.length > 1 
          ? ((storedTrendsData[storedTrendsData.length - 1].total_spend - storedTrendsData[0].total_spend) / storedTrendsData[0].total_spend * 100)
          : 0;
        
        const volumeTrend = storedTrendsData.length > 1
          ? ((storedTrendsData[storedTrendsData.length - 1].total_volume_kg - storedTrendsData[0].total_volume_kg) / storedTrendsData[0].total_volume_kg * 100)
          : 0;

        const generatedInsights: SpendInsight[] = [
          {
            title: "Total Spend",
            value: formatCurrency(totalSpend),
            change: `${spendTrend >= 0 ? '+' : ''}${formatPercentage(spendTrend)}`,
            trend: spendTrend > 0 ? 'up' : spendTrend < 0 ? 'down' : 'neutral',
            icon: <DollarSign className="h-5 w-5" />,
            description: "Total procurement spend",
            color: "bg-green-50 border-green-200 text-green-800"
          },
          {
            title: "Average Order Value",
            value: formatCurrency(avgOrderValue),
            change: "Per order",
            trend: 'neutral',
            icon: <ShoppingCart className="h-5 w-5" />,
            description: "Average spend per order",
            color: "bg-blue-50 border-blue-200 text-blue-800"
          },
          {
            title: "Cost Efficiency",
            value: `${formatCurrency(costPerKg)}/kg`,
            change: "Per kilogram",
            trend: 'neutral',
            icon: <Target className="h-5 w-5" />,
            description: "Average cost per kilogram",
            color: "bg-purple-50 border-purple-200 text-purple-800"
          },
          {
            title: "Total Volume",
            value: formatWeight(totalVolume),
            change: `${volumeTrend >= 0 ? '+' : ''}${formatPercentage(volumeTrend)}`,
            trend: volumeTrend > 0 ? 'up' : volumeTrend < 0 ? 'down' : 'neutral',
            icon: <Package className="h-5 w-5" />,
            description: "Total volume purchased",
            color: "bg-orange-50 border-orange-200 text-orange-800"
          },
          {
            title: "Categories",
            value: storedCategoriesData.length.toString(),
            change: "Active categories",
            trend: 'neutral',
            icon: <Package className="h-5 w-5" />,
            description: "Number of categories",
            color: "bg-indigo-50 border-indigo-200 text-indigo-800"
          },
          {
            title: "Top Products",
            value: storedTopProductsData.length.toString(),
            change: "Products tracked",
            trend: 'neutral',
            icon: <Package className="h-5 w-5" />,
            description: "Number of top products",
            color: "bg-pink-50 border-pink-200 text-pink-800"
          }
        ];

        setInsights(generatedInsights);
        
        // Generate MCP AI insights with stored data
        const comprehensiveData = {
          spendTrends: storedTrendsData,
          spend_trends: storedTrendsData,
          topProducts: storedTopProductsData,
          top_products: storedTopProductsData,
          categoryBreakdown: storedCategoriesData,
          category_breakdown: storedCategoriesData,
          weekdayPatterns: [],
          weekday_patterns: [],
          granularity: 'total',
          timePeriod: filters.timePeriod || '30d',
          filters: filters
        };

        console.log('📦 SpendInsightsCard - SENDING TO MCP:', {
          spendTrendsLength: storedTrendsData.length,
          topProductsLength: storedTopProductsData.length,
          categoriesLength: storedCategoriesData.length,
          sampleTrend: storedTrendsData[0],
          sampleProduct: storedTopProductsData[0],
          sampleCategory: storedCategoriesData[0]
        });

        // Validate data before calling MCP - don't send empty data
        const hasValidData = storedTrendsData.length > 0 || storedTopProductsData.length > 0 || storedCategoriesData.length > 0;
        
        if (hasValidData) {
          console.log('✅ Valid data found, generating MCP insights...');
          await generateMCPInsights(comprehensiveData);
        } else {
          console.log('❌ No valid data found - skipping MCP insights generation');
          setMcpInsights([{
            type: "warning",
            title: "No Data Available",
            description: "No spend data available for the selected time period. Please adjust your filters or check if there are any approved invoices for this period.",
            metric: "0 data points",
            impact: "LOW",
            confidence: 1.0
          }]);
        }
        
      } catch (error) {
        console.error('Error fetching spend insights:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [filters]);

  const generateMCPInsights = async (comprehensiveData: any) => {
    try {
      setMcpLoading(true);
      const aiInsights = await mcpInsightsApi.generateSpendInsights(comprehensiveData);
      setMcpInsights(aiInsights || []);
    } catch (error) {
      console.error('Error generating MCP insights:', error);
      setMcpInsights([]);
    } finally {
      setMcpLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      exportSpendInsights(insights, filters);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Spend Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="p-4 rounded-lg bg-gray-50 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Spend Insights & Metrics
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
          >
            <Download className="h-4 w-4 mr-1" />
            {isExporting ? "Exporting..." : "Export Excel"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${insight.color}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1">
                  {insight.icon}
                  <span className="text-xs font-medium">{insight.title}</span>
                </div>
                {insight.trend !== 'neutral' && (
                  <div className="flex items-center gap-1">
                    {insight.trend === 'up' ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-600" />
                    )}
                  </div>
                )}
              </div>
              
              <div className="mb-1">
                <span className="text-lg font-bold">{insight.value}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{insight.description}</span>
                <Badge variant="outline" className="text-xs">
                  {insight.change}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* AI-Powered Smart Insights */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-primary" />
            <h4 className="font-medium text-foreground">AI Smart Insights</h4>
            {mcpLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
            )}
          </div>
          
          {mcpInsights.length > 0 ? (
            <div className="space-y-3">
              {mcpInsights.map((insight, index) => {
                const getInsightIcon = (type: string) => {
                  switch (type) {
                    case 'positive': return <TrendingUp className="h-4 w-4 text-green-600" />;
                    case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
                    case 'negative': return <TrendingDown className="h-4 w-4 text-red-600" />;
                    default: return <Lightbulb className="h-4 w-4 text-blue-600" />;
                  }
                };
                
                const getInsightColor = (type: string) => {
                  switch (type) {
                    case 'positive': return 'border-green-200 bg-green-50';
                    case 'warning': return 'border-yellow-200 bg-yellow-50';
                    case 'negative': return 'border-red-200 bg-red-50';
                    default: return 'border-blue-200 bg-blue-50';
                  }
                };

                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}
                  >
                    <div className="flex items-start gap-3">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-sm">{insight.title}</h5>
                          <div className="flex items-center gap-2">
                            {insight.metric && (
                              <Badge variant="outline" className="text-xs">
                                {insight.metric}
                              </Badge>
                            )}
                            <Badge 
                              variant={insight.impact === 'HIGH' ? 'destructive' : insight.impact === 'MEDIUM' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {insight.impact}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {insight.description}
                        </p>
                        {insight.confidence && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            Confidence: {Math.round(insight.confidence * 100)}%
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : mcpLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="p-4 rounded-lg bg-gray-50 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
              <p className="text-sm text-muted-foreground">
                AI insights will appear here once analytics data is processed.
              </p>
            </div>
          )}
        </div>

        {/* Additional Insights */}
        <div className="mt-6 p-4 rounded-lg bg-muted/20 border">
          <h4 className="font-medium text-foreground mb-2">Quick Insights</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Spend data based on approved invoices from selected time period</p>
            <p>• Cost efficiency calculated as total spend divided by total volume</p>
            <p>• Trends compare current period with previous data points</p>
            <p>• Use filters above to analyze specific categories or products</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
