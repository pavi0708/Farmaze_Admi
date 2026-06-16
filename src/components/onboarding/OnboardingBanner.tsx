/**
 * OnboardingBanner — Nudge shown on dashboard pages for users who haven't
 * completed the onboarding wizard. Dismissable per-session via "Later".
 */
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, X } from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";

export default function OnboardingBanner() {
  const navigate = useNavigate();
  const { showBanner, markSkipped } = useOnboarding();

  if (!showBanner) return null;

  return (
    <div
      className="rounded-xl p-4 lg:p-5 flex items-center gap-4 border"
      style={{
        background: "hsl(20 40% 10%)",
        borderColor: "hsl(37 47% 96% / 0.1)",
        color: "hsl(37 47% 96%)",
      }}
    >
      <div
        className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
        style={{ background: "hsl(33 65% 55% / 0.15)", color: "hsl(33 65% 55%)" }}
      >
        <Sparkles size={18} />
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="font-playfair text-[17px] leading-tight"
          style={{ color: "hsl(37 47% 96%)" }}
        >
          Unlock price comparison
        </p>
        <p
          className="text-[12px] mt-0.5"
          style={{ color: "hsl(37 47% 96% / 0.6)" }}
        >
          Tell us about your other vendors & current prices — takes 3 minutes.
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={markSkipped}
          className="text-[12px] px-2 py-1 rounded hover:bg-white/5 transition-colors"
          style={{ color: "hsl(37 47% 96% / 0.5)" }}
          aria-label="Dismiss"
        >
          Later
        </button>
        <button
          onClick={() => navigate("/onboarding")}
          className="rounded-lg px-3.5 py-2 text-[12px] font-semibold inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity"
          style={{ background: "hsl(33 65% 46%)", color: "hsl(37 47% 96%)" }}
        >
          Start setup <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}
