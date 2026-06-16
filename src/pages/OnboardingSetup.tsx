/**
 * OnboardingSetup — 4-step setup wizard matching the new mockup.
 *
 * Steps: Welcome → Your Supply (2a) → Order Rules (2b) → Review (3) → Done (4)
 *
 * Wired to useOnboarding: calls advanceStep(COMPLETE) on finish,
 * markSkipped() on "Skip for now". All vendor/product data is mock
 * until the extraction backend is ready.
 */
import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useOnboarding, ONBOARDING_STEPS } from "@/hooks/useOnboarding";
import { toast } from "sonner";
import {
  Check,
  ChevronRight,
  Plus,
  Edit2,
  MessageSquare,
  Mic,
  Camera,
  Mail,
  Phone,
  ArrowLeft,
  Link,
  Loader2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Upload,
  Archive,
  Calendar,
} from "lucide-react";
import {
  onboardParseStream,
  onboardUploadStream,
  getOnboardSession,
  saveOnboardStep,
  renameBranchInSession,
  updateBranchMapping,
  type OnboardParseEvent,
  type OnboardParseResult,
} from "@/api/agentApi";
import {
  parsedToBranchData,
  parsedToVendorRules,
  parsedToReviewVendors,
  type BranchData,
  type VendorRule,
  type ReviewVendor,
  type ExtractedVendor,
} from "@/utils/onboardingTransform";

// ── Design tokens (match existing warm editorial palette) ──────────────────
const T = {
  bg: "hsl(37 47% 96%)",
  surface: "#fff",
  border: "hsl(37 20% 88%)",
  ink: "hsl(20 45% 12%)",
  muted: "hsl(20 20% 48%)",
  amber: "hsl(33 65% 46%)",
  amberLight: "hsl(37 70% 93%)",
  amberBorder: "hsl(33 50% 80%)",
  green: "#16A34A",
  red: "#DC2626",
};

// ── Types ──────────────────────────────────────────────────────────────────
type StepKey = "import" | "supply" | "rules" | "review" | "done";

const STEP_ORDER: StepKey[] = ["import", "supply", "rules", "review", "done"];

const STEPPER = [
  { key: "import",  label: "Import" },
  { key: "supply",  label: "Your supply" },
  { key: "review",  label: "Review" },
  { key: "done",    label: "Done" },
] as const;

const stepperIndex = (key: StepKey) => {
  if (key === "import")  return 0;
  if (key === "supply" || key === "rules") return 1;
  if (key === "review") return 2;
  return 3;
};

// ── Mock fallback data (used when no invoices have been imported) ───────────
const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

const MOCK_BRANCHES: BranchData[] = [
  {
    id: "tnagar",
    name: "Tiffin Shastra • T. Nagar",
    address: "Usman Road",
    covers: 120,
    service: "breakfast + dinner",
    vendors: [
      {
        id: "anbu", name: "Anbu Fresh Vegetables", description: "Veg & curry leaves",
        sources: [{ label: "28 WhatsApp", type: "wa" }, { label: "3 PDFs", type: "pdf" }],
        days: [true, true, true, true, true, true, false], rhythmLabel: "DAILY • MON–SAT",
        catalogueCount: 42, spentLabel: "₹1.18L", confidence: 94, confirmed: true,
      },
      {
        id: "kg", name: "KG Rice & Mills", description: "Idli rice, urad dal, sona masuri",
        sources: [{ label: "1 Sheet", type: "sheet" }, { label: "8 PDFs", type: "pdf" }],
        days: [false, false, true, false, false, false, false], rhythmLabel: "WEEKLY • WED",
        catalogueCount: 14, spentLabel: "₹2.34L", confidence: 97, confirmed: true,
      },
    ],
  },
  {
    id: "nolambur",
    name: "Tiffin Shastra • Nolambur",
    address: "Mogappair East",
    covers: 80,
    service: "breakfast only",
    vendors: [
      {
        id: "velmu", name: "Velmurugan Vegetables", description: "Veg & curry leaves",
        sources: [{ label: "22 WhatsApp", type: "wa" }],
        days: [true, true, true, true, true, true, false], rhythmLabel: "DAILY • MON–SAT",
        catalogueCount: 36, spentLabel: "₹78,400", confidence: 91, confirmed: true,
      },
      {
        id: "senthil", name: "Senthil Dairy", description: "Milk, curd, ghee • shared with T. Nagar",
        sources: [{ label: "2 Sheets", type: "sheet" }, { label: "2 PDFs", type: "pdf" }],
        days: [true, true, true, true, true, true, true], rhythmLabel: "DAILY • ALL 7",
        catalogueCount: 7, spentLabel: "₹28,600", confidence: 92, confirmed: true,
      },
    ],
  },
];

const MOCK_VENDOR_RULES: VendorRule[] = [
  {
    id: "anbu-tnagar", name: "Anbu Fresh Vegetables", branch: "T. Nagar", description: "Veg & curry leaves",
    needsReview: true, confirmed: false,
    days: [true, true, true, true, true, true, false], perDay: "Once a day",
    cutoff: "10:30 PM previous day", channel: "WA voice", lang: "Tamil",
  },
  {
    id: "senthil-tnagar", name: "Senthil Dairy", branch: "T. Nagar", description: "Milk, curd, ghee",
    needsReview: false, confirmed: true,
    days: [true, true, true, true, true, true, true], perDay: "2× a day",
    cutoff: "10:30 PM previous day", channel: "WA text", lang: "",
  },
  {
    id: "senthil-nolambur", name: "Senthil Dairy", branch: "Nolambur", description: "Milk, curd, ghee",
    needsReview: false, confirmed: true,
    days: [true, true, true, true, true, true, true], perDay: "2× a day",
    cutoff: "10:30 PM previous day", channel: "WA text", lang: "",
  },
  {
    id: "kg-tnagar", name: "KG Rice & Mills", branch: "T. Nagar", description: "Rice, dal, etc.",
    needsReview: false, confirmed: true,
    days: [false, false, true, false, false, false, false], perDay: "Once a day",
    cutoff: "8:00 PM previous day", channel: "Email", lang: "",
  },
  {
    id: "pollachi-tnagar", name: "Pollachi Coconut Co.", branch: "T. Nagar", description: "Coconut, copra",
    needsReview: true, confirmed: false,
    days: [true, false, false, true, false, false, false], perDay: "Once a day",
    cutoff: "9:00 PM previous day", channel: "WA photo", lang: "",
  },
];

const MOCK_REVIEW_VENDORS: ReviewVendor[] = [
  {
    id: "anbu", name: "Anbu Fresh Vegetables", branch: "T. Nagar",
    itemCount: 42, categories: "Vegetables, Greens", status: "ready",
    products: [
      { name: "Tomato", unit: "kg", avgPrice: 30, freq: "Daily" },
      { name: "Onion", unit: "kg", avgPrice: 25, freq: "Daily" },
      { name: "Potato", unit: "kg", avgPrice: 22, freq: "Daily" },
      { name: "Coriander", unit: "bunch", avgPrice: 8, freq: "Daily" },
      { name: "Ginger", unit: "kg", avgPrice: 90, freq: "Weekly" },
    ],
  },
  { id: "kg", name: "KG Rice & Mills", branch: "T. Nagar", itemCount: 14, categories: "Rice, Pulses, Oils", status: "ready" },
  { id: "senthil", name: "Senthil Dairy", branch: "T. Nagar + Nolambur", itemCount: 9, categories: "Milk, Curd, Ghee", status: "missing_phone" },
  { id: "velmu", name: "Velmurugan Vegetables", branch: "Nolambur", itemCount: 36, categories: "Vegetables, Greens", status: "ready" },
];

// ── Shared primitives ──────────────────────────────────────────────────────
function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-0.5 w-full" style={{ background: T.border }}>
      <div className="h-full transition-all duration-500" style={{ width: `${pct}%`, background: T.amber }} />
    </div>
  );
}

