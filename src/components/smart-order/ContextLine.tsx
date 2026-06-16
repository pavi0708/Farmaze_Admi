import React, { useState } from 'react';
import {
  Cloud,
  CloudSun,
  CloudRain,
  Sun,
  Snowflake,
  ChevronDown,
  ChevronUp,
  Droplets,
  Sparkles,
  AlertTriangle,
  ShoppingBasket,
} from 'lucide-react';
import type { SuggestionContext } from '@/api/analyticsApi';

interface ContextLineProps {
  context: SuggestionContext | null;
  itemCount: number;
  tomorrowDay: string;
}

function getWeatherIcon(condition: string) {
  const c = (condition || '').toLowerCase();
  if (c.includes('rain')) return CloudRain;
  if (c.includes('cloud') && c.includes('part')) return CloudSun;
  if (c.includes('cloud')) return Cloud;
  if (c.includes('snow')) return Snowflake;
  return Sun;
}

/** Build a single actionable advice sentence from context */
function buildAdviceLine(ctx: SuggestionContext | null, itemCount: number, tomorrowDay: string): string {
  if (!ctx) return `${itemCount} items predicted for ${tomorrowDay} based on your ordering pattern.`;

  const parts: string[] = [];

  // Observance-based advice (highest priority)
  if (ctx.is_purattasi) {
    parts.push('Purattasi month — reduce non-veg orders by ~70%, increase veg alternatives');
  } else if (ctx.is_aadi) {
    parts.push('Aadi month — reduce non-veg orders by ~40%, no wedding catering expected');
  }

  if (ctx.is_muhurtham) {
    parts.push('Wedding day tomorrow — stock up on catering items (rice, coconut, curd, ghee)');
  }

  if (ctx.is_ramadan) {
    parts.push('Ramadan — expect demand shift to evening hours, biryani ingredients may spike');
  }

  // Festival-based advice
  const festivalDetails = ctx.festival_details || [];
  for (const fest of festivalDetails) {
    if (fest.nonveg_multiplier < 0.7) {
      parts.push(`${fest.name} — cut non-veg orders, dine-in will drop`);
    } else if (fest.nonveg_multiplier > 1.3) {
      parts.push(`${fest.name} — non-veg demand will spike, order extra`);
    } else if (fest.catering_multiplier > 1.3) {
      parts.push(`${fest.name} — catering demand up, stock ${fest.spike_products.slice(0, 3).join(', ')}`);
    } else if (fest.veg_multiplier > 1.1) {
      parts.push(`${fest.name} — veg demand increases`);
    }
  }

  // Weather-based advice
  const rainfall = ctx.rainfall_mm || 0;
  const temp = ctx.temperature;
  if (rainfall > 50) {
    parts.push(`Heavy rain (${rainfall}mm) — Koyambedu supply may be delayed, order extra today`);
  } else if (rainfall > 10) {
    parts.push(`Rain expected (${rainfall}mm) — leafy greens may see price spikes`);
  }
  if (temp != null && temp > 40) {
    parts.push('Extreme heat — beverages demand up ~30%, reduce heavy meal ingredients');
  }

  // If nothing special, show a calm normal-day message
  if (parts.length === 0) {
    const tamilName = ctx.tamil_month?.name;
    const tempStr = temp != null ? `${temp}°C` : '';
    const condStr = ctx.weather_condition || '';
    const weatherBit = tempStr && condStr ? ` ${tempStr}, ${condStr} —` : '';
    const monthBit = tamilName && tamilName !== 'Unknown' ? ` ${tamilName} month.` : '';
    return `${itemCount} items predicted for ${tomorrowDay}.${monthBit}${weatherBit} no supply or demand impact expected.`;
  }

  return parts.join('. ') + '.';
}

