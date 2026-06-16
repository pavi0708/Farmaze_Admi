/**
 * Onboarding — 4-step setup wizard for new clients.
 *
 * Flow: Welcome → Your supply (Branches → Vendors → POs) → Review → Done
 *
 * The "Your supply" step accepts file drops per vendor. Files are kept in
 * client state and the parse is stubbed (1.5s timeout to "ready"); on submit
 * we POST one createMySupplier per unique vendor name. Branches are collected
 * for grouping but not yet persisted (no backend endpoint).
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/context/AuthContext";
import { ONBOARDING_STEPS, useOnboarding } from "@/hooks/useOnboarding";
import { createMySupplier, extractErrorMessage } from "@/api/onboardingApi";

import ManualUploadStep, {
  buildInitialBranches,
  type OnboardingBranch,
} from "@/components/onboarding/ManualUploadStep";
import ReviewStep from "@/components/onboarding/ReviewStep";
import { T } from "@/components/onboarding/tokens";

const STEPS = ["Welcome", "Your supply", "Review", "Done"] as const;

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { advanceStep, markSkipped, refresh } = useOnboarding();

  const [stepIdx, setStepIdx] = useState(0);
  const [branches, setBranches] = useState<OnboardingBranch[]>(() =>
    buildInitialBranches()
  );
  const [submitting, setSubmitting] = useState(false);

  const progress = ((stepIdx + 1) / STEPS.length) * 100;

  const next = () => setStepIdx((i) => Math.min(i + 1, STEPS.length - 1));
  const back = () => setStepIdx((i) => Math.max(i - 1, 0));

  const goToDashboard = () =>
    navigate(user?.role === "client_admin" ? "/insights" : "/smart-order");

  const handleSkip = () => {
    markSkipped();
    toast("You can finish setup anytime from your dashboard.");
    goToDashboard();
  };

  const namedVendors = dedupeVendors(branches);

  const handleSubmit = async () => {
    if (namedVendors.length === 0) {
      toast.error("Add at least one vendor with a name to continue.");
      return;
    }

    setSubmitting(true);
    let failures = 0;
    for (const v of namedVendors) {
      try {
        await createMySupplier({
          name: v.name,
          phone: "",
          whatsapp_number: "",
          categories: v.category ? [v.category] : [],
          notes: v.branches.length > 1
            ? `Shared across branches: ${v.branches.join(", ")}`
            : v.branches[0]
            ? `Branch: ${v.branches[0]}`
            : undefined,
        });
      } catch (err) {
        failures += 1;
        // eslint-disable-next-line no-console
        console.warn(
          `[onboarding] supplier "${v.name}" failed:`,
          extractErrorMessage(err)
        );
      }
    }

    try {
      await advanceStep(ONBOARDING_STEPS.COMPLETE);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(
        "[onboarding] could not advance step:",
        extractErrorMessage(err)
      );
    }

    if (failures === 0) {
      toast.success("Setup complete — welcome to Farmaze.");
    } else {
      toast.warning(
        `Setup saved — ${failures} of ${namedVendors.length} vendors could not be added. You can retry from My Suppliers.`
      );
    }
    await refresh();
    setSubmitting(false);
    setStepIdx(STEPS.length - 1);
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{ background: T.cream, color: T.ink }}
    >
      <Header
        stepIdx={stepIdx}
        progress={progress}
        showSkip={stepIdx < STEPS.length - 1}
        onSkip={handleSkip}
      />

      {stepIdx === 0 && (
        <main className="flex-1 px-6 py-6 lg:py-10">
          <div className="max-w-[900px] mx-auto">
            <WelcomeStep
              onNext={next}
              userName={user?.name || ""}
            />
          </div>
        </main>
      )}

      {stepIdx === 1 && (
        <ManualUploadStep
          branches={branches}
          onChange={setBranches}
          onNext={next}
          onBack={back}
        />
      )}

      {stepIdx === 2 && (
        <ReviewStep
          branches={branches}
          onSubmit={handleSubmit}
          onBack={back}
          submitting={submitting}
        />
      )}

      {stepIdx === 3 && (
        <main className="flex-1 px-6 py-6 lg:py-10">
          <div className="max-w-[900px] mx-auto">
            <DoneStep
              vendorCount={namedVendors.length}
              onFinish={goToDashboard}
            />
          </div>
        </main>
      )}
    </div>
  );
}

interface DedupedVendor {
  name: string;
  category: string;
  branches: string[];
}

function dedupeVendors(branches: OnboardingBranch[]): DedupedVendor[] {
  const byKey = new Map<string, DedupedVendor>();
  branches.forEach((b) => {
    const branchLabel = b.name.trim();
    b.vendors.forEach((v) => {
      const trimmed = v.name.trim();
      if (!trimmed) return;
      const key = trimmed.toLowerCase();
      const existing = byKey.get(key);
      if (existing) {
        if (branchLabel && !existing.branches.includes(branchLabel)) {
          existing.branches.push(branchLabel);
        }
        if (!existing.category && v.category) existing.category = v.category;
      } else {
        byKey.set(key, {
          name: trimmed,
          category: v.category,
          branches: branchLabel ? [branchLabel] : [],
        });
      }
    });
  });
  return Array.from(byKey.values());
}

// ─── Header ────────────────────────────────────────────────────────────────
function Header({
  stepIdx,
  progress,
  showSkip,
  onSkip,
}: {
  stepIdx: number;
  progress: number;
  showSkip: boolean;
  onSkip: () => void;
}) {
  return (
    <>
      <header
        className="w-full border-b flex items-center justify-between"
        style={{
          padding: "16px 32px",
          borderColor: T.line,
          background: T.surface,
        }}
      >
        <div className="flex items-baseline gap-3.5">
          <span
            className="font-playfair"
            style={{
              fontSize: 22,
              color: T.ink,
              letterSpacing: "-0.01em",
            }}
          >
            Farmaze
          </span>
          <span
            className="uppercase"
            style={{
              fontSize: 10.5,
              letterSpacing: "0.22em",
              color: T.muted,
            }}
          >
            Setup
          </span>
        </div>
        {showSkip && (
          <button
            onClick={onSkip}
            className="hover:underline"
            style={{
              fontSize: 12,
              color: T.muted,
              background: "none",
              border: "none",
              cursor: "pointer",
              textUnderlineOffset: 3,
            }}
          >
            Skip for now
          </button>
        )}
      </header>

      <div className="w-full" style={{ height: 3, background: "hsl(37 20% 90%)" }}>
        <div
          className="h-full transition-all duration-500"
          style={{ width: `${progress}%`, background: T.amber }}
        />
      </div>

      <div
        className="flex items-center"
        style={{ padding: "12px 32px", gap: 18, fontSize: 11, color: T.muted }}
      >
        {STEPS.map((label, i) => {
          const active = i === stepIdx;
          const done = i < stepIdx;
          return (
            <div key={label} className="flex items-center gap-2">
              <span
                className="inline-flex items-center justify-center font-semibold"
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 99,
                  fontSize: 10,
                  background: active || done ? T.amber : "hsl(37 20% 90%)",
                  color: active || done ? "#fff" : T.muted,
                }}
              >
                {done ? <Check size={11} /> : i + 1}
              </span>
              <span
                className="uppercase"
                style={{
                  letterSpacing: "0.1em",
                  color: active ? T.ink : T.muted,
                  fontWeight: active ? 500 : 400,
                }}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <span style={{ marginLeft: 10, color: T.line }}>·</span>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── Welcome ───────────────────────────────────────────────────────────────
function WelcomeStep({
  onNext,
  userName,
}: {
  onNext: () => void;
  userName: string;
}) {
  const firstName = userName.split(" ")[0] || "";
  return (
    <div className="py-10">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} style={{ color: T.amber }} />
        <span
          className="uppercase font-medium"
          style={{
            fontSize: 11,
            letterSpacing: "0.24em",
            color: T.amber,
          }}
        >
          Welcome
        </span>
      </div>
      <h1
        className="font-playfair"
        style={{
          fontSize: 52,
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          color: T.ink,
        }}
      >
        Let's set up Farmaze{firstName ? `, ${firstName}` : ""}.
      </h1>
      <p
        className="mt-5"
        style={{
          fontSize: 15,
          color: T.muted,
          lineHeight: 1.55,
          maxWidth: 640,
        }}
      >
        Farmaze works best when it knows your existing supply chain. In the
        next few minutes we'll capture your branches, your other vendors, and
        last month's purchase orders — so we can rebuild your catalogue,
        prices, and ordering rhythm.
      </p>

      <div
        className="mt-8 rounded-xl border max-w-[720px]"
        style={{
          background: T.surface,
          borderColor: T.line,
          padding: 20,
        }}
      >
        <div
          className="uppercase font-medium mb-3"
          style={{
            fontSize: 11,
            letterSpacing: "0.2em",
            color: T.muted,
          }}
        >
          What you'll need
        </div>
        <ul className="space-y-2.5" style={{ fontSize: 14, color: T.ink }}>
          <li className="flex items-start gap-2">
            <span style={{ color: T.amber }}>●</span>
            Names of your other vendors per branch (mandi, dairy, dry goods…)
          </li>
          <li className="flex items-start gap-2">
            <span style={{ color: T.amber }}>●</span>
            Last month's purchase orders — a zip, sheets, PDFs, or even
            WhatsApp screenshots
          </li>
          <li className="flex items-start gap-2">
            <span style={{ color: T.amber }}>●</span>
            That's it. We'll do the rest.
          </li>
        </ul>
      </div>

      <div className="mt-10 flex items-center gap-3">
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 font-semibold transition-opacity hover:opacity-90"
          style={{
            borderRadius: 8,
            padding: "12px 22px",
            fontSize: 14,
            background: T.amber,
            color: T.cream,
            border: "none",
            cursor: "pointer",
          }}
        >
          Let's begin <ArrowRight size={15} />
        </button>
        <span style={{ fontSize: 12, color: T.muted }}>
          Takes about 3 minutes
        </span>
      </div>
    </div>
  );
}

// ─── Done ──────────────────────────────────────────────────────────────────
function DoneStep({
  vendorCount,
  onFinish,
}: {
  vendorCount: number;
  onFinish: () => void;
}) {
  return (
    <div className="py-12 text-center">
      <div
        className="inline-flex items-center justify-center mb-6"
        style={{
          width: 72,
          height: 72,
          borderRadius: 99,
          background: T.amberBg,
          color: T.amber,
        }}
      >
        <Check size={32} />
      </div>
      <h1
        className="font-playfair"
        style={{
          fontSize: 44,
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          color: T.ink,
        }}
      >
        You're all set.
      </h1>
      <p
        className="mt-4 mx-auto"
        style={{
          fontSize: 15,
          color: T.muted,
          lineHeight: 1.55,
          maxWidth: 520,
        }}
      >
        {vendorCount > 0
          ? `${vendorCount} vendor${vendorCount > 1 ? "s" : ""} added. We'll start parsing your POs in the background — you can keep going and Farmaze will fill in the catalogue as it learns.`
          : "Welcome to Farmaze. You can add vendors anytime from My Suppliers."}
      </p>
      <div className="mt-10">
        <button
          onClick={onFinish}
          className="inline-flex items-center gap-2 font-semibold transition-opacity hover:opacity-90"
          style={{
            borderRadius: 8,
            padding: "12px 24px",
            fontSize: 14,
            background: T.amber,
            color: T.cream,
            border: "none",
            cursor: "pointer",
          }}
        >
          Take me to the dashboard <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
