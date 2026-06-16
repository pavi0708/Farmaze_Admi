import React from "react";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, TrendingUp, Lightbulb } from "lucide-react";
import { DashboardFilters } from "./DashboardFilters";

interface SmartInsightsTabProps {
  filters: DashboardFilters;
  overviewData?: any;
  hasData?: boolean;
}

interface Insight {
  type: "positive" | "warning" | "negative";
  icon: React.ElementType;
  title: string;
  description: string;
  metric?: string;
  recommendation?: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
}

export default function SmartInsightsTab({ filters, overviewData, hasData = false }: SmartInsightsTabProps) {
  if (!hasData || !overviewData) {
    return (
      <div className="dashboard-card">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
            <Lightbulb className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">No Insights Available</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            Smart insights will appear here once you have sufficient order and analytics data.
          </p>
        </div>
      </div>
    );
  }

  const insights: Insight[] = [];

  if (overviewData?.changes) {
    const changes = overviewData.changes;
    const current = overviewData.current_period;

    if (Math.abs(changes.total_spend_change) > 5) {
      insights.push({
        type: changes.total_spend_change > 0 ? "positive" : "negative",
        icon: changes.total_spend_change > 0 ? TrendingUp : TrendingDown,
        title: `Spend ${changes.total_spend_change > 0 ? 'Increased' : 'Decreased'} ${Math.abs(changes.total_spend_change).toFixed(1)}%`,
        description: `Total expenditure ${changes.total_spend_change > 0 ? 'rose to' : 'dropped to'} ₹${current?.total_spend?.toLocaleString('en-IN') || '0'} compared to the previous period.`,
        metric: `₹${Math.abs((current?.total_spend || 0) * changes.total_spend_change / 100).toLocaleString('en-IN')} ${changes.total_spend_change > 0 ? 'increase' : 'decrease'}`,
        impact: Math.abs(changes.total_spend_change) > 20 ? "HIGH" : Math.abs(changes.total_spend_change) > 10 ? "MEDIUM" : "LOW"
      });
    }

    if (Math.abs(changes.total_volume_change) > 5) {
      insights.push({
        type: changes.total_volume_change > 0 ? "positive" : "warning",
        icon: changes.total_volume_change > 0 ? TrendingUp : TrendingDown,
        title: `Volume ${changes.total_volume_change > 0 ? 'Increased' : 'Decreased'} ${Math.abs(changes.total_volume_change).toFixed(1)}%`,
        description: `Total volume procured ${changes.total_volume_change > 0 ? 'increased to' : 'decreased to'} ${current?.total_volume?.toLocaleString() || '0'} kg.`,
        metric: `${Math.abs((current?.total_volume || 0) * changes.total_volume_change / 100).toFixed(0)} kg ${changes.total_volume_change > 0 ? 'more' : 'less'}`,
        impact: Math.abs(changes.total_volume_change) > 25 ? "HIGH" : "MEDIUM"
      });
    }

    if (Math.abs(changes.avg_order_value_change) > 5) {
      insights.push({
        type: changes.avg_order_value_change > 0 ? "positive" : "warning",
        icon: changes.avg_order_value_change > 0 ? TrendingUp : TrendingDown,
        title: `AOV ${changes.avg_order_value_change > 0 ? 'Improved' : 'Declined'} ${Math.abs(changes.avg_order_value_change).toFixed(1)}%`,
        description: `Your average order value is now ₹${current?.avg_order_value?.toLocaleString('en-IN') || '0'}.`,
        recommendation: changes.avg_order_value_change < 0 ? "Consider bulk ordering to improve cost efficiency." : undefined,
        impact: "MEDIUM"
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      type: "positive", icon: Lightbulb,
      title: "Data Available for Analysis",
      description: "Your order data is being processed. More detailed insights will appear as you continue using the platform.",
      impact: "LOW"
    });
  }

  const getStyles = (type: Insight["type"]) => {
    switch (type) {
      case "positive": return { bg: "bg-primary/5", text: "text-foreground", accent: "text-primary", border: "border-primary/20" };
      case "warning": return { bg: "bg-secondary/5", text: "text-foreground", accent: "text-secondary", border: "border-secondary/20" };
      case "negative": return { bg: "bg-secondary/10", text: "text-foreground", accent: "text-secondary", border: "border-secondary/30" };
    }
  };

  return (
    <div className="space-y-3">
      {insights.map((insight, index) => {
        const styles = getStyles(insight.type);
        const Icon = insight.icon;
        return (
          <div key={index} className={`${styles.bg} border ${styles.border} rounded-xl p-4`}>
            <div className="flex items-start gap-3">
              <Icon className={`h-4 w-4 ${styles.accent} mt-0.5 shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className={`text-sm font-semibold ${styles.text}`}>{insight.title}</h4>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                    insight.impact === 'HIGH' ? 'bg-secondary/10 text-secondary' : insight.impact === 'MEDIUM' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                  }`}>{insight.impact}</span>
                </div>
                <p className={`text-xs ${styles.text} opacity-80 mt-1`}>{insight.description}</p>
                {insight.metric && (
                  <span className={`inline-block mt-2 text-xs font-semibold ${styles.accent}`}>{insight.metric}</span>
                )}
                {insight.recommendation && (
                  <p className={`text-xs ${styles.text} opacity-70 mt-2 border-l-2 ${styles.border} pl-2`}>{insight.recommendation}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
