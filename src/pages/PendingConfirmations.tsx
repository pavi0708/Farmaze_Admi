import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  ChevronRight,
  Mic,
  Plus,
  SkipForward,
  Check,
  RefreshCw,
  Play,
} from "lucide-react";
import { toast } from "sonner";

// ── Design tokens ──────────────────────────────────────────────────────────
const C = {
  bg: "hsl(37 47% 96%)",
  card: "#fff",
  border: "hsl(37 20% 88%)",
  text: "hsl(20 45% 12%)",
  muted: "hsl(20 20% 48%)",
  green: "#16A34A",
  amber: "#D97706",
  red: "#DC2626",
  gray: "#9CA3AF",
  cta: "hsl(33 65% 46%)",
};

// ── Mock data ──────────────────────────────────────────────────────────────
interface DraftItem {
  id: string;
  name: string;
  unit: string;
  avgQty: number;
  avgPrice: number;
  qty: number;
  variancePct: number; // positive = above avg, negative = below avg (e.g. -100 = 0kg ordered)
  skipped: boolean;
}

interface VendorDraft {
  id: string;
  vendor: string;
  branch: string;
  channel: string;
  lang: string;
  total: number;
  items: DraftItem[];
  voiceNote: string;
  autoConfirm: boolean;
  autoConfirmReason?: string;
}

const DRAFTS: VendorDraft[] = [
  {
    id: "1",
    vendor: "Anbu Fresh Vegetables",
    branch: "T. Nagar",
    channel: "WA voice",
    lang: "Tamil",
    total: 4200,
    items: [
      { id: "t", name: "Tomato (Bangalore)", unit: "kg", avgQty: 4.2, avgPrice: 38, qty: 5, variancePct: 19, skipped: false },
      { id: "o", name: "Onion (medium)", unit: "kg", avgQty: 8, avgPrice: 42, qty: 8, variancePct: 0, skipped: false },
      { id: "c", name: "Curry leaves", unit: "kg", avgQty: 1, avgPrice: 120, qty: 1, variancePct: 0, skipped: false },
      { id: "b", name: "Beans (French)", unit: "kg", avgQty: 3, avgPrice: 85, qty: 0, variancePct: -100, skipped: false },
      { id: "co", name: "Coriander", unit: "kg", avgQty: 2, avgPrice: 60, qty: 2, variancePct: 0, skipped: false },
    ],
    voiceNote: "வணக்கம் Anbu, நாளைக்கு T.Nagar — tomato 5kg, onion 8kg, மற்றெல்லாம் usual. Total ₹4,200.",
    autoConfirm: false,
  },
  {
    id: "2",
    vendor: "Velmurugan Vegetables",
    branch: "Nolambur",
    channel: "WA voice",
    lang: "Tamil",
    total: 2800,
    items: [],
    voiceNote: "",
    autoConfirm: true,
    autoConfirmReason: "6 items as usual • variance within range • ₹2,800",
  },
  {
    id: "3",
    vendor: "Pollachi Coconut Co.",
    branch: "T. Nagar",
    channel: "WA photo",
    lang: "",
    total: 2200,
    items: [],
    voiceNote: "",
    autoConfirm: false,
    autoConfirmReason: "Coconut 40 nos • within range • ₹2,200",
  },
];

// ── Variance bar ───────────────────────────────────────────────────────────

function VarianceBar({ pct }: { pct: number }) {
  const abs = Math.min(Math.abs(pct), 100);
  const isPositive = pct > 0;
  const isNegative = pct < 0;
  const barColor = isNegative ? C.red : isPositive ? C.green : C.gray;

  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <div className="flex-1 h-1.5 rounded-full bg-stone-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${abs}%`,
            background: barColor,
            marginLeft: isPositive ? "50%" : undefined,
            marginRight: isNegative ? "50%" : undefined,
          }}
        />
      </div>
      <span
        className="text-[11px] font-semibold w-8 text-right"
        style={{ color: barColor }}
      >
        {pct > 0 ? `+${pct}%` : pct < 0 ? `${pct}%` : "+0%"}
      </span>
    </div>
  );
}

