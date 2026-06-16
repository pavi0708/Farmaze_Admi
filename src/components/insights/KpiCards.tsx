/**
 * KpiCards — Three warm-themed KPI cards shown on the Insights page.
 * Currently renders static placeholders; wire to analyticsApi once endpoints exist.
 */
import { TrendingUp, TrendingDown, Sparkles, Recycle, Target } from "lucide-react";

type Kpi = {
  label: string;
  value: string;
  delta?: { value: string; direction: "up" | "down"; good?: boolean };
  sub?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

export default function KpiCards({ kpis }: { kpis?: Kpi[] }) {
  const data: Kpi[] = kpis || [
    {
      label: "Spend this week",
      value: "₹42,180",
      delta: { value: "8%", direction: "down", good: true },
      sub: "vs last week",
      icon: Sparkles,
    },
    {
      label: "Waste avoided",
      value: "₹3,240",
      delta: { value: "23%", direction: "up", good: true },
      sub: "last 30 days",
      icon: Recycle,
    },
    {
      label: "Forecast accuracy",
      value: "91.4%",
      delta: { value: "2.1pt", direction: "up", good: true },
      sub: "30-day rolling",
      icon: Target,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {data.map((k, i) => {
        const Icon = k.icon;
        const DeltaIcon = k.delta?.direction === "up" ? TrendingUp : TrendingDown;
        const deltaColor = k.delta?.good ? "hsl(145 40% 38%)" : "hsl(0 65% 48%)";
        return (
          <div
            key={i}
            className="rounded-xl p-4 border transition-shadow hover:shadow-sm"
            style={{
              background: "hsl(37 47% 96%)",
              borderColor: "hsl(37 20% 85%)",
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <p
                className="text-[11px] uppercase tracking-wider font-medium"
                style={{ color: "hsl(20 20% 50%)" }}
              >
                {k.label}
              </p>
              <div
                className="flex h-7 w-7 items-center justify-center rounded-lg"
                style={{
                  background: "hsl(33 65% 46% / 0.1)",
                  color: "hsl(33 65% 46%)",
                }}
              >
                <Icon size={13} />
              </div>
            </div>
            <p
              className="font-playfair leading-none"
              style={{ fontSize: "26px", color: "hsl(20 45% 12%)" }}
            >
              {k.value}
            </p>
            {(k.delta || k.sub) && (
              <div className="mt-2 flex items-center gap-1.5 text-[11px]">
                {k.delta && (
                  <span
                    className="inline-flex items-center gap-0.5 font-medium"
                    style={{ color: deltaColor }}
                  >
                    <DeltaIcon size={10} />
                    {k.delta.value}
                  </span>
                )}
                {k.sub && <span style={{ color: "hsl(20 20% 50%)" }}>{k.sub}</span>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
