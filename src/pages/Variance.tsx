/**
 * Variance — short-supply & over-delivery tracker
 * Reads from farmaze_grn_records (localStorage) + falls back to demo data.
 */

import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TriangleAlert,
  TrendingDown,
  TrendingUp,
  Package,
  ChevronRight,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Design tokens (warm earth palette, consistent with Today/VendorList) ──────
const C = {
  bg:     "hsl(37 47% 96%)",
  card:   "#fff",
  border: "hsl(37 20% 88%)",
  text:   "hsl(20 45% 12%)",
  muted:  "hsl(20 20% 48%)",
  cta:    "hsl(33 65% 46%)",
  green:  "#16A34A",
  amber:  "#D97706",
  red:    "#DC2626",
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface VarianceItem {
  id:         string;
  name:       string;
  unit:       string;
  ordered:    number;
  received:   number;
  note:       string;
}

interface GRNRecord {
  orderId:     string;
  orderNumber: string;
  vendorName:  string;
  submittedAt: string;
  items:       VarianceItem[];
  generalNote: string;
}

// ── Demo seed (shown when no GRN records in localStorage) ─────────────────────
const DEMO_RECORDS: GRNRecord[] = [
  {
    orderId: "ord-001", orderNumber: "ORD-2025-001", vendorName: "Anbu Fresh Vegetables",
    submittedAt: (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toISOString(); })(),
    generalNote: "",
    items: [
      { id: "1", name: "Tomato (Bangalore)", unit: "kg",  ordered: 5,  received: 3,  note: "Market shortage — will deliver balance tomorrow" },
      { id: "2", name: "Curry leaves",       unit: "kg",  ordered: 1,  received: 1,  note: "" },
      { id: "3", name: "Onion (medium)",     unit: "kg",  ordered: 8,  received: 10, note: "Sent extra due to good quality stock" },
    ],
  },
  {
    orderId: "ord-002", orderNumber: "ORD-2025-002", vendorName: "Senthil Dairy",
    submittedAt: (() => { const d = new Date(); d.setDate(d.getDate() - 2); return d.toISOString(); })(),
    generalNote: "Morning batch was delayed by 30 min",
    items: [
      { id: "4", name: "Milk (full cream)", unit: "L",  ordered: 24, received: 20, note: "Shortage — cow illness at farm" },
      { id: "5", name: "Curd",             unit: "kg", ordered: 8,  received: 8,  note: "" },
    ],
  },
  {
    orderId: "ord-003", orderNumber: "ORD-2025-003", vendorName: "Madurai Banana Leaf Supply",
    submittedAt: (() => { const d = new Date(); d.setDate(d.getDate() - 3); return d.toISOString(); })(),
    generalNote: "",
    items: [
      { id: "6", name: "Banana leaf",     unit: "bundle", ordered: 20, received: 14, note: "Rain damaged stock" },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function loadRecords(): { records: GRNRecord[]; isDemo: boolean } {
  try {
    const raw = localStorage.getItem("farmaze_grn_records");
    const records: GRNRecord[] = raw ? JSON.parse(raw) : [];
    if (records.length > 0) return { records, isDemo: false };
    return { records: DEMO_RECORDS, isDemo: true };
  } catch {
    return { records: DEMO_RECORDS, isDemo: true };
  }
}

type VarianceKind = "short" | "over" | "exact";
function kind(item: VarianceItem): VarianceKind {
  if (item.received < item.ordered) return "short";
  if (item.received > item.ordered) return "over";
  return "exact";
}
function diffPct(item: VarianceItem): number {
  if (item.ordered === 0) return 0;
  return Math.round(((item.received - item.ordered) / item.ordered) * 100);
}

function relativeDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const days = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

type FilterTab = "all" | "short" | "over";

// ── KPI bubble ─────────────────────────────────────────────────────────────────
function KPICard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl p-3 flex flex-col gap-0.5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <p className="text-[22px] font-bold leading-tight" style={{ color: color || C.text }}>{value}</p>
      <p className="text-[11px] font-medium" style={{ color: C.text }}>{label}</p>
      {sub && <p className="text-[10px]" style={{ color: C.muted }}>{sub}</p>}
    </div>
  );
}

// ── Variance row card ─────────────────────────────────────────────────────────
function VarianceCard({
  item, vendor, date,
}: { item: VarianceItem; vendor: string; date: string }) {
  const k   = kind(item);
  const pct = diffPct(item);
  if (k === "exact") return null;

  const isShort = k === "short";
  const colorText  = isShort ? C.red   : C.amber;
  const colorBg    = isShort ? "#FEF2F2" : "#FFFBEB";
  const colorBorder = isShort ? "#FECACA" : "#FDE68A";

  return (
    <div
      className="rounded-xl p-3.5"
      style={{ background: C.card, border: `1px solid ${C.border}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: colorBg, color: colorText, border: `1px solid ${colorBorder}` }}
            >
              {isShort ? <TrendingDown size={9} /> : <TrendingUp size={9} />}
              {isShort ? "Short" : "Over"}
            </span>
            <p className="text-[13px] font-semibold truncate" style={{ color: C.text }}>{item.name}</p>
          </div>
          <p className="text-[11px] mb-1" style={{ color: C.muted }}>{vendor} · {date}</p>
          <div className="flex items-center gap-3 text-[12px]">
            <span style={{ color: C.muted }}>
              Ordered: <strong style={{ color: C.text }}>{item.ordered} {item.unit}</strong>
            </span>
            <span style={{ color: colorText }}>
              Received: <strong>{item.received} {item.unit}</strong>
            </span>
            <span className="font-semibold" style={{ color: colorText }}>
              {pct > 0 ? "+" : ""}{pct}%
            </span>
          </div>
          {item.note && (
            <p className="text-[11px] mt-1.5 italic" style={{ color: C.muted }}>
              "{item.note}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Variance() {
  const navigate  = useNavigate();
  const [tab, setTab] = useState<FilterTab>("all");
  const { records, isDemo } = useMemo(() => loadRecords(), []);

  // Flatten all non-exact items into a flat list for display
  const allVarianceItems = useMemo(() => {
    const out: { item: VarianceItem; vendor: string; date: string; orderId: string }[] = [];
    for (const rec of records) {
      for (const item of rec.items) {
        if (kind(item) !== "exact") {
          out.push({
            item,
            vendor: rec.vendorName,
            date:   relativeDate(rec.submittedAt),
            orderId: rec.orderId,
          });
        }
      }
    }
    return out;
  }, [records]);

  const shortItems = allVarianceItems.filter(v => kind(v.item) === "short");
  const overItems  = allVarianceItems.filter(v => kind(v.item) === "over");

  const displayed = tab === "all" ? allVarianceItems : tab === "short" ? shortItems : overItems;

  // KPIs
  const totalShort     = shortItems.length;
  const totalOver      = overItems.length;
  const mostAffected   = (() => {
    const freq: Record<string, number> = {};
    for (const v of shortItems) {
      freq[v.item.name] = (freq[v.item.name] || 0) + 1;
    }
    const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
    // Show first 2 words so "Tomato (Bangalore)" becomes "Tomato (Bangalore)" not just "Tomato"
    return top ? top[0].split(" ").slice(0, 2).join(" ") : "—";
  })();
  const topVendorIssue = (() => {
    const freq: Record<string, number> = {};
    for (const v of shortItems) freq[v.vendor] = (freq[v.vendor] || 0) + 1;
    const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
    // Show first 2 words of vendor name — avoids single-word truncation
    return top ? top[0].split(" ").slice(0, 2).join(" ") : "—";
  })();

  return (
    <div className="frame-container mx-auto px-4 py-8" style={{ color: C.text }}>
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-[32px] font-bold font-playfair leading-tight">Variance</h1>
        <p className="text-[13px] mt-0.5" style={{ color: C.muted }}>
          Delivery gaps · short supply · over-delivery tracking
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <KPICard label="Short supply" value={totalShort} sub="items under-delivered" color={C.red} />
        <KPICard label="Over delivery" value={totalOver} sub="items over-delivered" color={C.amber} />
        <KPICard label="Top short item" value={mostAffected} sub="most frequent gap" />
        <KPICard label="Vendor issue" value={topVendorIssue} sub="most short supply" />
      </div>

      {/* Demo data notice */}
      {isDemo && (
        <div
          className="flex items-start gap-2 rounded-xl px-3 py-2.5 mb-4 text-[12px]"
          style={{ background: "#FFFBEB", border: "1px solid #FDE68A", color: C.amber }}
        >
          <TriangleAlert size={13} className="shrink-0 mt-0.5" />
          <span>
            <strong>Sample data</strong> — these are example records. Record a real delivery via the{" "}
            <button
              onClick={() => navigate("/orders")}
              className="underline font-semibold"
              style={{ color: C.amber }}
            >
              Orders page
            </button>{" "}
            to see your actual variance here.
          </span>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-3">
        {([
          { id: "all",   label: `All (${allVarianceItems.length})` },
          { id: "short", label: `⬇ Short (${shortItems.length})` },
          { id: "over",  label: `⬆ Over (${overItems.length})` },
        ] as { id: FilterTab; label: string }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
            style={{
              background: tab === t.id ? C.cta   : C.card,
              color:      tab === t.id ? "#fff"  : C.muted,
              border:     `1px solid ${tab === t.id ? C.cta : C.border}`,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Variance list */}
      {displayed.length > 0 ? (
        <div className="space-y-2">
          {displayed.map(({ item, vendor, date, orderId }, i) => (
            <VarianceCard key={`${orderId}-${item.id}-${i}`} item={item} vendor={vendor} date={date} />
          ))}
        </div>
      ) : (
        <div
          className="rounded-xl p-10 text-center mt-4"
          style={{ background: C.card, border: `1px solid ${C.border}` }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 rounded-2xl" style={{ background: "hsl(37 40% 94%)" }}>
              <Package size={28} style={{ color: C.muted }} />
            </div>
            <p className="text-[15px] font-semibold" style={{ color: C.text }}>No variance records yet</p>
            <p className="text-[13px]" style={{ color: C.muted }}>
              Record deliveries via GRN and short-supply gaps will appear here.
            </p>
            <button
              onClick={() => navigate("/orders")}
              className="mt-2 flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold text-white"
              style={{ background: C.cta }}
            >
              <ClipboardList size={14} /> Record a delivery
            </button>
          </div>
        </div>
      )}

      {/* GRN link */}
      {records.length > 0 && (
        <button
          onClick={() => navigate("/orders")}
          className="mt-5 flex items-center gap-1 text-[12px] font-medium"
          style={{ color: C.cta }}
        >
          <ClipboardList size={13} /> Record more deliveries
          <ChevronRight size={13} />
        </button>
      )}
    </div>
  );
}
