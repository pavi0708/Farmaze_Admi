import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CalendarDays,
  CloudRain,
  CloudSun,
  Cloud,
  Sun,
  Snowflake,
  Thermometer,
  Droplets,
  ChevronRight,
} from 'lucide-react';
import analyticsApi, {
  type SuggestionContext,
  type UpcomingFestival,
} from '@/api/analyticsApi';

interface CalendarContextCardProps {
  context: SuggestionContext | null;
}

function getWeatherIcon(condition: string) {
  const c = (condition || '').toLowerCase();
  if (c.includes('rain')) return CloudRain;
  if (c.includes('cloud') && c.includes('part')) return CloudSun;
  if (c.includes('cloud')) return Cloud;
  if (c.includes('snow')) return Snowflake;
  return Sun;
}

function getFestivalTypeBadge(type: string): string {
  switch (type) {
    case 'hindu': return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'islamic': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'christian': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'hindu_observance': return 'bg-purple-100 text-purple-700 border-purple-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

const CalendarContextCard: React.FC<CalendarContextCardProps> = ({ context }) => {
  const [upcomingFestivals, setUpcomingFestivals] = useState<UpcomingFestival[]>([]);

  useEffect(() => {
    analyticsApi.getUpcomingFestivals(14).then(setUpcomingFestivals).catch(() => {});
  }, []);

  if (!context) return null;

  const tamilMonth = context.tamil_month;
  const temp = context.temperature;
  const condition = context.weather_condition;
  const WeatherIcon = condition ? getWeatherIcon(condition) : Sun;
  const festivalDetails = context.festival_details || [];

  // Filter upcoming festivals to exclude active ones
  const activeFestivalNames = new Set(context.festivals || []);
  const upcoming = upcomingFestivals
    .filter(f => f.days_until > 0 && !activeFestivalNames.has(f.name))
    .slice(0, 4);

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tamil Month + Active Festivals */}
          <div className="space-y-2">
            {tamilMonth?.name && tamilMonth.name !== 'Unknown' && (
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary/60" />
                <span className="text-sm font-semibold font-playfair">{tamilMonth.name}</span>
              </div>
            )}
            {tamilMonth?.significance && (
              <p className="text-xs text-muted-foreground font-rubik">{tamilMonth.significance}</p>
            )}

            {/* Active festivals */}
            {festivalDetails.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {festivalDetails.map((fest) => (
                  <div key={fest.name} className="flex items-start gap-1.5">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${getFestivalTypeBadge(fest.type)}`}>
                      {fest.name}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground font-rubik">{fest.description}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Observance flags */}
            {context.is_purattasi && (
              <div className="flex items-center gap-1.5 text-xs font-rubik">
                <Badge variant="outline" className="text-[10px] bg-purple-100 text-purple-700 border-purple-200">Purattasi</Badge>
                <span className="text-purple-600">Non-veg ↓70% · Veg ↑30%</span>
              </div>
            )}
            {context.is_aadi && (
              <div className="flex items-center gap-1.5 text-xs font-rubik">
                <Badge variant="outline" className="text-[10px] bg-purple-100 text-purple-700 border-purple-200">Aadi</Badge>
                <span className="text-purple-600">Non-veg ↓40% · No weddings</span>
              </div>
            )}
            {context.is_muhurtham && (
              <div className="flex items-center gap-1.5 text-xs font-rubik">
                <Badge variant="outline" className="text-[10px] bg-pink-100 text-pink-700 border-pink-200">Muhurtham</Badge>
                <span className="text-pink-600">Wedding day — catering demand spike</span>
              </div>
            )}
            {context.is_ramadan && (
              <div className="flex items-center gap-1.5 text-xs font-rubik">
                <Badge variant="outline" className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-200">Ramadan</Badge>
                <span className="text-emerald-600">Demand shifts to evening</span>
              </div>
            )}
          </div>

          {/* Weather */}
          <div className="rounded-lg bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100 p-3">
            <div className="flex items-center gap-2 mb-2">
              <WeatherIcon className="h-4 w-4 text-sky-600" />
              <span className="text-xs font-medium text-sky-700 font-rubik">Tomorrow's Weather</span>
            </div>
            {temp != null ? (
              <>
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-xl font-bold text-sky-900 font-rubik">{temp}°C</span>
                  {condition && <span className="text-xs text-sky-600 font-rubik">{condition}</span>}
                </div>
                {context.rainfall_mm > 0 && (
                  <div className="flex items-center gap-1 text-[11px] text-sky-600 font-rubik">
                    <Droplets className="h-3 w-3" />
                    {context.rainfall_mm}mm rain
                    {context.rainfall_mm > 50 && ' — supply disruption likely'}
                  </div>
                )}
                {context.weather_impact && !context.weather_impact.toLowerCase().includes('normal') && (
                  <p className="text-[11px] text-orange-600 font-rubik mt-1">{context.weather_impact}</p>
                )}
              </>
            ) : (
              <p className="text-xs text-sky-500 font-rubik">Weather data unavailable</p>
            )}
          </div>

          {/* Upcoming Festivals */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground font-rubik uppercase tracking-wide">
              Upcoming (next 14 days)
            </span>
            {upcoming.length > 0 ? (
              <div className="space-y-1.5">
                {upcoming.map((fest) => (
                  <div key={fest.name} className="flex items-center gap-2 text-xs font-rubik">
                    <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${getFestivalTypeBadge(fest.type)}`}>
                      {fest.name}
                    </Badge>
                    <span className="text-muted-foreground">
                      {fest.days_until === 1 ? 'tomorrow' : `in ${fest.days_until} days`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground font-rubik">No festivals in the next 14 days</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CalendarContextCard;
