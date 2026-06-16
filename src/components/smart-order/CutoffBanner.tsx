/**
 * CutoffBanner — "Order cutoff in Xh Ym" countdown strip
 * Shows when there is still time to order before the daily cutoff.
 * Cutoff default: 9:00 AM every day (next-day delivery).
 * Dismisses for the session; reappears next load.
 */

import React, { useEffect, useState } from "react";
import { Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";

const CUTOFF_HOUR   = 9;   // 9:00 AM
const CUTOFF_MINUTE = 0;

/** Returns ms until the next cutoff (today if not yet past, tomorrow if already past). */
function msUntilCutoff(): number {
  const now    = new Date();
  const cutoff = new Date();
  cutoff.setHours(CUTOFF_HOUR, CUTOFF_MINUTE, 0, 0);
  if (cutoff <= now) cutoff.setDate(cutoff.getDate() + 1); // past — next day
  return cutoff.getTime() - now.getTime();
}

function formatCountdown(ms: number): { hh: string; mm: string; ss: string } {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const hh = String(Math.floor(totalSec / 3600)).padStart(2, "0");
  const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");
  return { hh, mm, ss };
}

interface CutoffBannerProps {
  /** Override cutoff hour (24-h). Defaults to 9. */
  cutoffHour?: number;
}

const CutoffBanner: React.FC<CutoffBannerProps> = ({ cutoffHour = CUTOFF_HOUR }) => {
  const [remaining, setRemaining] = useState<number>(msUntilCutoff());
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const tick = () => setRemaining(msUntilCutoff());
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (dismissed) return null;

  const hours = remaining / (1000 * 60 * 60);

  // Only show when ≤ 4 hours remain — no point cluttering otherwise
  if (hours > 4) return null;

  const { hh, mm, ss } = formatCountdown(remaining);

  const urgent  = hours < 1;
  const warning = hours < 2;

  // Color scheme: green → amber → red as cutoff approaches
  const bg      = urgent  ? "bg-red-50   border-red-200"
                : warning ? "bg-amber-50 border-amber-200"
                : "bg-green-50 border-green-200";
  const textCol = urgent  ? "text-red-700"
                : warning ? "text-amber-700"
                : "text-green-700";
  const iconCol = urgent  ? "text-red-500"
                : warning ? "text-amber-500"
                : "text-green-500";

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl border mb-3 text-[12px]",
        bg
      )}
    >
      <Clock size={13} className={cn("shrink-0", iconCol)} />
      <span className={cn("flex-1 font-medium", textCol)}>
        {urgent
          ? "⚡ Last chance! Order cutoff in"
          : `Order cutoff at ${cutoffHour}:00 AM —`}
        {" "}
        <span className="font-mono tabular-nums font-bold">
          {hh}:{mm}:{ss}
        </span>
        {" "}remaining
      </span>
      <button
        onClick={() => setDismissed(true)}
        className={cn("ml-1 transition-opacity hover:opacity-70", iconCol)}
        aria-label="Dismiss"
      >
        <X size={12} />
      </button>
    </div>
  );
};

export default CutoffBanner;
