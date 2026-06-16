import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Droplets,
  Wind,
  Zap,
} from 'lucide-react';
import {
  type InsightItem,
  BRANCH_FORECASTS,
  BRANCH_WEATHER,
  BRANCH_INSIGHTS,
  DEFAULT_WEATHER,
  DEFAULT_FORECAST,
  DEFAULT_INSIGHTS,
} from './insightsData';

interface SmartOrderInsightsProps {
  branchName?: string;
  tomorrowDay: string;
}

const SmartOrderInsights: React.FC<SmartOrderInsightsProps> = ({ branchName, tomorrowDay }) => {
  const weather = useMemo(() => {
    if (branchName && BRANCH_WEATHER[branchName]) return BRANCH_WEATHER[branchName];
    return DEFAULT_WEATHER;
  }, [branchName]);

  const forecast = useMemo(() => {
    if (branchName && BRANCH_FORECASTS[branchName]) return BRANCH_FORECASTS[branchName];
    return DEFAULT_FORECAST;
  }, [branchName]);

  const insights = useMemo(() => {
    if (branchName && BRANCH_INSIGHTS[branchName]) return BRANCH_INSIGHTS[branchName];
    return DEFAULT_INSIGHTS;
  }, [branchName]);

  const getTypeStyles = (type: InsightItem['type']) => {
    switch (type) {
      case 'positive': return 'border-l-green-500 bg-green-50/50';
      case 'warning': return 'border-l-orange-500 bg-orange-50/50';
      case 'negative': return 'border-l-red-500 bg-red-50/50';
      case 'info': return 'border-l-blue-500 bg-blue-50/50';
    }
  };

  const getIconColor = (type: InsightItem['type']) => {
    switch (type) {
      case 'positive': return 'text-green-600';
      case 'warning': return 'text-orange-600';
      case 'negative': return 'text-red-600';
      case 'info': return 'text-blue-600';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'HIGH': return 'bg-red-100 text-red-700';
      case 'MEDIUM': return 'bg-orange-100 text-orange-700';
      case 'LOW': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const WeatherIcon = weather.icon;

  return (
    <Card className="h-full overflow-hidden flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-100 rounded-lg">
              <Zap className="h-3.5 w-3.5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold font-playfair">Order Insights</h3>
              <p className="text-[10px] text-muted-foreground font-rubik truncate">
                {branchName ? `${branchName} · ${tomorrowDay}` : 'AI-powered forecast & alerts'}
              </p>
            </div>
          </div>

          {/* Weather Card */}
          <div className="rounded-lg bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-sky-700 font-rubik">
                {branchName ? `Weather · ${branchName}` : "Tomorrow's Weather"}
              </span>
              <WeatherIcon className="h-4 w-4 text-sky-600" />
            </div>
            <div className="flex items-baseline gap-1.5 mb-1.5">
              <span className="text-2xl font-bold text-sky-900 font-rubik">{weather.temp}°C</span>
              <span className="text-xs text-sky-600 font-rubik">{weather.condition}</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-sky-600 font-rubik">
              <span className="flex items-center gap-1">
                <Droplets className="h-3 w-3" />
                {weather.humidity}% humidity
              </span>
              <span className="flex items-center gap-1">
                <Wind className="h-3 w-3" />
                {weather.wind} km/h
              </span>
            </div>
          </div>

          {/* Forecast Summary */}
          <div className="rounded-lg bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-violet-700 font-rubik">
                {branchName ? `Forecast · ${branchName}` : 'Order Forecast'}
              </span>
              <Badge className="bg-violet-100 text-violet-700 text-[10px] px-1.5 py-0 font-rubik">
                {forecast.changeFromLastWeek} vs last week
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <p className="text-[10px] text-violet-500 font-rubik">Predicted Items</p>
                <p className="text-lg font-bold text-violet-900 font-rubik">{forecast.totalItems}</p>
              </div>
              <div>
                <p className="text-[10px] text-violet-500 font-rubik">Est. Spend</p>
                <p className="text-lg font-bold text-violet-900 font-rubik">{forecast.estimatedSpend}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {forecast.topItems.map((item) => (
                <Badge
                  key={item}
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 bg-violet-100/80 text-violet-600 font-rubik"
                >
                  {item}
                </Badge>
              ))}
            </div>
          </div>

          {/* Insights List */}
          <div className="space-y-2">
            <span className="text-[11px] font-medium text-muted-foreground font-rubik uppercase tracking-wide">
              Alerts & Recommendations
            </span>
            {insights.map((insight, index) => {
              const Icon = insight.icon;
              return (
                <div
                  key={`${branchName}-${index}`}
                  className={`border-l-[3px] rounded-r-lg p-2.5 ${getTypeStyles(insight.type)}`}
                >
                  <div className="flex items-start gap-2">
                    <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${getIconColor(insight.type)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-semibold font-rubik truncate">
                          {insight.title}
                        </span>
                        {insight.impact && (
                          <Badge className={`${getImpactColor(insight.impact)} text-[9px] px-1 py-0 shrink-0`}>
                            {insight.impact}
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground font-rubik leading-relaxed">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </Card>
  );
};

export default SmartOrderInsights;
