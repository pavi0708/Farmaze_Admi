import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  User,
  Edit2,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  ExternalLink,
} from "lucide-react";

// ── Design tokens ──────────────────────────────────────────────────────────
const C = {
  card: "#fff",
  border: "hsl(37 20% 88%)",
  text: "hsl(20 45% 12%)",
  muted: "hsl(20 20% 48%)",
  green: "#16A34A",
  amber: "#D97706",
  red: "#DC2626",
  gray: "#9CA3AF",
  cta: "hsl(33 65% 46%)",
  bg: "hsl(37 47% 96%)",
};

// ── Mock data ──────────────────────────────────────────────────────────────
interface SlotCell {
  state: "done" | "scheduled" | "draft" | "upcoming" | "empty";
}

interface WeekSlot {
  label: string; // e.g. "AM 5:30"
  days: SlotCell[]; // 7 days Mon–Sun
}

interface BranchStat {
  name: string;
  weeklySpend: number;
  items: string;
  barPct: number;
}

interface ActivityItem {
  time: string;
  title: string;
  description: string;
  status: "delivered" | "pending" | "variance" | "info";
}

interface VendorData {
  id: string;
  name: string;
  categories: string;
  phone: string;
  contact: string;
  onTimePct: number;
  onTimeDelta: number;
  shortSupplyPct: number;
  shortSupplyDelta: number;
  priceDrift: number;
  priceDriftNote: string;
  weeklySpend: number;
  slotsThisWeek: number;
  totalSlots: number;
  upcomingSlots: number;
  weekSlots: WeekSlot[];
  orderRules: {
    cadence: string;
    amCutoff: string;
    pmCutoff: string;
    channel: string;
    autoConfirm: string;
  };
  recentActivity: ActivityItem[];
  branches: BranchStat[];
}

const VENDORS: Record<string, VendorData> = {
  "senthil-dairy": {
    id: "senthil-dairy",
    name: "Senthil Dairy",
    categories: "Milk • Curd • Ghee • Paneer",
    phone: "+91 98401 23456",
    contact: "Mr. Senthil Kumar",
    onTimePct: 96,
    onTimeDelta: 2,
    shortSupplyPct: 3.1,
    shortSupplyDelta: -0.8,
    priceDrift: 0,
    priceDriftNote: "stable since Sep",
    weeklySpend: 42000,
    slotsThisWeek: 11,
    totalSlots: 14,
    upcomingSlots: 3,
    weekSlots: [
      {
        label: "AM 5:30",
        days: [
          { state: "done" },
          { state: "done" },
          { state: "upcoming" },
          { state: "upcoming" },
          { state: "upcoming" },
          { state: "upcoming" },
          { state: "upcoming" },
        ],
      },
      {
        label: "PM 6:00",
        days: [
          { state: "done" },
          { state: "scheduled" },
          { state: "upcoming" },
          { state: "upcoming" },
          { state: "upcoming" },
          { state: "upcoming" },
          { state: "upcoming" },
        ],
      },
    ],
    orderRules: {
      cadence: "2× daily • all 7 days",
      amCutoff: "10:30 PM previous day",
      pmCutoff: "2:00 PM same day",
      channel: "WhatsApp text",
      autoConfirm: "if within ±20% of avg",
    },
    recentActivity: [
      {
        time: "Today 5:30 AM",
        title: "Delivered to T. Nagar",
        description: "Milk 24L, curd 8kg, ghee 1kg • ₹3,400 • matched PO exactly",
        status: "delivered",
      },
      {
        time: "Today 5:30 AM",
        title: "Delivered to Nolambur",
        description: "Milk 18L, curd 5kg • ₹2,100 • matched PO exactly",
        status: "delivered",
      },
      {
        time: "Today 5:55 AM",
        title: "Senthil acknowledged AM order",
        description: 'Replied "ok" via WhatsApp at 9:43 PM yesterday',
        status: "info",
      },
      {
        time: "Yesterday 9:30 PM",
        title: "AM order dispatched",
        description: "WhatsApp text • both branches in one message",
        status: "info",
      },
      {
        time: "Mon 11 Nov",
        title: "Variance flagged • curd short 1kg",
        description: "Nolambur PM delivery • resolved with Senthil same evening",
        status: "variance",
      },
    ],
    branches: [
      {
        name: "T. Nagar",
        weeklySpend: 24400,
        items: "Milk 168L, curd 56kg, ghee 3.5kg",
        barPct: 58,
      },
      {
        name: "Nolambur",
        weeklySpend: 17800,
        items: "Milk 126L, curd 35kg",
        barPct: 42,
      },
    ],
  },
  "anbu-fresh": {
    id: "anbu-fresh",
    name: "Anbu Fresh Vegetables",
    categories: "Veg • Greens • Curry leaves",
    phone: "+91 98765 43210",
    contact: "Mr. Anbu",
    onTimePct: 88,
    onTimeDelta: -3,
    shortSupplyPct: 7.2,
    shortSupplyDelta: 1.4,
    priceDrift: 18,
    priceDriftNote: "tomato +18% this week",
    weeklySpend: 18400,
    slotsThisWeek: 5,
    totalSlots: 6,
    upcomingSlots: 1,
    weekSlots: [
      {
        label: "AM 6:15",
        days: [
          { state: "done" },
          { state: "done" },
          { state: "scheduled" },
          { state: "upcoming" },
          { state: "upcoming" },
          { state: "upcoming" },
          { state: "empty" },
        ],
      },
    ],
    orderRules: {
      cadence: "Once daily • Mon–Sat",
      amCutoff: "10:30 PM previous day",
      pmCutoff: "-",
      channel: "WA voice (Tamil)",
      autoConfirm: "if within ±20% of avg",
    },
    recentActivity: [
      {
        time: "Today 6:15 AM",
        title: "Variance on delivery — T. Nagar",
        description: "Short 4kg tomato • driver replaced with hybrid variety",
        status: "variance",
      },
      {
        time: "Yesterday 6:10 AM",
        title: "Delivered to T. Nagar",
        description: "Tomato 5kg, onion 8kg, 7 more items • ₹4,100",
        status: "delivered",
      },
    ],
    branches: [
      { name: "T. Nagar", weeklySpend: 18400, items: "Tomato, onion, curry leaves + 6 more", barPct: 100 },
    ],
  },
};