// ── Qty stepper ────────────────────────────────────────────────────────────

function QtyStepper({
  qty,
  unit,
  onChange,
}: {
  qty: number;
  unit: string;
  onChange: (delta: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(-1)}
        className="h-6 w-6 rounded border flex items-center justify-center text-base font-light hover:bg-stone-50"
        style={{ borderColor: C.border, color: C.text }}
      >
        −
      </button>
      <span
        className="text-[13px] font-semibold w-12 text-center"
        style={{ color: C.text }}
      >
        {qty}
        {unit}
      </span>
      <button
        onClick={() => onChange(1)}
        className="h-6 w-6 rounded border flex items-center justify-center text-base font-light hover:bg-stone-50"
        style={{ borderColor: C.border, color: C.text }}
      >
        +
      </button>
    </div>
  );
}

// ── Active vendor card ─────────────────────────────────────────────────────

function ActiveDraftCard({
  draft,
  idx,
  total,
  onConfirm,
  onSkipAll,
}: {
  draft: VendorDraft;
  idx: number;
  total: number;
  onConfirm: () => void;
  onSkipAll: () => void;
}) {
  const [items, setItems] = useState<DraftItem[]>(draft.items);

  const updateQty = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, qty: Math.max(0, item.qty + delta) }
          : item
      )
    );
  };

  const skipItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, skipped: true } : item))
    );
  };

  const activeTotal = items
    .filter((i) => !i.skipped)
    .reduce((sum, i) => sum + i.qty * i.avgPrice, 0);

  const varianceFlag = items.find((i) => Math.abs(i.variancePct) > 10 && !i.skipped);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        border: `2px solid ${C.cta}`,
        background: C.card,
      }}
    >
      {/* Card header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: `1px solid ${C.border}` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center text-[13px] font-bold text-white"
            style={{ background: C.cta }}
          >
            {idx + 1}
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.muted }}>
              Draft {idx + 1} of {total}
            </p>
            <p className="text-[16px] font-bold" style={{ color: C.text }}>
              {draft.vendor} → {draft.branch}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest" style={{ color: C.muted }}>
            cutoff in
          </p>
          <p className="text-[16px] font-bold" style={{ color: C.cta }}>
            1h 12m
          </p>
        </div>
      </div>

      {/* Sub-header */}
      <div
        className="flex items-center justify-between px-5 py-2.5"
        style={{ borderBottom: `1px solid ${C.border}`, background: "hsl(37 47% 98%)" }}
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2 py-0.5"
            style={{ background: "hsl(37 47% 93%)", color: C.muted, border: `1px solid ${C.border}` }}
          >
            <Mic size={9} /> {draft.channel} {draft.lang}
          </span>
          {varianceFlag && (
            <span className="text-[11px]" style={{ color: C.red }}>
              variance vs 4-wk avg: <strong>{varianceFlag.name.split(" ")[0]} +{varianceFlag.variancePct}%</strong>
            </span>
          )}
        </div>
        <p className="text-[14px] font-bold" style={{ color: C.text }}>
          Total ₹{activeTotal.toLocaleString("en-IN")}
        </p>
      </div>

      {/* Items table */}
      <div className="px-5">
        {/* Table header */}
        <div
          className="grid grid-cols-[1fr_180px_200px_60px] gap-2 py-2.5 text-[10px] font-semibold uppercase tracking-widest"
          style={{ color: C.muted, borderBottom: `1px solid ${C.border}` }}
        >
          <span>Item</span>
          <span>Qty for tomorrow</span>
          <span>vs 4-wk avg</span>
          <span />
        </div>

        {items.map((item) =>
          item.skipped ? null : (
            <div
              key={item.id}
              className="grid grid-cols-[1fr_180px_200px_60px] gap-2 items-center py-3"
              style={{ borderBottom: `1px solid ${C.border}` }}
            >
              <div>
                <p className="text-[13px] font-semibold" style={{ color: C.text }}>
                  {item.name}
                </p>
                <p className="text-[11px]" style={{ color: C.muted }}>
                  4-wk avg {item.avgQty}
                  {item.unit} • ₹{item.avgPrice}/{item.unit}
                </p>
              </div>
              <QtyStepper qty={item.qty} unit={item.unit} onChange={(d) => updateQty(item.id, d)} />
              <VarianceBar pct={item.variancePct} />
              <button
                onClick={() => skipItem(item.id)}
                className="text-[11px] font-medium"
                style={{ color: C.muted }}
              >
                Skip ·
              </button>
            </div>
          )
        )}
      </div>

      {/* Voice note preview */}
      {draft.voiceNote && (
        <div
          className="mx-5 my-4 rounded-xl px-4 py-3"
          style={{ background: "#F0FDF4", border: `1px solid #BBF7D0` }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: C.green }}>
            Sends as Tamil voice note
          </p>
          <div className="flex items-center gap-3">
            <button
              className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
              style={{ background: C.green }}
            >
              <Play size={13} color="#fff" />
            </button>
            <div className="flex-1 h-6 flex items-center gap-0.5">
              {Array.from({ length: 36 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full"
                  style={{
                    height: `${8 + Math.sin(i * 0.8) * 8 + Math.random() * 6}px`,
                    background: C.green,
                    opacity: 0.6 + Math.random() * 0.4,
                  }}
                />
              ))}
            </div>
            <p className="text-[11px] italic max-w-[240px] leading-snug" style={{ color: "#166534" }}>
              "{draft.voiceNote}"
            </p>
          </div>
        </div>
      )}

      {/* Action footer */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderTop: `1px solid ${C.border}` }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={onSkipAll}
            className="text-[12px] font-medium px-3 py-2 rounded-lg border hover:bg-stone-50"
            style={{ borderColor: C.border, color: C.text }}
          >
            Skip tomorrow
          </button>
          <button
            className="text-[12px] font-medium px-3 py-2 rounded-lg border hover:bg-stone-50"
            style={{ borderColor: C.border, color: C.text }}
          >
            <span className="flex items-center gap-1.5">
              <Plus size={12} /> Add item
            </span>
          </button>
          <button
            className="text-[12px] font-medium px-3 py-2 rounded-lg border hover:bg-stone-50"
            style={{ borderColor: C.border, color: C.text }}
          >
            <span className="flex items-center gap-1.5">
              <RefreshCw size={12} /> Switch channel
            </span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px]" style={{ color: C.muted }}>
            Looks right?
          </span>
          <button
            onClick={onConfirm}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-semibold text-white"
            style={{ background: C.cta }}
          >
            <Check size={14} /> Confirm & next
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Collapsed draft card ───────────────────────────────────────────────────