/** Build expanded advice cards */
function buildAdviceCards(ctx: SuggestionContext, tomorrowDay: string): Array<{
  icon: 'alert' | 'tip' | 'weather' | 'info';
  title: string;
  advice: string;
  color: 'red' | 'orange' | 'green' | 'blue' | 'purple';
}> {
  const cards: Array<{
    icon: 'alert' | 'tip' | 'weather' | 'info';
    title: string;
    advice: string;
    color: 'red' | 'orange' | 'green' | 'blue' | 'purple';
  }> = [];

  // Purattasi
  if (ctx.is_purattasi) {
    cards.push({
      icon: 'alert',
      title: 'Purattasi — Non-veg demand drops ~70%',
      advice: 'Most customers avoid non-veg this month. Reduce chicken, mutton, fish, and egg orders significantly. Increase paneer, mushroom, and veg alternatives — they sell more as substitutes.',
      color: 'purple',
    });
  }

  // Aadi
  if (ctx.is_aadi) {
    cards.push({
      icon: 'alert',
      title: 'Aadi month — Non-veg demand drops ~40%',
      advice: 'Many customers reduce non-veg during Aadi, especially on Tuesdays and Fridays. Almost no weddings this month — skip catering-heavy stock.',
      color: 'purple',
    });
  }

  // Muhurtham
  if (ctx.is_muhurtham) {
    cards.push({
      icon: 'tip',
      title: 'Wedding day tomorrow — Catering demand spike',
      advice: 'Stock up: rice, coconut, sambar vegetables (drumstick, brinjal), banana leaf, curd, ghee, cashew, curry leaves. Catering orders typically jump 40-80%.',
      color: 'green',
    });
  }

  // Ramadan
  if (ctx.is_ramadan) {
    cards.push({
      icon: 'info',
      title: 'Ramadan — Demand shifts to evening',
      advice: 'Daytime dine-in drops but evening/iftar orders spike. Stock biryani ingredients, dates, fruits. Plan for later delivery windows.',
      color: 'blue',
    });
  }

  // Festival cards
  for (const fest of (ctx.festival_details || [])) {
    const tips: string[] = [];
    if (fest.nonveg_multiplier < 0.8) tips.push(`Reduce non-veg by ~${Math.round((1 - fest.nonveg_multiplier) * 100)}%`);
    if (fest.nonveg_multiplier > 1.2) tips.push(`Non-veg demand up ~${Math.round((fest.nonveg_multiplier - 1) * 100)}% — order extra`);
    if (fest.veg_multiplier > 1.1) tips.push(`Veg demand up ~${Math.round((fest.veg_multiplier - 1) * 100)}%`);
    if (fest.catering_multiplier > 1.2) tips.push(`Catering up ~${Math.round((fest.catering_multiplier - 1) * 100)}%`);
    if (fest.spike_products.length > 0) tips.push(`Stock up: ${fest.spike_products.slice(0, 5).join(', ')}`);

    if (tips.length > 0) {
      cards.push({
        icon: 'tip',
        title: fest.name,
        advice: `${fest.description} ${tips.join('. ')}.`,
        color: 'orange',
      });
    }
  }

  // Weather cards
  const rainfall = ctx.rainfall_mm || 0;
  const temp = ctx.temperature;
  if (rainfall > 50) {
    cards.push({
      icon: 'weather',
      title: `Heavy rain forecast — ${rainfall}mm`,
      advice: 'Koyambedu truck arrivals may drop 40%. Walk-in traffic drops 15-30%. Order extra perishables today — prices will spike tomorrow. Consider backup suppliers.',
      color: 'red',
    });
  } else if (rainfall > 10) {
    cards.push({
      icon: 'weather',
      title: `Rain expected — ${rainfall}mm`,
      advice: 'Leafy greens and herbs may see price increases. Consider ordering slightly extra to buffer supply delays.',
      color: 'orange',
    });
  }
  if (temp != null && temp > 40) {
    cards.push({
      icon: 'weather',
      title: `Extreme heat — ${temp}°C`,
      advice: 'Beverages demand (buttermilk, juice, water) typically jumps 30%. Heavy meals like biryani and mutton see 15% less demand. Adjust accordingly.',
      color: 'orange',
    });
  }

  // Normal day info (only if no alerts)
  if (cards.length === 0 && temp != null) {
    const tamilName = ctx.tamil_month?.name;
    if (tamilName && tamilName !== 'Unknown') {
      cards.push({
        icon: 'info',
        title: `Normal ${tomorrowDay}`,
        advice: `No festival or weather alerts for tomorrow (${tamilName} month). Your order is based on your typical ${tomorrowDay} pattern from recent weeks.`,
        color: 'blue',
      });
    }
  }

  return cards;
}

const iconColorMap = {
  red: 'text-red-500 bg-red-50',
  orange: 'text-orange-500 bg-orange-50',
  green: 'text-green-600 bg-green-50',
  blue: 'text-blue-500 bg-blue-50',
  purple: 'text-purple-600 bg-purple-50',
};

const borderColorMap = {
  red: 'border-l-red-400',
  orange: 'border-l-orange-400',
  green: 'border-l-green-400',
  blue: 'border-l-blue-400',
  purple: 'border-l-purple-400',
};

const ContextLine: React.FC<ContextLineProps> = ({ context, itemCount, tomorrowDay }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!context && itemCount === 0) return null;

  const adviceLine = buildAdviceLine(context, itemCount, tomorrowDay);
  const cards = context ? buildAdviceCards(context, tomorrowDay) : [];
  const hasExpandable = cards.length > 0;

  // Pick the right icon for the collapsed bar
  const hasAlert = context?.is_purattasi || context?.is_aadi || context?.is_muhurtham ||
    (context?.rainfall_mm || 0) > 50 || (context?.festival_details || []).length > 0;
  const BarIcon = hasAlert ? AlertTriangle : Sparkles;
  const barIconColor = hasAlert ? 'text-orange-500' : 'text-primary/60';

  return (
    <div className="space-y-2">
      {/* Collapsed: single advice sentence */}
      <div
        className={`flex items-start gap-2.5 text-sm font-rubik rounded-lg px-4 py-2.5 transition-colors ${
          hasAlert
            ? 'bg-orange-50/60 text-orange-900 cursor-pointer hover:bg-orange-50'
            : 'bg-muted/30 text-muted-foreground cursor-pointer hover:bg-muted/50'
        }`}
        onClick={() => hasExpandable && setIsExpanded(!isExpanded)}
      >
        <BarIcon className={`h-4 w-4 mt-0.5 shrink-0 ${barIconColor}`} />
        <span className="flex-1 leading-relaxed">{adviceLine}</span>
        {hasExpandable && (
          <div className="shrink-0 mt-0.5">
            {isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
        )}
      </div>

      {/* Expanded: actionable advice cards */}
      {isExpanded && cards.length > 0 && (
        <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
          {cards.map((card, i) => {
            const IconComponent = card.icon === 'weather' ? Droplets
              : card.icon === 'alert' ? AlertTriangle
              : card.icon === 'tip' ? ShoppingBasket
              : Sparkles;

            return (
              <div
                key={i}
                className={`rounded-lg border border-border/50 border-l-[3px] ${borderColorMap[card.color]} bg-card p-3`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`p-1 rounded-md shrink-0 ${iconColorMap[card.color]}`}>
                    <IconComponent className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground font-rubik">{card.title}</p>
                    <p className="text-xs text-muted-foreground font-rubik mt-1 leading-relaxed">{card.advice}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ContextLine;