function StepperBar({ current }: { current: StepKey }) {
  const active = stepperIndex(current);
  return (
    <div className="flex items-center gap-0">
      {STEPPER.map((s, i) => {
        const done = i < active;
        const isActive = i === active;
        return (
          <div key={s.key} className="flex items-center gap-2">
            <div
              className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
              style={{
                background: done ? T.green : isActive ? T.amber : T.border,
                color: done || isActive ? "#fff" : T.muted,
              }}
            >
              {done ? <Check size={11} /> : i + 1}
            </div>
            <span
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: isActive ? T.ink : done ? T.green : T.muted }}
            >
              {s.label}
            </span>
            {i < STEPPER.length - 1 && (
              <div className="mx-3 h-px w-6" style={{ background: i < active ? T.green : T.border }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function CadenceDots({ days, size = "md" }: { days: boolean[]; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "h-[18px] w-[18px] text-[9px]" : "h-5 w-5 text-[10px]";
  return (
    <div className="flex gap-0.5">
      {days.map((on, i) => (
        <div
          key={i}
          className={`${cls} rounded flex items-center justify-center font-bold`}
          style={{ background: on ? T.amber : T.border, color: on ? "#fff" : T.muted }}
        >
          {DAY_LETTERS[i]}
        </div>
      ))}
    </div>
  );
}

function ConfBar({ pct }: { pct: number }) {
  const color = pct >= 90 ? T.green : pct >= 70 ? T.amber : T.red;
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: T.border }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[11px] font-semibold w-6" style={{ color: T.ink }}>{pct}%</span>
    </div>
  );
}

function SourcePill({ source }: { source: ExtractedVendor["sources"][0] }) {
  const iconMap = { wa: "💬", pdf: "📄", sheet: "📊" };
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
      style={{ background: T.amberLight, color: T.muted, border: `1px solid ${T.border}` }}
    >
      {iconMap[source.type]} {source.label}
    </span>
  );
}

// ── Layout wrapper ─────────────────────────────────────────────────────────
function SetupShell({
  step,
  pct,
  showSkip,
  onSkip,
  children,
}: {
  step: StepKey;
  pct: number;
  showSkip: boolean;
  onSkip: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: T.bg }}>
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-8 py-4"
        style={{ background: T.surface, borderBottom: `1px solid ${T.border}` }}
      >
        <div className="flex items-baseline gap-3">
          <img src="/logo_header.png" alt="Farmaze" className="h-5 w-auto" />
          <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: T.muted }}>
            Setup
          </span>
        </div>
        <StepperBar current={step} />
        {showSkip ? (
          <button onClick={onSkip} className="text-[12px] hover:underline" style={{ color: T.muted }}>
            Skip for now
          </button>
        ) : (
          <div className="w-20" />
        )}
      </header>
      <ProgressBar pct={pct} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

// ── Live discovery types ───────────────────────────────────────────────────
interface BranchLive {
  count: number;
  minDate: string | null;
  maxDate: string | null;
  vendorNames: string[];
}

function formatShortDate(iso: string): string {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch { return iso; }
}

function LiveDiscovery({ stats, warnCount, errorLines }: {
  stats: Record<string, BranchLive>;
  warnCount: number;
  errorLines: string[];
}) {
  const [showErrors, setShowErrors] = useState(false);
  const branches = Object.entries(stats);
  if (branches.length === 0 && warnCount === 0) return null;
  return (
    <div className="rounded-xl border overflow-hidden mb-4" style={{ background: T.surface, borderColor: T.border }}>
      <div className="px-4 py-2.5 flex items-center justify-between border-b" style={{ borderColor: T.border, background: "hsl(37 47% 98%)" }}>
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: T.muted }}>What we're finding</span>
        {warnCount > 0 && (
          <button onClick={() => setShowErrors(v => !v)} className="flex items-center gap-1 text-[11px] font-medium" style={{ color: T.amber }}>
            <AlertTriangle size={10} /> {warnCount} error{warnCount !== 1 ? "s" : ""} {showErrors ? "▲" : "▼"}
          </button>
        )}
      </div>
      {branches.map(([branch, s]) => (
        <div key={branch} className="px-4 py-3 border-b last:border-b-0 flex items-center justify-between" style={{ borderColor: T.border }}>
          <div className="min-w-0 mr-4">
            <p className="text-[13px] font-semibold truncate" style={{ color: T.ink }}>🏪 {branch}</p>
            {s.vendorNames.length > 0 && (
              <p className="text-[11px] truncate mt-0.5" style={{ color: T.muted }}>{s.vendorNames.join(" · ")}</p>
            )}
          </div>
          <div className="flex items-center gap-4 shrink-0 text-right">
            <div>
              <span className="text-[13px] font-semibold" style={{ color: T.ink }}>{s.count}</span>
              <span className="text-[11px] ml-1" style={{ color: T.muted }}>invoice{s.count !== 1 ? "s" : ""}</span>
            </div>
            {s.minDate && s.maxDate && (
              <span className="text-[11px]" style={{ color: T.muted }}>
                {s.minDate === s.maxDate ? formatShortDate(s.minDate) : `${formatShortDate(s.minDate)} – ${formatShortDate(s.maxDate)}`}
              </span>
            )}
          </div>
        </div>
      ))}
      {showErrors && errorLines.length > 0 && (
        <div className="border-t" style={{ borderColor: T.border }}>
          {errorLines.map((line, i) => (
            <div key={i} className="flex items-start gap-2 px-4 py-2 border-b last:border-b-0" style={{ borderColor: T.border }}>
              <AlertTriangle size={11} style={{ color: T.amber }} className="shrink-0 mt-0.5" />
              <span className="text-[11px]" style={{ color: T.muted }}>{line}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Step 0: Import invoices ────────────────────────────────────────────────
type ParseStatus = "idle" | "parsing" | "done" | "error";
type SourceType = "drive" | "upload" | "zip";

const SOURCE_TABS: { id: SourceType; label: string; icon: React.ReactNode; accept: string; multiple: boolean }[] = [
  { id: "drive",  label: "Google Drive", icon: <Link size={13} />,    accept: "",                                       multiple: false },
  { id: "upload", label: "Upload files", icon: <Upload size={13} />,  accept: ".pdf,.jpg,.jpeg,.png,.webp,.gif,.csv",   multiple: true  },
  { id: "zip",    label: "ZIP folder",   icon: <Archive size={13} />, accept: ".zip",                                   multiple: false },
];

function StepImport({
  onDone,
  onSkip,
  existingSessionId,
  resumeBanner,
  initialDriveLink,
  onLinkChange,
}: {
  onDone: (result: OnboardParseResult, sessionId: string | null) => void;
  onSkip: () => void;
  existingSessionId?: string | null;
  initialDriveLink?: string;
  onLinkChange?: (link: string) => void;
  resumeBanner?: { processed: number; total: number } | null;
}) {
  const { user } = useAuth();

  const [sourceType, setSourceType] = useState<SourceType>("drive");
  const [driveLink, setDriveLink]   = useState(initialDriveLink ?? "");
  const [files, setFiles]           = useState<File[]>([]);

  const updateDriveLink = (val: string) => { setDriveLink(val); onLinkChange?.(val); };

  const [useDateFilter, setUseDateFilter] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");

  const [status, setStatus]   = useState<ParseStatus>("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [liveStats, setLiveStats] = useState<Record<string, BranchLive>>({});
  const [warnCount, setWarnCount] = useState(0);
  const [errorLines, setErrorLines] = useState<string[]>([]);
  const [result, setResult]   = useState<OnboardParseResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [sessionIdLocal, setSessionIdLocal] = useState<string | null>(existingSessionId ?? null);
  const abortRef    = useRef<(() => void) | null>(null);
  const logRef      = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const appendEvent = (ev: OnboardParseEvent) => {
    // Capture session_id from any event
    if ((ev as unknown as { session_id?: string }).session_id) {
      setSessionIdLocal((ev as unknown as { session_id: string }).session_id);
    }
    if (ev.type === "done" && ev.result) { setResult(ev.result); setStatus("done"); }
    if (ev.type === "error") { setErrorMsg(ev.message); setStatus("error"); }

    if (ev.type === "extracted") {
      const branch = ev.branch || "Main Branch";
      const vendor = ev.vendor || "";
      setLiveStats(prev => {
        const cur = prev[branch] ?? { count: 0, minDate: null, maxDate: null, vendorNames: [] };
        return {
          ...prev,
          [branch]: {
            count: cur.count + 1,
            minDate: ev.date && (!cur.minDate || ev.date < cur.minDate) ? ev.date : cur.minDate,
            maxDate: ev.date && (!cur.maxDate || ev.date > cur.maxDate) ? ev.date : cur.maxDate,
            vendorNames: vendor && !cur.vendorNames.includes(vendor)
              ? [...cur.vendorNames, vendor].slice(0, 3)
              : cur.vendorNames,
          },
        };
      });
    } else if (ev.type === "warning") {
      setWarnCount(c => c + 1);
      setErrorLines(prev => [...prev, ev.message.replace(/^⚠\s*/, "")]);
    } else if (ev.type === "status" || ev.type === "progress") {
      setStatusMsg(ev.message);
    }
  };

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const arr = Array.from(incoming);
    if (sourceType === "zip") {
      setFiles(arr.slice(0, 1));
    } else {
      setFiles(prev => {
        const existing = new Set(prev.map(f => f.name));
        return [...prev, ...arr.filter(f => !existing.has(f.name))];
      });
    }
  };

  const canParse = () => sourceType === "drive" ? driveLink.trim().length > 0 : files.length > 0;

  const handleParse = () => {
    if (!canParse()) return;
    setStatus("parsing");
    setLiveStats({});
    setWarnCount(0);
    setErrorLines([]);
    setStatusMsg("");
    setResult(null);
    setErrorMsg("");

    const from = useDateFilter && dateFrom ? dateFrom : null;
    const to   = useDateFilter && dateTo   ? dateTo   : null;
    const clientId = user?.client_id ?? "";

    const onEvent = (ev: OnboardParseEvent) => {
      appendEvent(ev);
      if (ev.type === "done" && ev.result) { setResult(ev.result); setStatus("done"); }
      if (ev.type === "error") { setErrorMsg(ev.message); setStatus("error"); }
    };
    const onError = (err: Error) => { setErrorMsg(err.message); setStatus("error"); };

    const resumeId = sessionIdLocal;
    abortRef.current = sourceType === "drive"
      ? onboardParseStream(driveLink.trim(), clientId, from, to, onEvent, onError, resumeId)
      : onboardUploadStream(files, clientId, from, to, onEvent, onError, resumeId);
  };

  const handleAbort = () => { abortRef.current?.(); setStatus("idle"); setLiveStats({}); setWarnCount(0); setErrorLines([]); setStatusMsg(""); };

  const resetIdle = () => {
    setStatus("idle"); setFiles([]); setLiveStats({}); setWarnCount(0); setErrorLines([]); setStatusMsg(""); setResult(null);
    setSessionIdLocal(null);
  };

  const processed = Object.values(liveStats).reduce((s, b) => s + b.count, 0) + warnCount;
  const activeTab = SOURCE_TABS.find(t => t.id === sourceType)!;

  return (
    <div className="flex flex-col items-center justify-start min-h-[72vh] px-6 pt-12 max-w-[620px] mx-auto">
      {/* Interrupted import banner */}
      {resumeBanner && status === "idle" && (
        <div
          className="w-full flex items-start gap-3 rounded-xl px-4 py-3.5 mb-6"
          style={{ background: T.amberLight, border: `1px solid ${T.amberBorder}` }}
        >
          <AlertTriangle size={15} style={{ color: T.amber }} className="shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold" style={{ color: T.ink }}>
              Your last import was interrupted
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: T.muted }}>
              {resumeBanner.processed} of {resumeBanner.total} files were processed before it stopped.
              {existingSessionId ? " Re-run and we'll skip the files already done." : ""}
            </p>
          </div>
          {existingSessionId && (
            <span
              className="text-[11px] font-semibold shrink-0 px-2.5 py-1 rounded-lg"
              style={{ background: T.amber, color: "#fff" }}
            >
              Resume mode
            </span>
          )}
        </div>
      )}

      {/* Heading */}
      <div className="text-center mb-8">
        <div className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{ background: T.amberLight, border: `1px solid ${T.amberBorder}` }}>
          <FileText size={24} style={{ color: T.amber }} />
        </div>
        <h1 className="font-playfair text-[34px] font-bold leading-tight mb-2" style={{ color: T.ink }}>
          Import your order history
        </h1>
        <p className="text-[14px] leading-relaxed max-w-[460px]" style={{ color: T.muted }}>
          Share your past orders — invoices, purchase orders, PDFs, photos, scans. Claude reads them and sets up your vendors, products, and order patterns automatically.
        </p>
      </div>

      {/* Idle — source picker + inputs */}
      {status === "idle" && (
        <div className="w-full space-y-4">
          {/* Source type tabs */}
          <div className="flex rounded-xl p-1 gap-1" style={{ background: T.amberLight, border: `1px solid ${T.border}` }}>
            {SOURCE_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setSourceType(tab.id); setFiles([]); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-semibold transition-colors"
                style={{
                  background: sourceType === tab.id ? T.surface : "transparent",
                  color: sourceType === tab.id ? T.ink : T.muted,
                  boxShadow: sourceType === tab.id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Drive link input */}
          {sourceType === "drive" && (
            <>
              <div className="flex items-center gap-2 rounded-xl border px-4 py-3"
                style={{ background: T.surface, borderColor: T.border }}>
                <Link size={15} style={{ color: T.muted }} className="shrink-0" />
                <input
                  type="url"
                  placeholder="https://drive.google.com/drive/folders/…"
                  value={driveLink}
                  onChange={e => updateDriveLink(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleParse()}
                  className="flex-1 text-[13px] bg-transparent outline-none"
                  style={{ color: T.ink }}
                />
              </div>
              <p className="text-[11px] text-center" style={{ color: T.muted }}>
                Make sure the folder is shared as "Anyone with the link can view"
              </p>
            </>
          )}

          {/* File / ZIP drop zone */}
          {(sourceType === "upload" || sourceType === "zip") && (
            <>
              <div
                className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-8 gap-2 cursor-pointer transition-colors"
                style={{ borderColor: T.amberBorder, background: T.amberLight }}
                onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={20} style={{ color: T.amber }} />
                <p className="text-[13px] font-semibold" style={{ color: T.ink }}>
                  {sourceType === "zip" ? "Drop your ZIP here" : "Drop files here"}
                </p>
                <p className="text-[11px]" style={{ color: T.muted }}>
                  {sourceType === "zip"
                    ? "or click to select a .zip file"
                    : "or click to select PDFs, photos, screenshots"}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept={activeTab.accept}
                  multiple={activeTab.multiple}
                  onChange={e => handleFiles(e.target.files)}
                />
              </div>
              {files.length > 0 && (
                <div className="rounded-xl border overflow-hidden" style={{ borderColor: T.border, background: T.surface }}>
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2.5 border-b last:border-b-0"
                      style={{ borderColor: T.border }}>
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={13} style={{ color: T.muted }} className="shrink-0" />
                        <span className="text-[12px] truncate" style={{ color: T.ink }}>{f.name}</span>
                        <span className="text-[11px] shrink-0" style={{ color: T.muted }}>
                          {(f.size / 1024).toFixed(0)} KB
                        </span>
                      </div>
                      <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                        className="text-[11px] ml-3 shrink-0 hover:opacity-70" style={{ color: T.muted }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Date range filter */}
          <div className="rounded-xl border px-4 py-3.5 space-y-3"
            style={{ background: T.surface, borderColor: T.border }}>
            <button onClick={() => setUseDateFilter(v => !v)} className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Calendar size={14} style={{ color: T.muted }} />
                <span className="text-[13px] font-semibold" style={{ color: T.ink }}>Filter by date range</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full"
                  style={{ background: T.amberLight, color: T.muted, border: `1px solid ${T.border}` }}>
                  optional
                </span>
              </div>
              {/* Toggle pill */}
              <div className="h-5 w-9 rounded-full flex items-center px-0.5 transition-colors shrink-0"
                style={{ background: useDateFilter ? T.amber : T.border }}>
                <div className="h-4 w-4 rounded-full bg-white shadow transition-transform"
                  style={{ transform: useDateFilter ? "translateX(16px)" : "translateX(0)" }} />
              </div>
            </button>
            {useDateFilter && (
              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: T.muted }}>From</p>
                  <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-[13px] bg-transparent outline-none"
                    style={{ borderColor: T.border, color: T.ink }} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: T.muted }}>To</p>
                  <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-[13px] bg-transparent outline-none"
                    style={{ borderColor: T.border, color: T.ink }} />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleParse}
            disabled={!canParse()}
            className="w-full py-3 rounded-xl text-[14px] font-semibold text-white disabled:opacity-40 transition-opacity"
            style={{ background: T.amber }}
          >
            Parse invoices →
          </button>
        </div>
      )}

      {/* Progress / done */}
      {(status === "parsing" || status === "done") && (
        <div className="w-full">
          {/* Context pill — who + when */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {user?.name && (
              <span className="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-full"
                style={{ background: T.amberLight, color: T.ink, border: `1px solid ${T.amberBorder}` }}>
                <span style={{ color: T.amber }}>●</span> {user.name}
              </span>
            )}
            {useDateFilter && dateFrom && dateTo ? (
              <span className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full"
                style={{ background: T.surface, color: T.muted, border: `1px solid ${T.border}` }}>
                <Calendar size={11} />
                {new Date(dateFrom).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                {" – "}
                {new Date(dateTo).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full"
                style={{ background: T.surface, color: T.muted, border: `1px solid ${T.border}` }}>
                All invoices
              </span>
            )}
          </div>

          {/* Progress bar */}
          {status === "parsing" && (
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Loader2 size={11} style={{ color: T.muted }} className="animate-spin shrink-0" />
                <span className="text-[12px] flex-1 truncate" style={{ color: T.muted }}>{statusMsg || "Processing…"}</span>
                {processed > 0 && <span className="text-[11px] shrink-0" style={{ color: T.muted }}>{processed} done</span>}
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: T.amberLight }}>
                <div className="h-full rounded-full transition-all duration-300" style={{ background: T.amber, width: processed > 0 ? "100%" : "20%", opacity: processed > 0 ? 1 : 0.5 }} />
              </div>
            </div>
          )}

          {/* Live discovery panel */}
          <LiveDiscovery stats={liveStats} warnCount={warnCount} errorLines={errorLines} />

          {status === "done" && result && (
            <div className="rounded-xl border px-5 py-4 mb-4"
              style={{ background: T.amberLight, borderColor: T.amberBorder }}>
              <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: T.amber }}>
                Extraction complete
              </p>
              <div className="flex items-center gap-8">
                {[
                  [result.total_invoices.toString(), "invoices read"],
                  [(result.vendors?.length ?? 0).toString(), "vendors found"],
                  [(result.branches?.length ?? 0).toString(), "branches"],
                ].map(([val, lbl]) => (
                  <div key={lbl}>
                    <p className="font-playfair text-[26px] font-bold leading-none" style={{ color: T.ink }}>{val}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: T.muted }}>{lbl}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {status === "parsing" && (
              <button onClick={handleAbort}
                className="flex-1 py-2.5 rounded-xl border text-[13px] font-semibold"
                style={{ borderColor: T.border, color: T.muted }}>
                Cancel
              </button>
            )}
            {status === "done" && result && (
              <>
                <button onClick={resetIdle}
                  className="py-2.5 px-4 rounded-xl border text-[13px] font-medium"
                  style={{ borderColor: T.border, color: T.muted }}>
                  Re-import
                </button>
                <button onClick={() => onDone(result, sessionIdLocal)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[14px] font-semibold text-white"
                  style={{ background: T.amber }}>
                  Continue <ChevronRight size={15} />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="w-full">
          <div className="rounded-xl border px-4 py-3 mb-4 flex items-start gap-2"
            style={{ background: "#FEF2F2", borderColor: "#FCA5A5" }}>
            <AlertTriangle size={14} style={{ color: T.red }} className="shrink-0 mt-0.5" />
            <p className="text-[13px]" style={{ color: T.red }}>{errorMsg}</p>
          </div>
          <button onClick={() => setStatus("idle")}
            className="w-full py-2.5 rounded-xl border text-[13px] font-semibold"
            style={{ borderColor: T.border, color: T.muted }}>
            Try again
          </button>
        </div>
      )}

      {status === "idle" && (
        <button onClick={onSkip} className="mt-6 text-[12px]" style={{ color: T.muted }}>
          I don't have invoices — skip this step →
        </button>
      )}
    </div>
  );
}

// ── Step 1: Welcome ────────────────────────────────────────────────────────
function StepWelcome({ onNext, parsed }: { onNext: () => void; parsed: OnboardParseResult | null }) {
  const stats = parsed
    ? [
        [parsed.total_invoices.toString(), "invoices read"],
        [(parsed.vendors?.length ?? 0).toString(), "vendors"],
        [(parsed.branches?.length ?? 0).toString(), "branches"],
      ]
    : [["147", "POs found"], ["7", "vendors"], ["2", "branches"]];

  const subtitle = parsed
    ? `We read ${parsed.total_invoices} invoices${parsed.date_range.from ? ` from ${parsed.date_range.from} to ${parsed.date_range.to}` : ""}. Most of the setup is done — just confirm what's right.`
    : "We've read your last 30 days of WhatsApp, PDFs, and photos. Most of the setup is done — you just confirm what's right.";

  return (
    <div className="flex flex-col items-center justify-center min-h-[72vh] text-center px-6">
      <div
        className="h-16 w-16 rounded-2xl flex items-center justify-center text-white font-playfair text-[26px] font-bold mb-6"
        style={{ background: T.amber }}
      >
        F
      </div>
      <h1 className="font-playfair text-[40px] font-bold leading-tight mb-3" style={{ color: T.ink }}>
        Welcome to Farmaze
      </h1>
      <p className="text-[15px] leading-relaxed max-w-[440px] mb-2" style={{ color: T.muted }}>
        {subtitle}
      </p>
      <div className="flex items-center gap-8 my-8">
        {stats.map(([val, lbl]) => (
          <div key={lbl} className="text-center">
            <p className="font-playfair text-[32px] font-bold" style={{ color: T.ink }}>{val}</p>
            <p className="text-[12px]" style={{ color: T.muted }}>{lbl}</p>
          </div>
        ))}
      </div>
      <button
        onClick={onNext}
        className="inline-flex items-center gap-2 px-7 py-3 rounded-xl text-[14px] font-semibold text-white"
        style={{ background: T.amber }}
      >
        Let's confirm <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ── Step 2a: Your Supply ───────────────────────────────────────────────────
function StepSupply({
  onNext, onBack, branches, parsedData, onBranchRename,
}: {
  onNext: () => void;
  onBack: () => void;
  branches: BranchData[];
  parsedData: OnboardParseResult | null;
  onBranchRename?: (originalName: string, newName: string) => void;
}) {

  const totalVendors = branches.reduce((s, b) => s + b.vendors.length, 0);
  const confirmed = branches.reduce((s, b) => s + b.vendors.filter((v) => v.confirmed).length, 0);
  const needYou = totalVendors - confirmed;

  const [branchNames, setBranchNames] = useState<Record<string, string>>(
    () => Object.fromEntries(branches.map((b) => [b.id, b.name]))
  );
  const [editingBranch, setEditingBranch] = useState<string | null>(null);

  const commitBranchName = (id: string, val: string) => {
    const trimmed = val.trim();
    if (!trimmed) { setEditingBranch(null); return; }
    const originalName = branches.find((b) => b.id === id)?.name ?? id;
    setBranchNames((prev) => ({ ...prev, [id]: trimmed }));
    setEditingBranch(null);
    onBranchRename?.(originalName, trimmed);
  };

  return (
    <div className="px-8 py-8 max-w-[860px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: T.muted }}>
            Step 2 • Confirm what we found
          </p>
          <h2 className="font-playfair text-[34px] font-bold leading-tight" style={{ color: T.ink }}>
            Already{" "}
            <em className="not-italic" style={{ color: T.amber }}>set up.</em>{" "}
            Just confirm.
          </h2>
          <p className="text-[13px] mt-1.5" style={{ color: T.muted }}>
            Tap a row to edit. Two need a quick look — the rest are good to go.
          </p>
        </div>
        <div className="flex items-center gap-6 shrink-0 ml-6 mt-2">
          <div className="text-center">
            <p className="font-playfair text-[28px] font-bold" style={{ color: T.ink }}>{confirmed}</p>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: T.muted }}>Confirmed</p>
          </div>
          <div className="text-center">
            <p className="font-playfair text-[28px] font-bold" style={{ color: T.amber }}>{needYou}</p>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: T.muted }}>Need you</p>
          </div>
        </div>
      </div>

      {/* Source banner */}
      <div
        className="flex items-center justify-between rounded-xl px-5 py-3.5 mb-5"
        style={{ background: T.amberLight, border: `1px solid ${T.amberBorder}` }}
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-white text-[18px]" style={{ background: T.amber }}>
            +
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: T.amber }}>
              {parsedData ? "Here's what we extracted from your invoices" : "We read your last 30 days — here's what we found"}
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: T.ink }}>
              {parsedData ? (
                <><strong>{parsedData.total_invoices} invoices</strong> across <strong>{(parsedData.branches?.length ?? 0)} branch{(parsedData.branches?.length ?? 0) !== 1 ? "es" : ""}</strong> and <strong>{(parsedData.vendors?.length ?? 0)} vendor{(parsedData.vendors?.length ?? 0) !== 1 ? "s" : ""}</strong>. Confirm what's right, fix what's not. · no typing required</>
              ) : (
                <><strong>147 POs</strong> across <strong>2 branches</strong> and <strong>7 vendors</strong>. Confirm what's right, fix what's not. · no typing required</>
              )}
            </p>
            {parsedData?.date_range.from && (
              <p className="text-[11px] mt-0.5" style={{ color: T.muted }}>
                Date range: {parsedData.date_range.from} → {parsedData.date_range.to}
              </p>
            )}
          </div>
        </div>
        {!parsedData && (
          <div className="flex items-center gap-5 shrink-0 ml-4">
            {[["💬", "WhatsApp", "92 msgs"], ["📄", "PDFs", "38 files"], ["📷", "Photos", "17 shots"]].map(([icon, lbl, sub]) => (
              <div key={lbl} className="text-center">
                <p className="text-[12px] font-semibold" style={{ color: T.ink }}>{icon} {lbl}</p>
                <p className="text-[11px]" style={{ color: T.muted }}>{sub}</p>
              </div>
            ))}
          </div>
        )}
        {parsedData && (
          <div className="flex items-center gap-5 shrink-0 ml-4">
            <div className="text-center">
              <p className="font-playfair text-[22px] font-bold leading-none" style={{ color: T.ink }}>{parsedData.total_invoices}</p>
              <p className="text-[10px] mt-0.5 uppercase tracking-widest" style={{ color: T.muted }}>invoices</p>
            </div>
            <div className="text-center">
              <p className="font-playfair text-[22px] font-bold leading-none" style={{ color: T.ink }}>{parsedData.branches.length}</p>
              <p className="text-[10px] mt-0.5 uppercase tracking-widest" style={{ color: T.muted }}>branches</p>
            </div>
            <div className="text-center">
              <p className="font-playfair text-[22px] font-bold leading-none" style={{ color: T.ink }}>{parsedData.vendors.length}</p>
              <p className="text-[10px] mt-0.5 uppercase tracking-widest" style={{ color: T.muted }}>vendors</p>
            </div>
          </div>
        )}
      </div>

      {/* Branch sections */}
      {branches.map((branch) => (
        <div key={branch.id} className="rounded-xl overflow-hidden mb-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
          {/* Branch header */}
          <div className="flex items-center justify-between px-5 py-3" style={{ background: "hsl(37 47% 98%)", borderBottom: `1px solid ${T.border}` }}>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center text-[16px]" style={{ background: T.border }}>🍽️</div>
              <div>
                {editingBranch === branch.id ? (
                  <input
                    autoFocus
                    className="text-[14px] font-semibold rounded px-1.5 py-0.5 outline-none border"
                    style={{ color: T.ink, borderColor: T.amber, background: T.amberLight, minWidth: 180 }}
                    defaultValue={branchNames[branch.id]}
                    onBlur={(e) => commitBranchName(branch.id, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitBranchName(branch.id, e.currentTarget.value);
                      if (e.key === "Escape") setEditingBranch(null);
                    }}
                  />
                ) : (
                  <button
                    className="flex items-center gap-1.5 text-[14px] font-semibold text-left group"
                    style={{ color: T.ink }}
                    onClick={() => setEditingBranch(branch.id)}
                    title="Click to rename"
                  >
                    {branchNames[branch.id]}
                    <Edit2 size={11} style={{ color: T.muted }} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                )}
                <p className="text-[11px]" style={{ color: T.muted }}>
                  {branch.address} · {branch.covers} covers · {branch.service}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[12px]" style={{ color: T.muted }}>
                {branch.vendors.filter((v) => v.confirmed).length} of {branch.vendors.length} confirmed
              </span>
              <button className="flex items-center gap-1 text-[12px] font-medium" style={{ color: T.amber }}>
                <Plus size={12} /> Vendor we missed
              </button>
            </div>
          </div>

          {/* Column headers */}
          <div
            className="grid items-center px-5 py-2.5 text-[10px] font-semibold uppercase tracking-widest"
            style={{ gridTemplateColumns: "28px 1fr 160px 150px 150px 100px 32px", gap: "8px", color: T.muted, borderBottom: `1px solid ${T.border}` }}
          >
            <span />
            <span>Vendor</span>
            <span>Inferred from</span>
            <span>Order rhythm</span>
            <span>Catalogue</span>
            <span>Confidence</span>
            <span />
          </div>

          {/* Vendor rows */}
          {branch.vendors.map((v) => (
            <div
              key={v.id}
              className="grid items-center px-5 py-3.5 hover:bg-stone-50 cursor-pointer transition-colors"
              style={{ gridTemplateColumns: "28px 1fr 160px 150px 150px 100px 32px", gap: "8px", borderBottom: `1px solid ${T.border}` }}
            >
              <div
                className="h-5 w-5 rounded flex items-center justify-center shrink-0"
                style={{ background: v.confirmed ? T.green : T.surface, border: v.confirmed ? "none" : `2px solid ${T.border}` }}
              >
                {v.confirmed && <Check size={11} color="#fff" />}
              </div>
              <div>
                <p className="text-[13px] font-semibold" style={{ color: T.ink }}>{v.name}</p>
                <p className="text-[11px]" style={{ color: T.muted }}>{v.description}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {v.sources.map((s) => <SourcePill key={s.label} source={s} />)}
              </div>
              <div>
                <CadenceDots days={v.days} size="sm" />
                <p className="text-[10px] font-semibold mt-1" style={{ color: T.muted }}>{v.rhythmLabel}</p>
              </div>
              <div>
                <span className="text-[13px] font-semibold" style={{ color: T.ink }}>{v.catalogueCount} </span>
                <span className="text-[11px]" style={{ color: T.muted }}>items</span>
                <p className="text-[11px]" style={{ color: T.muted }}>{v.spentLabel} spent</p>
              </div>
              <ConfBar pct={v.confidence} />
              <button
                className="flex items-center justify-center w-7 h-7 rounded-lg border hover:bg-stone-50"
                style={{ borderColor: T.border, color: T.muted }}
              >
                <Edit2 size={13} />
              </button>
            </div>
          ))}
        </div>
      ))}

      <div className="flex items-center justify-between pt-2">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] font-medium" style={{ color: T.muted }}>
          <ArrowLeft size={14} /> Re-import order history
        </button>
        <div className="flex items-center gap-3">
          <span className="text-[12px]" style={{ color: T.muted }}>{needYou} vendors need a quick look</span>
          <button
            onClick={onNext}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-semibold text-white"
            style={{ background: T.amber }}
          >
            Confirm all & continue <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Step 2b: Order Rules ───────────────────────────────────────────────────
const PER_DAY_OPTS = ["Once a day", "2× a day", "3× a day", "On-demand"];
const CHANNELS = [
  { id: "WA voice", label: "WA voice", icon: <Mic size={12} /> },
  { id: "WA text", label: "WA text", icon: <MessageSquare size={12} /> },
  { id: "WA photo", label: "WA photo", icon: <Camera size={12} /> },
  { id: "Email", label: "Email", icon: <Mail size={12} /> },
  { id: "POS push", label: "POS push", icon: <ChevronRight size={12} /> },
  { id: "Phone IVR", label: "Phone IVR", icon: <Phone size={12} /> },
];
const LANGS = ["Tamil", "English", "Hindi"];

function ExpandedRuleCard({ rule }: { rule: VendorRule }) {
  const [days, setDays] = useState(rule.days);
  const [perDay, setPerDay] = useState(rule.perDay);
  const [channel, setChannel] = useState(rule.channel);
  const [lang, setLang] = useState(rule.lang || "Tamil");
  const [cutoff, setCutoff] = useState(rule.cutoff);
  const [editingCutoff, setEditingCutoff] = useState(false);

  const quickDays: [string, boolean[]][] = [
    ["Mon–Sat", [true, true, true, true, true, true, false]],
    ["All 7",   [true, true, true, true, true, true, true]],
    ["3× / week", [true, false, true, false, true, false, false]],
    ["Weekly",  [false, false, true, false, false, false, false]],
    ["Custom",  days],
  ];

  const activeQuick = quickDays.find(([, d]) => d.every((v, i) => v === days[i]))?.[0] ?? "Custom";

  return (
    <div className="rounded-xl overflow-hidden mb-3" style={{ border: `2px solid ${T.amber}`, background: T.surface }}>
      <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: `1px solid ${T.border}` }}>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[14px] font-semibold" style={{ color: T.ink }}>{rule.name}</p>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded" style={{ background: T.amberLight, color: T.amber }}>
              Needs you
            </span>
          </div>
          <p className="text-[11px]" style={{ color: T.muted }}>
            {rule.branch && <span className="font-medium">{rule.branch} · </span>}
            {rule.description}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 px-5 py-5">
        {/* Left — when */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <span className="h-5 w-5 rounded flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ background: T.amber }}>1</span>
            <span style={{ color: T.amber }}>When orders happen</span>
          </p>

          {/* Quick-select */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {quickDays.map(([label, d]) => (
              <button
                key={label}
                onClick={() => label !== "Custom" && setDays(d as boolean[])}
                className="px-3 py-1 rounded-full text-[12px] font-medium border"
                style={{
                  background: label === activeQuick ? T.ink : T.surface,
                  color: label === activeQuick ? "#fff" : T.muted,
                  borderColor: label === activeQuick ? T.ink : T.border,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Day toggles */}
          <div className="flex gap-1.5 mb-4">
            {DAY_LETTERS.map((d, i) => (
              <button
                key={i}
                onClick={() => setDays((prev) => prev.map((v, j) => (j === i ? !v : v)))}
                className="h-8 w-8 rounded-lg text-[12px] font-bold transition-colors"
                style={{
                  background: days[i] ? T.amber : T.surface,
                  color: days[i] ? "#fff" : T.muted,
                  border: `1px solid ${days[i] ? T.amber : T.border}`,
                }}
              >
                {d}
              </button>
            ))}
          </div>

          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: T.muted }}>Per active day</p>
          <div className="grid grid-cols-2 gap-1.5 mb-4">
            {PER_DAY_OPTS.map((opt) => (
              <button
                key={opt}
                onClick={() => setPerDay(opt)}
                className="px-3 py-2 rounded-lg text-[12px] font-medium text-left border transition-colors"
                style={{
                  background: perDay === opt ? T.amberLight : T.surface,
                  color: perDay === opt ? T.amber : T.muted,
                  borderColor: perDay === opt ? T.amber : T.border,
                }}
              >
                {opt}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[12px]" style={{ color: T.muted }}>Order cutoff</p>
            {editingCutoff ? (
              <input
                autoFocus
                className="text-[12px] font-medium rounded px-2 py-0.5 outline-none border w-44 text-right"
                style={{ color: T.ink, borderColor: T.amber, background: T.amberLight }}
                defaultValue={cutoff}
                onBlur={(e) => { setCutoff(e.target.value || cutoff); setEditingCutoff(false); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { setCutoff(e.currentTarget.value || cutoff); setEditingCutoff(false); }
                  if (e.key === "Escape") setEditingCutoff(false);
                }}
              />
            ) : (
              <button
                className="flex items-center gap-1.5 text-[12px] font-medium group"
                style={{ color: T.ink }}
                onClick={() => setEditingCutoff(true)}
              >
                {cutoff}
                <Edit2 size={10} style={{ color: T.muted }} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>
        </div>

        {/* Right — how */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <span className="h-5 w-5 rounded flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ background: T.amber }}>2</span>
            <span style={{ color: T.amber }}>How orders are sent</span>
          </p>

          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: T.muted }}>Primary channel</p>
          <div className="grid grid-cols-2 gap-1.5 mb-4">
            {CHANNELS.map(({ id, label, icon }) => (
              <button
                key={id}
                onClick={() => setChannel(id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-medium border transition-colors"
                style={{
                  background: channel === id ? T.amberLight : T.surface,
                  color: channel === id ? T.amber : T.muted,
                  borderColor: channel === id ? T.amber : T.border,
                }}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          {(channel === "WA voice" || channel === "WA text") && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: T.muted }}>Voice language</p>
              <div className="flex gap-1.5 mb-4">
                {LANGS.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className="px-3 py-1.5 rounded-lg text-[12px] font-medium border"
                    style={{
                      background: lang === l ? T.ink : T.surface,
                      color: lang === l ? "#fff" : T.muted,
                      borderColor: lang === l ? T.ink : T.border,
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </>
          )}

          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: T.muted }}>
            If no reply in 30 min — fallback
          </p>
          <div
            className="flex items-center justify-between px-3 py-2 rounded-lg"
            style={{ background: "hsl(37 47% 95%)", border: `1px solid ${T.border}` }}
          >
            <span className="flex items-center gap-1.5 text-[12px]" style={{ color: T.ink }}>
              <MessageSquare size={12} /> WhatsApp text
            </span>
            <button className="text-[12px] font-medium" style={{ color: T.amber }}>change</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CollapsedRuleCard({ rule }: { rule: VendorRule }) {
  return (
    <div
      className="flex items-center gap-4 rounded-xl px-5 py-3.5 mb-3"
      style={{ background: T.surface, border: `1px solid ${T.border}` }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-[13px] font-semibold" style={{ color: T.muted }}>{rule.name}</p>
          {rule.confirmed && (
            <span className="flex items-center gap-1 text-[11px]" style={{ color: T.green }}>
              <Check size={10} /> Confirmed
            </span>
          )}
        </div>
        <p className="text-[11px]" style={{ color: T.muted }}>
          {rule.branch && <span className="font-medium">{rule.branch} · </span>}
          {rule.description}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <CadenceDots days={rule.days} size="sm" />
        <span className="text-[11px]" style={{ color: T.muted }}>{rule.perDay}</span>
        <span
          className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full"
          style={{ background: T.amberLight, color: T.muted, border: `1px solid ${T.border}` }}
        >
          <MessageSquare size={9} /> {rule.channel}
        </span>
        <button
          className="text-[12px] font-medium px-2.5 py-1 rounded-lg border"
          style={{ borderColor: T.border, color: T.ink }}
        >
          Edit
        </button>
      </div>
    </div>
  );
}

function StepRules({ onNext, onBack, rules }: { onNext: () => void; onBack: () => void; rules: VendorRule[] }) {
  const needsReview = rules.filter((r) => r.needsReview);
  const confirmed = rules.filter((r) => !r.needsReview);

  return (
    <div className="px-8 py-8 max-w-[860px] mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: T.muted }}>
            Step 2b • Order rules
          </p>
          <h2 className="font-playfair text-[30px] font-bold leading-tight" style={{ color: T.ink }}>
            For each vendor:{" "}
            <em className="not-italic" style={{ color: T.amber }}>when</em>{" "}
            orders happen, and{" "}
            <em className="not-italic" style={{ color: "#D97706" }}>how</em>{" "}
            they're sent
          </h2>
          <p className="text-[13px] mt-1.5" style={{ color: T.muted }}>
            Both questions in one card per vendor. Pre-set from your message history.
          </p>
        </div>
        <div className="flex items-center gap-6 shrink-0 ml-6 mt-2">
          <div className="text-center">
            <p className="font-playfair text-[28px] font-bold" style={{ color: T.ink }}>{confirmed.length}</p>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: T.muted }}>Confirmed</p>
          </div>
          <div className="text-center">
            <p className="font-playfair text-[28px] font-bold" style={{ color: T.amber }}>{needsReview.length}</p>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: T.muted }}>Need you</p>
          </div>
        </div>
      </div>

      {/* Sub-step pills */}
      <div
        className="inline-flex items-center gap-1 rounded-xl p-1 mb-6"
        style={{ background: T.amberLight, border: `1px solid ${T.border}` }}
      >
        {[
          { label: "Supply", sub: "who & what", done: true },
          { label: "Order rules", sub: "when & how", active: true },
          { label: "Review", done: false },
        ].map(({ label, sub, done, active }) => (
          <div
            key={label}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-medium"
            style={{
              background: active ? T.surface : "transparent",
              color: active ? T.ink : done ? T.green : T.muted,
              boxShadow: active ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {done && <Check size={11} style={{ color: T.green }} />}
            {active && (
              <span className="h-4 w-4 rounded flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ background: T.amber }}>2b</span>
            )}
            <span>{label}</span>
            {sub && <span style={{ color: T.muted }}>— {sub}</span>}
          </div>
        ))}
      </div>

      {needsReview.map((r) => <ExpandedRuleCard key={r.id} rule={r} />)}
      {confirmed.length > 0 && confirmed.map((r) => <CollapsedRuleCard key={r.id} rule={r} />)}

      <div className="flex items-center justify-between pt-4">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] font-medium" style={{ color: T.muted }}>
          <ArrowLeft size={14} /> Back to supply
        </button>
        <div className="flex items-center gap-3">
          <span className="text-[12px]" style={{ color: T.muted }}>{needsReview.length} vendors still need your input</span>
          <button
            onClick={onNext}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-semibold text-white"
            style={{ background: T.amber }}
          >
            Continue to review <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Step 3: Review ─────────────────────────────────────────────────────────
function StepReview({
  onFinish, onBack, submitting, reviewVendors, parsedData,
}: {
  onFinish: () => void;
  onBack: () => void;
  submitting: boolean;
  reviewVendors: ReviewVendor[];
  parsedData: OnboardParseResult | null;
}) {
  const [expanded, setExpanded] = useState<string | null>(reviewVendors[0]?.id ?? null);

  const branchCount = parsedData ? parsedData.branches.length : 2;
  const vendorCount = parsedData ? parsedData.vendors.length : 5;
  const productCount = parsedData
    ? parsedData.vendors.reduce((s, v) => s + v.product_count, 0)
    : 101;

  return (
    <div className="px-8 py-8 max-w-[860px] mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: T.muted }}>Step 3 — Review</p>
          <h2 className="font-playfair text-[34px] font-bold" style={{ color: T.ink }}>
            Here's what we{" "}
            <em className="not-italic" style={{ color: T.amber }}>extracted</em>
          </h2>
          <p className="text-[13px] mt-1.5" style={{ color: T.muted }}>
            Click any vendor to expand and edit. Anything we couldn't pull out is flagged.
          </p>
        </div>
        <div className="flex items-center gap-6 shrink-0 ml-6 mt-2">
          {[
            [branchCount.toString(), "Branches"],
            [vendorCount.toString(), "Vendors"],
            [productCount.toString(), "Products"],
          ].map(([v, l]) => (
            <div key={l} className="text-center">
              <p className="font-playfair text-[28px] font-bold" style={{ color: T.ink }}>{v}</p>
              <p className="text-[10px] uppercase tracking-widest" style={{ color: T.muted }}>{l}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl overflow-hidden mb-6" style={{ border: `1px solid ${T.border}` }}>
        {/* Table header */}
        <div
          className="grid items-center px-5 py-3 text-[10px] font-semibold uppercase tracking-widest"
          style={{ gridTemplateColumns: "28px 1fr 90px 180px 130px 32px", gap: "12px", background: "hsl(37 47% 98%)", color: T.muted, borderBottom: `1px solid ${T.border}` }}
        >
          <span />
          <span>Vendor / Branch</span>
          <span>Items</span>
          <span>Categories</span>
          <span>Status</span>
          <span />
        </div>

        {reviewVendors.map((vendor) => (
          <div key={vendor.id}>
            <div
              className="grid items-center px-5 py-3.5 cursor-pointer hover:bg-stone-50 transition-colors"
              style={{ gridTemplateColumns: "28px 1fr 90px 180px 130px 32px", gap: "12px", borderBottom: `1px solid ${T.border}` }}
              onClick={() => setExpanded(expanded === vendor.id ? null : vendor.id)}
            >
              <span className="text-[14px]" style={{ color: T.muted }}>
                {expanded === vendor.id ? "↓" : "›"}
              </span>
              <div>
                <p className="text-[13px] font-semibold" style={{ color: T.ink }}>{vendor.name}</p>
                <p className="text-[11px]" style={{ color: T.muted }}>{vendor.branch}</p>
              </div>
              <p className="text-[13px]" style={{ color: T.ink }}>{vendor.itemCount} items</p>
              <p className="text-[12px]" style={{ color: T.muted }}>{vendor.categories}</p>
              <div>
                {vendor.status === "ready" ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: T.green }}>
                    <Check size={11} /> Ready
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: "#D97706" }}>
                    ⚠ Missing phone
                  </span>
                )}
              </div>
              <button style={{ color: T.muted }}><Edit2 size={13} /></button>
            </div>

            {expanded === vendor.id && vendor.products && (
              <div style={{ borderBottom: `1px solid ${T.border}`, background: "hsl(37 47% 98%)" }}>
                <p className="px-14 py-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: T.muted, borderBottom: `1px solid ${T.border}` }}>
                  Items extracted from last month's POS
                </p>
                <div
                  className="grid px-14 py-2 text-[10px] font-semibold uppercase tracking-widest"
                  style={{ gridTemplateColumns: "1fr 70px 90px 90px", gap: "12px", color: T.muted, borderBottom: `1px solid ${T.border}` }}
                >
                  <span>Product</span><span>Unit</span><span>Avg price</span><span>Frequency</span>
                </div>
                {vendor.products.map((p) => (
                  <div
                    key={p.name}
                    className="grid px-14 py-2.5"
                    style={{ gridTemplateColumns: "1fr 70px 90px 90px", gap: "12px", borderBottom: `1px solid ${T.border}` }}
                  >
                    <p className="text-[13px]" style={{ color: T.ink }}>{p.name}</p>
                    <p className="text-[12px]" style={{ color: T.muted }}>{p.unit}</p>
                    <p className="text-[12px] font-semibold" style={{ color: T.ink }}>₹{p.avgPrice}</p>
                    <p className="text-[12px]" style={{ color: T.muted }}>{p.freq}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[13px] font-medium" style={{ color: T.muted }}>
          <ArrowLeft size={14} /> Back
        </button>
        <button
          onClick={onFinish}
          disabled={submitting}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-60"
          style={{ background: T.amber }}
        >
          {submitting ? "Saving…" : <>Finish setup <Check size={14} /></>}
        </button>
      </div>
    </div>
  );
}

// ── Step 4: Done ───────────────────────────────────────────────────────────
function StepDone({ onGo, parsedData }: { onGo: () => void; parsedData: OnboardParseResult | null }) {
  const vendorCount = parsedData ? parsedData.vendors.length : 7;
  const branchCount = parsedData ? parsedData.branches.length : 2;

  return (
    <div className="flex flex-col items-center justify-center min-h-[72vh] text-center px-6">
      <div className="h-16 w-16 rounded-full flex items-center justify-center mb-6" style={{ background: T.green }}>
        <Check size={28} color="#fff" strokeWidth={3} />
      </div>
      <h1 className="font-playfair text-[38px] font-bold mb-2" style={{ color: T.ink }}>You're set up.</h1>
      <p className="text-[15px] max-w-[400px] leading-relaxed mb-2" style={{ color: T.muted }}>
        {vendorCount} vendor{vendorCount !== 1 ? "s" : ""} configured across {branchCount} branch{branchCount !== 1 ? "es" : ""}. Your first orders will auto-draft tonight at 10:30 PM.
      </p>
      <p className="text-[13px] mb-8" style={{ color: T.muted }}>
        You'll get a WhatsApp to confirm before anything is sent.
      </p>
      <button
        onClick={onGo}
        className="flex items-center gap-2 px-8 py-3 rounded-xl text-[14px] font-semibold text-white"
        style={{ background: T.amber }}
      >
        Go to Today <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function OnboardingSetup() {
  const navigate = useNavigate();
  const { user, branches: authBranches } = useAuth();
  const { advanceStep, markSkipped } = useOnboarding();

  const [stepKey, setStepKey] = useState<StepKey>("import");
  const [submitting, setSubmitting] = useState(false);
  const [parsedData, setParsedData] = useState<OnboardParseResult | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [savedDriveLink, setSavedDriveLink] = useState("");
  const [resumeBanner, setResumeBanner] = useState(false);
  const [importResumeBanner, setImportResumeBanner] = useState<{ processed: number; total: number } | null>(null);
  // Maps original extracted branch name → user-renamed display name
  const [branchRenames, setBranchRenames] = useState<Record<string, string>>({});

  const handleBranchRename = (originalName: string, newName: string) => {
    setBranchRenames((prev) => ({ ...prev, [originalName]: newName }));
    if (sessionId && user?.client_id) {
      renameBranchInSession(user.client_id, sessionId, originalName, newName).catch(() => {});
    }
  };

  const applyRenames = (name: string) => branchRenames[name] ?? name;

  // Derive wizard data from parsed invoices, fall back to mock when none imported
  const hasRealData = !!(parsedData && (parsedData.vendors?.length ?? 0) > 0);
  const branches = useMemo(
    () => (hasRealData ? parsedToBranchData(parsedData!) : MOCK_BRANCHES),
    [hasRealData, parsedData],
  );
  const vendorRules = useMemo(() => {
    const rules = hasRealData ? parsedToVendorRules(parsedData!) : MOCK_VENDOR_RULES;
    if (Object.keys(branchRenames).length === 0) return rules;
    return rules.map((r) => ({ ...r, branch: applyRenames(r.branch) }));
  }, [hasRealData, parsedData, branchRenames]);
  const reviewVendors = useMemo(() => {
    const vendors = hasRealData ? parsedToReviewVendors(parsedData!) : MOCK_REVIEW_VENDORS;
    if (Object.keys(branchRenames).length === 0) return vendors;
    return vendors.map((v) => ({ ...v, branch: applyRenames(v.branch) }));
  }, [hasRealData, parsedData, branchRenames]);

  // On mount: check for a previous session and resume from where admin left off
  useEffect(() => {
    const clientId = user?.client_id;
    if (!clientId) return;
    getOnboardSession(clientId)
      .then((res) => {
        const session = res.data.session;
        if (!session) return;
        setSessionId(session.id);

        const hasData = session.result && (session.result.vendors?.length ?? 0) > 0;
        if (session.status === "completed" && hasData) {
          // Import is done — restore parsed data and jump to last known step
          setParsedData(session.result!);
          const target = (session.current_step as StepKey | null) ?? "supply";
          setStepKey(target === "done" ? "review" : target === "import" ? "supply" : target as StepKey);
          setResumeBanner(true);
        } else if ((session.status === "failed" || session.status === "running") && session.processed_files > 0) {
          // Import was interrupted mid-run — show a resume prompt
          setImportResumeBanner({
            processed: session.processed_files,
            total: session.total_files,
          });
        }
      })
      .catch(() => {/* ignore — non-critical */});
  }, [user?.client_id]);

  const idx = STEP_ORDER.indexOf(stepKey);
  const pct = ((idx + 1) / STEP_ORDER.length) * 100;

  const advance = () => setStepKey(STEP_ORDER[Math.min(idx + 1, STEP_ORDER.length - 1)]);
  const retreat = () => setStepKey(STEP_ORDER[Math.max(idx - 1, 0)]);

  const home = () => navigate(user?.role === "client_admin" ? "/insights" : "/today");

  const handleSkip = () => {
    markSkipped();
    toast("You can finish setup anytime from your dashboard.");
    home();
  };

  const handleImportDone = (result: OnboardParseResult, sid: string | null) => {
    setParsedData(result);
    if (sid) setSessionId(sid);

    // Auto-map extracted branch names to DB branches using fuzzy normalization
    const normalizeName = (name: string) =>
      name.toUpperCase().replace(/\s*BRANCH\s*$/i, "").replace(/[^A-Z0-9]/g, "");

    if (authBranches.length > 0 && (result.branches?.length ?? 0) > 0 && sid && user?.client_id) {
      const mapping: Record<string, string> = {};
      for (const sessionBranch of result.branches) {
        const norm = normalizeName(sessionBranch);
        const match = authBranches.find(b => normalizeName(b.branch_name) === norm);
        if (match) mapping[sessionBranch] = match.id;
      }
      if (Object.keys(mapping).length > 0) {
        updateBranchMapping(user.client_id, sid, mapping).catch(() => {});
      }
    }

    advance();
  };

  const handleStepAdvance = (step: StepKey, event: string) => {
    const clientId = user?.client_id;
    if (clientId) {
      saveOnboardStep(clientId, step, event, sessionId).catch(() => {/* non-critical */});
    }
    advance();
  };

  const handleFinish = async () => {
    setSubmitting(true);
    try {
      await advanceStep(ONBOARDING_STEPS.COMPLETE);
      const clientId = user?.client_id;
      if (clientId) {
        saveOnboardStep(clientId, "review", "finish", sessionId).catch(() => {});
      }
      toast.success("Setup complete — welcome to Farmaze.");
    } catch {
      toast.warning("Setup saved. Some details couldn't sync — you can edit anytime.");
    } finally {
      setSubmitting(false);
    }
    advance();
  };

  return (
    <SetupShell
      step={stepKey}
      pct={pct}
      showSkip={stepKey !== "done"}
      onSkip={handleSkip}
    >
      {resumeBanner && stepKey === "supply" && (
        <div className="mx-auto max-w-[620px] px-6 pt-4">
          <div
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[12px]"
            style={{ background: "hsl(142 76% 95%)", border: "1px solid hsl(142 60% 75%)", color: "#16A34A" }}
          >
            <CheckCircle2 size={13} />
            Resumed from your previous import session — all data loaded.
            <button
              className="ml-auto text-[11px] underline"
              onClick={() => setResumeBanner(false)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      {stepKey === "import"  && (
        <StepImport
          onDone={handleImportDone}
          onSkip={advance}
          existingSessionId={sessionId}
          resumeBanner={importResumeBanner}
          initialDriveLink={savedDriveLink}
          onLinkChange={setSavedDriveLink}
        />
      )}
      {stepKey === "supply"  && <StepSupply onNext={() => handleStepAdvance("supply", "advance")} onBack={() => setStepKey("import")} branches={branches} parsedData={parsedData} onBranchRename={handleBranchRename} />}
      {stepKey === "rules"   && <StepRules onNext={() => handleStepAdvance("rules", "advance")} onBack={retreat} rules={vendorRules} />}
      {stepKey === "review"  && (
        <StepReview
          onFinish={handleFinish}
          onBack={retreat}
          submitting={submitting}
          reviewVendors={reviewVendors}
          parsedData={parsedData}
        />
      )}
      {stepKey === "done" && <StepDone onGo={home} parsedData={parsedData} />}
    </SetupShell>
  );
}
