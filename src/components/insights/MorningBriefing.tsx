/**
 * MorningBriefing — Hero card showing today's AI-suggested order.
 * Pulls from the forecast API and prompts the user to confirm.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowRight, Clock } from "lucide-react";
import analyticsApi from "@/api/analyticsApi";

type ForecastItem = {
  product_name: string;
  predicted_quantity: number;
  unit: string;
  estimated_price?: number;
};

export default function MorningBriefing() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ForecastItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        // Get 1-day forecast for tomorrow's ordering
        const res = await analyticsApi.getDemandForecast(1).catch(() => null);
        if (cancelled) return;

        if (res && Array.isArray(res.forecast)) {
          // Group by product, take first day's forecast, pick top 6 by quantity
          const byProduct = new Map<string, ForecastItem>();
          for (const point of res.forecast) {
            const p = point as unknown as {
              product_name?: string;
              name?: string;
              predicted_quantity?: number;
              quantity?: number;
              unit?: string;
              estimated_price?: number;
              price?: number;
            };
            const name = p.product_name || p.name || "Unknown";
            if (byProduct.has(name)) continue;
            byProduct.set(name, {
              product_name: name,
              predicted_quantity: Number(p.predicted_quantity ?? p.quantity ?? 0),
              unit: p.unit || "kg",
              estimated_price: Number(p.estimated_price ?? p.price ?? 0),
            });
          }
          const top = Array.from(byProduct.values())
            .sort((a, b) => b.predicted_quantity - a.predicted_quantity)
            .slice(0, 6);
          setItems(top);
          setTotal(top.reduce((s: number, it: ForecastItem) => s + (it.estimated_price || 0), 0));
        } else {
          setItems([]);
        }
      } catch (e) {
        if (!cancelled) setError("Forecast unavailable");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const formatINR = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  return (
    <div
      className="rounded-2xl p-6 lg:p-8 relative overflow-hidden"
      style={{
        background: "hsl(20 40% 10%)",
        color: "hsl(37 47% 96%)",
      }}
    >
      {/* Glow orbs */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-60px",
          right: "-60px",
          width: "220px",
          height: "220px",
          borderRadius: "50%",
          background: "hsl(33 60% 40% / 0.18)",
          filter: "blur(80px)",
        }}
      />

      <div className="relative">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="inline-flex h-1.5 w-1.5 rounded-full animate-pulse"
            style={{ background: "hsl(33 65% 55%)" }}
          />
          <span
            className="text-[10px] uppercase tracking-[0.24em] font-medium"
            style={{ color: "hsl(33 65% 55%)" }}
          >
            Today's suggestion
          </span>
        </div>
        <h2
          className="font-playfair leading-[1.1] tracking-tight"
          style={{ fontSize: "30px", color: "hsl(37 47% 96%)" }}
        >
          Your tomorrow order, <em className="italic" style={{ color: "hsl(33 65% 55%)" }}>ready.</em>
        </h2>
        <p className="mt-2 text-[13px]" style={{ color: "hsl(37 47% 96% / 0.55)" }}>
          Based on last week's pattern and tomorrow's forecast.
        </p>

        {/* Items */}
        <div className="mt-5 flex flex-wrap gap-2">
          {loading ? (
            <div className="flex items-center gap-2 text-[13px]" style={{ color: "hsl(37 47% 96% / 0.5)" }}>
              <Loader2 size={14} className="animate-spin" />
              Calculating your order…
            </div>
          ) : items.length > 0 ? (
            items.map((it, i) => (
              <span
                key={i}
                className="rounded-lg px-3 py-1.5 text-[13px]"
                style={{
                  background: "hsl(37 47% 96% / 0.08)",
                  color: "hsl(37 47% 96% / 0.9)",
                }}
              >
                <span style={{ color: "hsl(37 47% 96%)" }} className="font-semibold">
                  {it.predicted_quantity}
                  {it.unit}
                </span>{" "}
                {it.product_name}
              </span>
            ))
          ) : (
            <p className="text-[13px]" style={{ color: "hsl(37 47% 96% / 0.5)" }}>
              {error || "Not enough history yet. Place a few orders and your AI will start suggesting."}
            </p>
          )}
        </div>

        {/* Total + actions */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4">
          {total > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider" style={{ color: "hsl(37 47% 96% / 0.45)" }}>
                Estimated total
              </p>
              <p
                className="font-playfair text-[28px] leading-none mt-0.5"
                style={{ color: "hsl(33 65% 55%)" }}
              >
                {formatINR(total)}
              </p>
            </div>
          )}

          <div className="flex gap-2 sm:ml-auto">
            <button
              onClick={() => navigate("/smart-order")}
              className="rounded-lg px-4 py-2 text-[13px] font-medium border transition-colors"
              style={{
                borderColor: "hsl(37 47% 96% / 0.2)",
                color: "hsl(37 47% 96% / 0.8)",
              }}
            >
              Edit
            </button>
            <button
              onClick={() => navigate("/smart-order")}
              className="rounded-lg px-5 py-2 text-[13px] font-semibold inline-flex items-center gap-1.5 transition-opacity hover:opacity-90"
              style={{
                background: "hsl(33 65% 46%)",
                color: "hsl(37 47% 96%)",
              }}
            >
              Confirm order <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Meta footer */}
        <div
          className="mt-5 pt-4 border-t flex items-center gap-4 text-[11px]"
          style={{
            borderColor: "hsl(37 47% 96% / 0.08)",
            color: "hsl(37 47% 96% / 0.4)",
          }}
        >
          <span className="flex items-center gap-1.5">
            <Clock size={10} />
            Delivery tomorrow 6 AM
          </span>
          <span>·</span>
          <span>Forecast updated just now</span>
        </div>
      </div>
    </div>
  );
}
