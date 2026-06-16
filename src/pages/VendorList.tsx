import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";

// ── Design tokens ──────────────────────────────────────────────────────────
const C = {
  card: "#fff",
  border: "hsl(37 20% 88%)",
  text: "hsl(20 45% 12%)",
  muted: "hsl(20 20% 48%)",
  green: "#16A34A",
  amber: "#D97706",
  red: "#DC2626",
  cta: "hsl(33 65% 46%)",
};

// ── Mock data ──────────────────────────────────────────────────────────────
interface Vendor {
  id: string;
  name: string;
  categories: string;
  branch: string;
  onTimePct: number;
  shortSupplyPct: number;
  weeklySpend: number;
  cadence: string;
  channel: string;
  status: "active" | "issue" | "inactive";
}

const VENDORS: Vendor[] = [
  {
    id: "senthil-dairy",
    name: "Senthil Dairy",
    categories: "Milk • Curd • Ghee • Paneer",
    branch: "T. Nagar + Nolambur",
    onTimePct: 96,
    shortSupplyPct: 3.1,
    weeklySpend: 42000,
    cadence: "2× daily • All 7",
    channel: "WA text",
    status: "active",
  },
  {
    id: "anbu-fresh",
    name: "Anbu Fresh Vegetables",
    categories: "Veg • Greens • Curry leaves",
    branch: "T. Nagar",
    onTimePct: 88,
    shortSupplyPct: 7.2,
    weeklySpend: 18400,
    cadence: "Daily • Mon–Sat",
    channel: "WA voice • Tamil",
    status: "issue",
  },
  {
    id: "velmurugan",
    name: "Velmurugan Vegetables",
    categories: "Veg • Curry leaves",
    branch: "Nolambur",
    onTimePct: 94,
    shortSupplyPct: 2.8,
    weeklySpend: 15600,
    cadence: "Daily • Mon–Sat",
    channel: "WA voice • Tamil",
    status: "active",
  },
  {
    id: "kg-rice",
    name: "KG Rice & Mills",
    categories: "Idli rice • Urad dal • Sona masuri",
    branch: "T. Nagar",
    onTimePct: 99,
    shortSupplyPct: 0.5,
    weeklySpend: 8200,
    cadence: "Weekly • Wed",
    channel: "Email",
    status: "active",
  },
  {
    id: "pollachi",
    name: "Pollachi Coconut Co.",
    categories: "Coconut • Tender coconut • Copra",
    branch: "T. Nagar",
    onTimePct: 91,
    shortSupplyPct: 4.1,
    weeklySpend: 6600,
    cadence: "2× weekly • Mon, Thu",
    channel: "WA photo",
    status: "active",
  },
  {
    id: "madurai-banana",
    name: "Madurai Banana Leaf Supply",
    categories: "Banana leaf",
    branch: "T. Nagar + Nolambur",
    onTimePct: 85,
    shortSupplyPct: 8.0,
    weeklySpend: 3200,
    cadence: "3× weekly • Mon/Wed/Fri",
    channel: "WA text",
    status: "issue",
  },
];

function StatusBadge({ status }: { status: Vendor["status"] }) {
  if (status === "active")
    return <CheckCircle2 size={14} style={{ color: C.green }} />;
  if (status === "issue")
    return <AlertTriangle size={14} style={{ color: C.amber }} />;
  return <div className="h-2 w-2 rounded-full bg-stone-300" />;
}

function VendorCard({ vendor }: { vendor: Vendor }) {
  const navigate = useNavigate();
  return (
    <div
      className="rounded-xl p-4 cursor-pointer hover:shadow-sm transition-shadow"
      style={{ background: C.card, border: `1px solid ${C.border}` }}
      onClick={() => navigate(`/vendors/${vendor.id}`)}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center text-[14px] font-bold text-white shrink-0"
            style={{ background: C.cta }}
          >
            {vendor.name[0]}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[14px] font-semibold" style={{ color: C.text }}>
                {vendor.name}
              </p>
              <StatusBadge status={vendor.status} />
            </div>
            <p className="text-[11px]" style={{ color: C.muted }}>
              {vendor.categories}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0 ml-2">
          <p className="text-[14px] font-bold" style={{ color: C.text }}>
            ₹{(vendor.weeklySpend / 1000).toFixed(0)}K
          </p>
          <p className="text-[10px]" style={{ color: C.muted }}>
            /week
          </p>
        </div>
      </div>

      {/* Branch + cadence */}
      <p className="text-[11px] mb-3" style={{ color: C.muted }}>
        {vendor.branch} · {vendor.cadence} · {vendor.channel}
      </p>

      {/* KPI row */}
      <div className="flex gap-4">
        <div>
          <p
            className="text-[12px] font-semibold"
            style={{ color: vendor.onTimePct >= 90 ? C.green : C.amber }}
          >
            {vendor.onTimePct}%
          </p>
          <p className="text-[10px]" style={{ color: C.muted }}>
            on-time
          </p>
        </div>
        <div>
          <p
            className="text-[12px] font-semibold"
            style={{ color: vendor.shortSupplyPct < 5 ? C.text : C.red }}
          >
            {vendor.shortSupplyPct}%
          </p>
          <p className="text-[10px]" style={{ color: C.muted }}>
            short supply
          </p>
        </div>
      </div>
    </div>
  );
}

type FilterTab = "all" | "issue" | "active";

export default function VendorList() {
  const [query, setQuery]       = useState("");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");

  const issueCount  = VENDORS.filter((v) => v.status === "issue").length;
  const activeCount = VENDORS.filter((v) => v.status === "active").length;

  const filtered = VENDORS.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(query.toLowerCase()) ||
      v.categories.toLowerCase().includes(query.toLowerCase());
    const matchesTab =
      filterTab === "all"    ? true :
      filterTab === "issue"  ? v.status === "issue" :
      filterTab === "active" ? v.status === "active" : true;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="frame-container mx-auto px-4 py-8" style={{ color: C.text }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[32px] font-bold font-playfair leading-tight">Vendors</h1>
          <p className="text-[13px] mt-0.5" style={{ color: C.muted }}>
            {VENDORS.length} vendors · {issueCount} need attention
          </p>
        </div>
        <button
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold text-white"
          style={{ background: C.cta }}
        >
          <Plus size={14} /> Add vendor
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-3">
        {([
          { id: "all",    label: `All (${VENDORS.length})` },
          { id: "issue",  label: `⚠ Needs attention (${issueCount})` },
          { id: "active", label: `✓ Active (${activeCount})` },
        ] as { id: FilterTab; label: string }[]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterTab(tab.id)}
            className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
            style={{
              background: filterTab === tab.id ? C.cta : C.card,
              color:      filterTab === tab.id ? "#fff" : C.muted,
              border:     `1px solid ${filterTab === tab.id ? C.cta : C.border}`,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div
        className="flex items-center gap-2 rounded-xl px-4 py-2.5 mb-5"
        style={{ background: C.card, border: `1px solid ${C.border}` }}
      >
        <Search size={15} style={{ color: C.muted }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search vendors or categories…"
          className="flex-1 bg-transparent text-[13px] outline-none"
          style={{ color: C.text }}
        />
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((v) => (
          <VendorCard key={v.id} vendor={v} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-2 py-16 text-center">
            <p className="text-[14px]" style={{ color: C.muted }}>
              No vendors match "{query}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
