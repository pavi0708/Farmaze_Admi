/**
 * AlertCards — Two narrow cards for waste alerts and price drops.
 * Placeholder data for now; wire to waste + price APIs once endpoints confirmed.
 */
import { AlertTriangle, TrendingDown, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function AlertCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* Waste alert */}
      <Link
        to="/waste-analytics"
        className="group rounded-xl p-4 border transition-shadow hover:shadow-sm"
        style={{
          background: "hsl(0 50% 98%)",
          borderColor: "hsl(0 60% 88%)",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{
              background: "hsl(0 65% 48% / 0.1)",
              color: "hsl(0 65% 48%)",
            }}
          >
            <AlertTriangle size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-[10px] uppercase tracking-wider font-medium mb-0.5"
              style={{ color: "hsl(0 65% 48%)" }}
            >
              Waste alert
            </p>
            <p className="text-[13px] leading-snug" style={{ color: "hsl(20 45% 12%)" }}>
              You over-ordered <span className="font-semibold">paneer by 40%</span> last week.
            </p>
            <p
              className="mt-1 text-[11px] inline-flex items-center gap-1 group-hover:gap-1.5 transition-all"
              style={{ color: "hsl(0 65% 48%)" }}
            >
              See details <ArrowRight size={10} />
            </p>
          </div>
        </div>
      </Link>

      {/* Price drop */}
      <Link
        to="/my-products"
        className="group rounded-xl p-4 border transition-shadow hover:shadow-sm"
        style={{
          background: "hsl(145 40% 97%)",
          borderColor: "hsl(145 30% 85%)",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{
              background: "hsl(145 40% 38% / 0.1)",
              color: "hsl(145 40% 32%)",
            }}
          >
            <TrendingDown size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className="text-[10px] uppercase tracking-wider font-medium mb-0.5"
              style={{ color: "hsl(145 40% 32%)" }}
            >
              Price drop
            </p>
            <p className="text-[13px] leading-snug" style={{ color: "hsl(20 45% 12%)" }}>
              <span className="font-semibold">Onion down 12%</span> — good time to stock up.
            </p>
            <p
              className="mt-1 text-[11px] inline-flex items-center gap-1 group-hover:gap-1.5 transition-all"
              style={{ color: "hsl(145 40% 32%)" }}
            >
              View products <ArrowRight size={10} />
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}
