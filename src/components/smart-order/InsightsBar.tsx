import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Droplets, Wind, AlertTriangle, TrendingUp, ShoppingBasket } from 'lucide-react';
import {
  type InsightItem,
  BRANCH_FORECASTS,
  BRANCH_WEATHER,
  DEFAULT_WEATHER,
  DEFAULT_FORECAST,
  BRANCH_INSIGHTS,
  DEFAULT_INSIGHTS,
} from './insightsData';

interface InsightsBarProps {
  branchName?: string;
  tomorrowDay: string;
}

const getTypeStyles = (type: InsightItem['type']) => {
  switch (type) {
    case 'positive': return 'border-l-emerald-400 bg-gradient-to-r from-emerald-50/80 to-emerald-50/20';
    case 'warning': return 'border-l-amber-400 bg-gradient-to-r from-amber-50/80 to-amber-50/20';
    case 'negative': return 'border-l-rose-400 bg-gradient-to-r from-rose-50/80 to-rose-50/20';
    case 'info': return 'border-l-blue-400 bg-gradient-to-r from-blue-50/80 to-blue-50/20';
  }
};

const getIconColor = (type: InsightItem['type']) => {
  switch (type) {
    case 'positive': return 'text-emerald-500';
    case 'warning': return 'text-amber-500';
    case 'negative': return 'text-rose-500';
    case 'info': return 'text-blue-500';
  }
};

const getImpactColor = (impact: string) => {
  switch (impact) {
    case 'HIGH': return 'bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/20';
    case 'MEDIUM': return 'bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20';
    case 'LOW': return 'bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/20';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const InsightsBar: React.FC<InsightsBarProps> = ({ branchName, tomorrowDay }) => {
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

  const WeatherIcon = weather.icon;

  return (
    <div className="space-y-2.5">
      {/* Row 1: Weather + Forecast + Top Items — single horizontal bar */}
      <div className="flex items-center gap-3 px-3.5 py-2.5 bg-gradient-to-r from-slate-50/80 via-white to-violet-50/40 border border-gray-100/80 rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        {/* Weather */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="p-1 bg-sky-50 rounded-lg">
            <WeatherIcon className="h-3.5 w-3.5 text-sky-500" />
          </div>
          <span className="text-sm font-semibold text-sky-900 font-rubik tabular-nums">
            {weather.temp}°C
          </span>
          <span className="text-[11px] text-sky-500 font-rubik hidden sm:inline">
            {weather.condition}
          </span>
          <div className="hidden md:flex items-center gap-1.5 text-[10px] text-sky-400 font-rubik">
            <span className="flex items-center gap-0.5">
              <Droplets className="h-2.5 w-2.5" />
              {weather.humidity}%
            </span>
            <span className="flex items-center gap-0.5">
              <Wind className="h-2.5 w-2.5" />
              {weather.wind}km/h
            </span>
          </div>
        </div>

        <div className="h-5 w-px bg-gray-200/60 shrink-0" />

        {/* Forecast */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="p-1 bg-violet-50 rounded-lg">
            <ShoppingBasket className="h-3.5 w-3.5 text-violet-500" />
          </div>
          <span className="text-xs font-semibold text-violet-800 font-rubik tabular-nums">
            {forecast.totalItems} items
          </span>
          <span className="text-xs text-muted-foreground/70 font-rubik hidden sm:inline">
            ~{forecast.estimatedSpend}
          </span>
          <Badge className="bg-violet-500/8 text-violet-600 ring-1 ring-violet-500/15 text-[10px] px-1.5 py-0 font-rubik shrink-0 hidden md:inline-flex shadow-none">
            {forecast.changeFromLastWeek} vs last week
          </Badge>
        </div>

        <div className="h-5 w-px bg-gray-200/60 shrink-0 hidden lg:block" />

        {/* Top items */}
        <div className="hidden lg:flex items-center gap-1 flex-1 min-w-0 overflow-hidden">
          {forecast.topItems.slice(0, 4).map((item) => (
            <Badge
              key={item}
              variant="secondary"
              className="text-[10px] px-2 py-0.5 bg-white/80 text-violet-600 font-rubik shrink-0 border border-violet-100/60 shadow-none"
            >
              {item}
            </Badge>
          ))}
        </div>
      </div>

      {/* Row 2: Alerts & Insights — horizontal scrollable cards */}
      {insights.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-thin">
          {insights.map((insight, index) => {
            const Icon = insight.icon;
            return (
              <div
                key={`${branchName}-${index}`}
                className={`border-l-[3px] rounded-xl px-3 py-2 flex items-start gap-2 shrink-0 min-w-[210px] max-w-[280px] transition-all duration-200 hover:scale-[1.02] hover:shadow-md cursor-default ${getTypeStyles(insight.type)}`}
              >
                <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${getIconColor(insight.type)}`} />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[11px] font-semibold font-rubik truncate">
                      {insight.title}
                    </span>
                    {insight.impact && (
                      <Badge className={`${getImpactColor(insight.impact)} text-[8px] px-1.5 py-0 shrink-0 shadow-none font-semibold`}>
                        {insight.impact}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground/80 font-rubik leading-snug line-clamp-2">
                    {insight.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InsightsBar;