function CollapsedDraftCard({
  draft,
  idx,
  label,
}: {
  draft: VendorDraft;
  idx: number;
  label?: string;
}) {
  return (
    <div
      className="flex items-center gap-4 rounded-2xl px-5 py-4"
      style={{ background: C.card, border: `1px solid ${C.border}` }}
    >
      <div
        className="h-7 w-7 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
        style={{ background: "hsl(37 47% 90%)", color: C.muted }}
      >
        {idx + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold" style={{ color: C.muted }}>
          {draft.vendor} → {draft.branch}
        </p>
        <p className="text-[11px]" style={{ color: C.muted }}>
          {draft.autoConfirmReason}
        </p>
      </div>
      {draft.autoConfirm ? (
        <span className="text-[11px] font-medium flex items-center gap-1" style={{ color: C.green }}>
          <Check size={11} /> Auto-confirms
        </span>
      ) : (
        <span className="text-[12px] font-medium" style={{ color: C.muted }}>
          {label ?? "Up next"}
        </span>
      )}
    </div>
  );
}

// ── Pagination dots ────────────────────────────────────────────────────────

function PaginationDots({
  total,
  active,
  onPrev,
  onNext,
}: {
  total: number;
  active: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        onClick={onPrev}
        disabled={active === 0}
        className="h-7 w-7 rounded-full border flex items-center justify-center disabled:opacity-30"
        style={{ borderColor: C.border }}
      >
        <ChevronRight size={14} className="rotate-180" style={{ color: C.muted }} />
      </button>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="rounded-full transition-all"
          style={{
            height: 8,
            width: i === active ? 24 : 8,
            background: i === active ? C.cta : C.border,
          }}
        />
      ))}
      <button
        onClick={onNext}
        disabled={active === total - 1}
        className="h-7 w-7 rounded-full border flex items-center justify-center disabled:opacity-30"
        style={{ borderColor: C.border }}
      >
        <ChevronRight size={14} style={{ color: C.muted }} />
      </button>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function PendingConfirmations() {
  const navigate = useNavigate();
  const [draftIdx, setDraftIdx] = useState(0);

  const pendingDrafts = DRAFTS.filter((d) => !d.autoConfirm || draftIdx > 0);
  const needsReview = DRAFTS.filter((d) => !d.autoConfirm);
  const current = needsReview[draftIdx] ?? needsReview[0];

  const handleConfirm = () => {
    toast.success("Draft confirmed — order will be sent before cutoff");
    if (draftIdx < needsReview.length - 1) {
      setDraftIdx((i) => i + 1);
    } else {
      toast.success("All drafts confirmed!", { description: "Orders queued for dispatch" });
      navigate("/today");
    }
  };

  const handleSkipAll = () => {
    toast("Draft skipped", { description: "You can revisit from Today before cutoff" });
    navigate("/today");
  };

  const handleSendAllAsDrafted = () => {
    toast.success(`${needsReview.length} order${needsReview.length !== 1 ? "s" : ""} sent as drafted`, {
      description: "All pending confirmations dispatched",
    });
    navigate("/today");
  };

  return (
    <div className="frame-container mx-auto px-4 py-8" style={{ color: C.text }}>
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full animate-pulse" style={{ background: C.amber }} />
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: C.amber }}>
              Cutoff in 1h 12m
            </p>
          </div>
          <h1 className="text-[32px] font-bold font-playfair leading-tight">
            Pending confirmations
          </h1>
          <p className="text-[13px] mt-1" style={{ color: C.muted }}>
            Drafted from cadence + last 4 weeks. Confirm, edit, or skip — one per vendor.
          </p>
        </div>
        <button
          onClick={handleSendAllAsDrafted}
          className="mt-1 text-[12px] font-medium px-4 py-2 rounded-lg border hover:bg-white transition-colors"
          style={{ borderColor: C.border, color: C.text, background: C.card }}
        >
          Send all as drafted
        </button>
      </div>

      {/* ── Active draft card ── */}
      {current && (
        <ActiveDraftCard
          draft={current}
          idx={draftIdx}
          total={needsReview.length}
          onConfirm={handleConfirm}
          onSkipAll={handleSkipAll}
        />
      )}

      {/* ── Pagination dots ── */}
      {needsReview.length > 1 && (
        <PaginationDots
          total={needsReview.length}
          active={draftIdx}
          onPrev={() => setDraftIdx((i) => Math.max(i - 1, 0))}
          onNext={() => setDraftIdx((i) => Math.min(i + 1, needsReview.length - 1))}
        />
      )}

      {/* ── Collapsed cards ── */}
      <div className="mt-4 space-y-2">
        {DRAFTS.filter((d) => d.id !== current?.id).map((draft, i) => (
          <CollapsedDraftCard
            key={draft.id}
            draft={draft}
            idx={DRAFTS.indexOf(draft)}
            label={draft.autoConfirm ? undefined : "Up next"}
          />
        ))}
      </div>
    </div>
  );
}