const FALLBACK_VENDOR: VendorData = VENDORS["senthil-dairy"];

// ── Sub-components ─────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  delta,
  sub,
  deltaPositiveIsGood = true,
}: {
  label: string;
  value: React.ReactNode;
  delta?: number;
  sub?: string;
  deltaPositiveIsGood?: boolean;
}) {
  const deltaColor =
    delta === undefined
      ? C.muted
      : delta === 0
      ? C.muted
      : (delta > 0) === deltaPositiveIsGood
      ? C.green
      : C.red;

  return (
    <div
      className="flex-1 min-w-0 rounded-xl p-4"
      style={{ background: C.card, border: `1px solid ${C.border}` }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: C.muted }}>
        {label}
      </p>
      <div className="flex items-baseline gap-1.5">
        <p className="text-[20px] font-bold font-playfair" style={{ color: C.text }}>
          {value}
        </p>
        {delta !== undefined && delta !== 0 && (
          <span className="text-[11px] font-semibold" style={{ color: deltaColor }}>
            {delta > 0 ? "↑" : "↓"} {Math.abs(delta)}%
          </span>
        )}
      </div>
      {sub && (
        <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function SlotDot({ state }: { state: SlotCell["state"] }) {
  if (state === "done")
    return (
      <div
        className="h-9 w-full rounded-lg flex items-center justify-center"
        style={{ background: C.green }}
      >
        <svg viewBox="0 0 10 8" width="12" fill="none" stroke="#fff" strokeWidth="2">
          <path d="M1 4l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  if (state === "scheduled")
    return (
      <div
        className="h-9 w-full rounded-lg flex items-center justify-center"
        style={{ background: C.amber }}
      >
        <div className="h-2 w-2 rounded-full bg-white" />
      </div>
    );
  if (state === "upcoming" || state === "draft")
    return (
      <div
        className="h-9 w-full rounded-lg flex items-center justify-center"
        style={{ border: `1.5px dashed ${C.border}` }}
      >
        <div className="h-1.5 w-1.5 rounded-full" style={{ background: C.border }} />
      </div>
    );
  return <div className="h-9 w-full" />;
}

function SlotGrid({ slots }: { slots: WeekSlot[] }) {
  const days = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
  const dates = [11, 12, 13, 14, 15, 16, 17];

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm" style={{ background: C.green }} />
          <span className="text-[11px]" style={{ color: C.muted }}>Done</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm" style={{ background: C.amber }} />
          <span className="text-[11px]" style={{ color: C.muted }}>Scheduled</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm" style={{ border: `1.5px dashed ${C.border}` }} />
          <span className="text-[11px]" style={{ color: C.muted }}>Draft</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-1.5">
        {/* Day headers */}
        <div />
        {days.map((d, i) => (
          <div key={d} className="text-center">
            <p className="text-[10px] font-semibold" style={{ color: C.muted }}>
              {d}
            </p>
            <p className="text-[12px] font-bold" style={{ color: C.text }}>
              {dates[i]}
            </p>
          </div>
        ))}

        {/* Slot rows */}
        {slots.map((slot) => (
          <>
            <div key={`label-${slot.label}`} className="flex items-center">
              <p className="text-[11px] font-medium" style={{ color: C.muted }}>
                {slot.label}
              </p>
            </div>
            {slot.days.map((cell, i) => (
              <SlotDot key={i} state={cell.state} />
            ))}
          </>
        ))}
      </div>
    </div>
  );
}

function ActivityDot({ status }: { status: ActivityItem["status"] }) {
  const colorMap = {
    delivered: C.green,
    variance: C.red,
    info: C.gray,
    pending: C.amber,
  };
  return (
    <div
      className="mt-1 h-2 w-2 shrink-0 rounded-full"
      style={{ background: colorMap[status] }}
    />
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function VendorProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const vendor = (id && VENDORS[id]) ?? FALLBACK_VENDOR;

  return (
    <div className="frame-container mx-auto px-4 py-8" style={{ color: C.text }}>
      {/* ── Breadcrumb ── */}
      <button
        onClick={() => navigate("/vendors")}
        className="flex items-center gap-1.5 mb-4 text-[12px] font-medium hover:underline"
        style={{ color: C.muted }}
      >
        <ArrowLeft size={13} /> Vendors
      </button>

      {/* ── Vendor header ── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-4">
          <div
            className="h-14 w-14 rounded-2xl flex items-center justify-center text-[22px] font-bold text-white shrink-0"
            style={{ background: C.cta }}
          >
            {vendor.name[0]}
          </div>
          <div>
            <h1 className="text-[28px] font-bold font-playfair leading-tight">{vendor.name}</h1>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-[12px]" style={{ color: C.muted }}>
                {vendor.categories}
              </span>
              <span className="flex items-center gap-1 text-[12px]" style={{ color: C.muted }}>
                <Phone size={11} /> {vendor.phone}
              </span>
              <span className="flex items-center gap-1 text-[12px]" style={{ color: C.muted }}>
                <User size={11} /> {vendor.contact}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-medium border hover:bg-stone-50"
            style={{ borderColor: C.border, color: C.text, background: C.card }}
          >
            <Edit2 size={12} /> Edit rules
          </button>
          <button
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-semibold text-white"
            style={{ background: C.cta }}
          >
            <MessageCircle size={12} /> Open chat
          </button>
        </div>
      </div>

      {/* ── KPI tiles ── */}
      <div className="flex gap-3 mb-5">
        <KpiCard
          label="On-Time"
          value={`${vendor.onTimePct}%`}
          delta={vendor.onTimeDelta}
          sub="last 30 days"
        />
        <KpiCard
          label="Short-Supply"
          value={`${vendor.shortSupplyPct}%`}
          delta={vendor.shortSupplyDelta}
          sub={vendor.shortSupplyDelta < 0 ? "curd most often" : "tomato most often"}
          deltaPositiveIsGood={false}
        />
        <KpiCard
          label="Price Drift"
          value={vendor.priceDrift === 0 ? "₹0" : `+${vendor.priceDrift}%`}
          sub={vendor.priceDriftNote}
        />
        <KpiCard
          label="Spend"
          value={`₹${Math.round(vendor.weeklySpend / 1000)}K`}
          sub="this week • both branches"
        />
        <KpiCard
          label="Slots"
          value={`${vendor.slotsThisWeek}/${vendor.totalSlots}`}
          sub={`this week • ${vendor.upcomingSlots} upcoming`}
        />
      </div>

      {/* ── Bottom two-column layout ── */}
      <div className="grid grid-cols-[1fr_280px] gap-4">
        {/* Left: slot grid + recent activity */}
        <div className="space-y-4">
          {/* Slot grid */}
          <div
            className="rounded-xl p-5"
            style={{ background: C.card, border: `1px solid ${C.border}` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[14px] font-semibold" style={{ color: C.text }}>
                  This week's slots
                </p>
                <p className="text-[11px]" style={{ color: C.muted }}>
                  {vendor.orderRules.cadence} • across both branches
                </p>
              </div>
            </div>
            <SlotGrid slots={vendor.weekSlots} />
          </div>

          {/* Recent activity */}
          <div
            className="rounded-xl p-5"
            style={{ background: C.card, border: `1px solid ${C.border}` }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-[14px] font-semibold" style={{ color: C.text }}>
                Recent activity
              </p>
              <button
                className="text-[12px] font-medium"
                style={{ color: C.cta }}
              >
                Open ledger <ExternalLink size={10} className="inline" />
              </button>
            </div>
            <div className="space-y-3">
              {vendor.recentActivity.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <p
                    className="text-[11px] w-[100px] shrink-0 pt-0.5 leading-tight"
                    style={{ color: C.muted }}
                  >
                    {item.time}
                  </p>
                  <ActivityDot status={item.status} />
                  <div>
                    <p className="text-[12px] font-semibold" style={{ color: C.text }}>
                      {item.title}
                    </p>
                    <p className="text-[11px]" style={{ color: C.muted }}>
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: order rules + by branch */}
        <div className="space-y-4">
          {/* Order rules */}
          <div
            className="rounded-xl p-5"
            style={{ background: C.card, border: `1px solid ${C.border}` }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[14px] font-semibold" style={{ color: C.text }}>
                Order rules
              </p>
              <button className="text-[12px] font-medium" style={{ color: C.cta }}>
                Edit
              </button>
            </div>
            <div className="space-y-2.5">
              {[
                { label: "CADENCE", value: vendor.orderRules.cadence },
                { label: "AM CUTOFF", value: vendor.orderRules.amCutoff },
                { label: "PM CUTOFF", value: vendor.orderRules.pmCutoff },
                { label: "CHANNEL", value: vendor.orderRules.channel },
                { label: "AUTO-CONFIRM", value: vendor.orderRules.autoConfirm },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start justify-between gap-2">
                  <p
                    className="text-[10px] font-semibold uppercase tracking-widest mt-0.5 shrink-0"
                    style={{ color: C.muted }}
                  >
                    {label}
                  </p>
                  <p className="text-[12px] font-medium text-right" style={{ color: C.text }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* By branch */}
          <div
            className="rounded-xl p-5"
            style={{ background: C.card, border: `1px solid ${C.border}` }}
          >
            <p className="text-[14px] font-semibold mb-3" style={{ color: C.text }}>
              By branch
            </p>
            <div className="space-y-3">
              {vendor.branches.map((b) => (
                <div
                  key={b.name}
                  className="rounded-lg p-3"
                  style={{ background: "hsl(37 47% 97%)", border: `1px solid ${C.border}` }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[13px] font-semibold" style={{ color: C.text }}>
                      {b.name}
                    </p>
                    <p className="text-[12px] font-bold" style={{ color: C.text }}>
                      ₹{(b.weeklySpend / 1000).toFixed(1)}K
                      <span className="text-[10px] font-normal ml-0.5" style={{ color: C.muted }}>
                        /wk
                      </span>
                    </p>
                  </div>
                  <div
                    className="h-1.5 rounded-full mb-1.5 overflow-hidden"
                    style={{ background: "hsl(37 20% 88%)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${b.barPct}%`, background: C.cta }}
                    />
                  </div>
                  <p className="text-[11px]" style={{ color: C.muted }}>
                    {b.items}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
