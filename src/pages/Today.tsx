import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  AlertTriangle, ArrowRight, ChevronDown, ChevronLeft, ChevronRight,
  Clock, MessageSquare, Mic, Phone, X,
  Pencil, Minus, Plus, Trash2, RotateCcw, Search, Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getOnboardSession, type RuleOverride, type OnboardParseResult } from "@/api/agentApi";
import orderApi, { type OrderSummary } from "@/api/orderApi";
import type { Branch } from "@/api/branchApi";
import CutoffBanner from "@/components/today/CutoffBanner";

// ── Design tokens ──────────────────────────────────────────────────────────
const C = {
  bg: "hsl(37 47% 96%)",
  card: "#fff",
  border: "hsl(37 20% 88%)",
  text: "hsl(20 45% 12%)",
  muted: "hsl(20 20% 48%)",
  green: "#16A34A",
  greenDark: "#166534",
  amber: "#D97706",
  amberDark: "hsl(33 65% 38%)",
  red: "#DC2626",
  redDark: "#991B1B",
  gray: "#9CA3AF",
  cta: "hsl(33 65% 46%)",
};

type ViewMode = "swimlanes" | "exception" | "branch" | "feed";
type CellStatus = "delivered" | "variance" | "draft" | "scheduled" | "empty";

// ── Real data: useTodayData ────────────────────────────────────────────────

interface TodayData {
  branches: Branch[];
  sessionBranches: string[]; // branch names from onboarding session (match rule_override keys)
  ruleOverrides: Record<string, RuleOverride>;
  todayOrders: OrderSummary[];
  loading: boolean;
  hasSession: boolean;
}

// JS getDay() → 0=Sun, convert to rule.days index: 0=Mon…6=Sun
function dayIndexForDate(dateStr: string): number {
  const d = new Date(dateStr + "T12:00:00").getDay();
  return d === 0 ? 6 : d - 1;
}

// Parse "10:30 PM previous day" → minutes since midnight (1320)
// Previous-day cutoffs are treated as already-past for today's schedule
function cutoffMinutes(cutoff: string): number {
  const timeMatch = cutoff.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!timeMatch) return 1380;
  let h = parseInt(timeMatch[1]);
  const m = parseInt(timeMatch[2]);
  const ampm = timeMatch[3].toUpperCase();
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return h * 60 + m;
}

function nowMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

// Build rule_overrides from parsed vendors when no explicit overrides exist
function defaultRulesFromParsed(parsed: OnboardParseResult): Record<string, RuleOverride> {
  const overrides: Record<string, RuleOverride> = {};
  for (const v of parsed.vendors ?? []) {
    const vendorBranches = (v.branches ?? []).length > 0 ? v.branches! : ["Main Branch"];
    for (const branch of vendorBranches) {
      overrides[`${v.name}|${branch}`] = {
        days: [true, true, true, true, true, true, false],
        per_day: "Once a day",
        cutoff: "10:30 PM previous day",
        channel: "WA text",
      };
    }
  }
  return overrides;
}

function useTodayData(date: string): TodayData {
  const { user, branches } = useAuth();
  const [ruleOverrides, setRuleOverrides] = useState<Record<string, RuleOverride>>({});
  const [sessionBranches, setSessionBranches] = useState<string[]>([]);
  const [todayOrders, setTodayOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    if (!user?.client_id) { setLoading(false); return; }
    setLoading(true);
    const today = date;
    Promise.all([
      getOnboardSession(user.client_id).then(r => r.data.session),
      orderApi.getOrders(today, today).then(r => r.orders).catch(() => [] as OrderSummary[]),
    ]).then(([session, orders]) => {
      if (session?.result) {
        const result: typeof session.result = typeof session.result === "string"
          ? JSON.parse(session.result as unknown as string)
          : session.result;

        // Merge: defaults fill missing vendor+branch combos, explicit overrides win
        const defaults = defaultRulesFromParsed(result);
        const explicit = result.rule_overrides ?? {};
        const merged = { ...defaults, ...explicit };

        // Translate session branch names → DB branch names via branch_mapping
        const bm = (result as any).branch_mapping as Record<string, string> | undefined;
        let displayBranches = result.branches ?? [];
        let finalOverrides = merged;

        if (bm && branches.length > 0) {
          const sessionToDbName: Record<string, string> = {};
          for (const [sessionName, branchId] of Object.entries(bm)) {
            const dbBranch = branches.find(b => b.id === branchId);
            if (dbBranch) sessionToDbName[sessionName] = dbBranch.branch_name;
          }
          displayBranches = displayBranches.map(name => sessionToDbName[name] ?? name);
          // Remap rule_overrides keys from session branch names to DB branch names
          const remapped: Record<string, RuleOverride> = {};
          for (const [key, rule] of Object.entries(merged)) {
            const pipeIdx = key.indexOf("|");
            const vendor = key.slice(0, pipeIdx);
            const sessionBranch = key.slice(pipeIdx + 1);
            const dbName = sessionToDbName[sessionBranch] ?? sessionBranch;
            remapped[`${vendor}|${dbName}`] = rule;
          }
          finalOverrides = remapped;
        }

        setRuleOverrides(finalOverrides);
        setSessionBranches(displayBranches);
        setHasSession(true);
      }
      setTodayOrders(orders);
    }).catch((err) => { console.error('useTodayData error:', err); }).finally(() => setLoading(false));
  }, [user?.client_id, branches, date]);

  return { branches, sessionBranches, ruleOverrides, todayOrders, loading, hasSession };
}

// ── Swimlane row builder ───────────────────────────────────────────────────

interface RealSwimlaneRow {
  vendor: string;
  cutoff: string;
  cutoffMins: number;
  isPrevDay: boolean;
  cells: SwimlaneCell[];
}

function buildRealSwimlaneRows(
  ruleOverrides: Record<string, RuleOverride>,
  sessionBranches: string[],
  todayOrders: OrderSummary[],
  date: string,
  dbBranches: Branch[],
): RealSwimlaneRow[] {
  const todayIdx = dayIndexForDate(date);

  // Group by vendor name
  const vendorMap: Record<string, { cutoff: string; branchRules: Record<string, RuleOverride> }> = {};
  for (const [key, rule] of Object.entries(ruleOverrides)) {
    const pipeIdx = key.indexOf("|");
    const vendor = key.slice(0, pipeIdx);
    const branch = key.slice(pipeIdx + 1);
    if (!vendorMap[vendor]) vendorMap[vendor] = { cutoff: rule.cutoff, branchRules: {} };
    vendorMap[vendor].branchRules[branch] = rule;
  }

  // Normalised branch names + IDs from placed orders
  const orderedBranchNames = new Set(
    todayOrders.map(o => o.branch_name?.toUpperCase().replace(/\s+/g, "")).filter(Boolean) as string[]
  );
  const orderedBranchIds = new Set(
    todayOrders.map(o => o.branch_id).filter(Boolean) as string[]
  );

  const todayStr = new Date().toISOString().slice(0, 10);
  const isPastDate = date < todayStr;
  const now = nowMinutes();
  const rows: RealSwimlaneRow[] = Object.entries(vendorMap)
    .map(([vendor, data]) => {
      const isPrevDay = data.cutoff.toLowerCase().includes("previous day");
      const mins = cutoffMinutes(data.cutoff);
      const cells: SwimlaneCell[] = sessionBranches.map(branchName => {
        const rule = data.branchRules[branchName];
        if (!rule || !rule.days[todayIdx]) return { vendor: "", status: "empty" as const };

        // Match by name (fuzzy) OR by branch_id FK — handles null branch_name on orders
        const normalizedName = branchName.toUpperCase().replace(/\s+BRANCH$/i, "").replace(/\s+/g, "");
        const dbBranch = dbBranches.find(b => {
          const n = b.branch_name.toUpperCase().replace(/\s+/g, "");
          return n === normalizedName || n.includes(normalizedName) || normalizedName.includes(n);
        });
        const branchOrdered =
          orderedBranchNames.has(normalizedName) ||
          [...orderedBranchNames].some(n => n.includes(normalizedName) || normalizedName.includes(n)) ||
          (dbBranch != null && orderedBranchIds.has(dbBranch.id));

        let status: CellStatus;
        if (branchOrdered) {
          status = "draft";
        } else if (isPastDate || (!isPrevDay && now > mins)) {
          status = "variance";
        } else {
          status = "scheduled";
        }

        return { vendor, detail: rule.channel, status };
      });

      return { vendor, cutoff: data.cutoff, cutoffMins: mins, isPrevDay, cells };
    })
    .filter(row => row.cells.some(c => c.status !== "empty"))
    .sort((a, b) => {
      if (a.isPrevDay !== b.isPrevDay) return a.isPrevDay ? -1 : 1;
      return a.cutoffMins - b.cutoffMins;
    });

  // Also add rows for vendors with today's orders that aren't in the session
  const sessionVendorNorm = new Set(rows.map(r => r.vendor.toUpperCase().replace(/\s+/g, "")));
  const extraVendorMap: Record<string, Record<string, OrderSummary>> = {};
  for (const order of todayOrders) {
    const vendorName = order.supplier_name ?? "";
    if (!vendorName) continue;
    const norm = vendorName.toUpperCase().replace(/\s+/g, "");
    if (sessionVendorNorm.has(norm)) continue;
    if (!extraVendorMap[vendorName]) extraVendorMap[vendorName] = {};
    const branchKey = order.branch_name ?? order.branch_id ?? "Main";
    extraVendorMap[vendorName][branchKey] = order;
  }
  for (const [vendor, branchOrders] of Object.entries(extraVendorMap)) {
    const cells: SwimlaneCell[] = sessionBranches.map(branchName => {
      const normalizedName = branchName.toUpperCase().replace(/\s+BRANCH$/i, "").replace(/\s+/g, "");
      const dbBranch = dbBranches.find(b => {
        const n = b.branch_name.toUpperCase().replace(/\s+/g, "");
        return n === normalizedName || n.includes(normalizedName) || normalizedName.includes(n);
      });
      const hasOrder = Object.values(branchOrders).some(o => {
        const on = (o.branch_name ?? "").toUpperCase().replace(/\s+/g, "");
        return on === normalizedName || on.includes(normalizedName) || normalizedName.includes(on) ||
          (dbBranch != null && o.branch_id === dbBranch.id);
      });
      if (!hasOrder) return { vendor: "", status: "empty" as const };
      return { vendor, status: "draft" as const };
    });
    if (cells.some(c => c.status !== "empty")) {
      rows.push({ vendor, cutoff: "—", cutoffMins: 9999, isPrevDay: false, cells });
    }
  }

  return rows;
}

// ── Mock data ──────────────────────────────────────────────────────────────

const TODAY_DATE = "TUE · 12 NOV · 2025";

const BRANCH_NAMES = ["T. Nagar", "Nolambur", "Anna Nagar", "Velachery", "Adyar", "OMR"];

const BRANCH_SUMMARIES = [
  { name: "T. Nagar",   spend: "₹38.4k", note: "on track",             dot: "green" },
  { name: "Nolambur",   spend: "₹29.2k", note: "Anbu short tomato 4kg", dot: "red"   },
  { name: "Anna Nagar", spend: "₹22.1k", note: "on track",             dot: "green" },
  { name: "Velachery",  spend: "₹31.6k", note: "2 cutoffs in 2h",      dot: "amber" },
  { name: "Adyar",      spend: "₹17.8k", note: "on track",             dot: "green" },
  { name: "OMR",        spend: "₹24.3k", note: "Velmurugan no ack",    dot: "red"   },
];

type SwimlaneCell = { vendor: string; detail?: string; status: CellStatus };
type SwimlaneRow  = { time: string; category: string; cells: SwimlaneCell[] };

const SWIMLANE_ROWS: SwimlaneRow[] = [
  { time: "5:30 AM",  category: "Dairy AM",          cells: [{ vendor:"Senthil", detail:"24L", status:"delivered"}, {vendor:"Senthil", detail:"18L", status:"delivered"}, {vendor:"Aavin", detail:"22L", status:"delivered"}, {vendor:"Aavin", detail:"short curd", status:"variance"}, {vendor:"Senthil", detail:"14L", status:"delivered"}, {vendor:"Aavin", detail:"20L", status:"delivered"}] },
  { time: "6:15 AM",  category: "Vegetables AM",     cells: [{ vendor:"Anbu",    detail:"-tomato", status:"variance"}, {vendor:"Anbu", detail:"9 items", status:"delivered"}, {vendor:"Velmu", detail:"8 items", status:"delivered"}, {vendor:"Velmu", detail:"11 items", status:"delivered"}, {vendor:"Anbu", detail:"7 items", status:"delivered"}, {vendor:"Velmu", detail:"no ack", status:"variance"}] },
  { time: "6:30 AM",  category: "Greens AM",         cells: [{ vendor:"Lakshmi", detail:"greens", status:"delivered"}, {vendor:"Mani", detail:"greens", status:"delivered"}, {vendor:"Lakshmi", detail:"greens", status:"delivered"}, {vendor:"Mani", detail:"greens", status:"delivered"}, {vendor:"Lakshmi", detail:"greens", status:"delivered"}, {vendor:"Mani", detail:"greens", status:"delivered"}] },
  // NOW renders here
  { time: "9:00 AM",  category: "Coconut",           cells: [{ vendor:"Pollachi", status:"scheduled"}, {vendor:"Pollachi", status:"scheduled"}, {vendor:"Coco Co.", status:"scheduled"}, {vendor:"Coco Co.", status:"scheduled"}, {vendor:"Pollachi", status:"scheduled"}, {vendor:"Coco Co.", status:"scheduled"}] },
  { time: "10:30 AM", category: "Eggs",              cells: [{ vendor:"SKM Eggs", status:"scheduled"}, {vendor:"SKM Eggs", status:"scheduled"}, {vendor:"Suguna", status:"scheduled"}, {vendor:"Suguna", status:"scheduled"}, {vendor:"SKM", status:"scheduled"}, {vendor:"Suguna", status:"scheduled"}] },
  { time: "11:30 AM", category: "Bakery",            cells: [{ vendor:"Annapurna", status:"scheduled"}, {vendor:"Annapurna", status:"scheduled"}, {vendor:"", status:"empty"}, {vendor:"Annapurna", status:"scheduled"}, {vendor:"", status:"empty"}, {vendor:"Annapurna", status:"scheduled"}] },
  { time: "2:00 PM",  category: "Dairy PM",          cells: [{ vendor:"Senthil", detail:"draft", status:"draft"}, {vendor:"Senthil", detail:"draft", status:"draft"}, {vendor:"Aavin", detail:"draft", status:"draft"}, {vendor:"Aavin", detail:"draft", status:"draft"}, {vendor:"Senthil", detail:"draft", status:"draft"}, {vendor:"Aavin", detail:"draft", status:"draft"}] },
  { time: "4:00 PM",  category: "Spices/Oil",        cells: [{ vendor:"Adyar Anand", status:"scheduled"}, {vendor:"", status:"empty"}, {vendor:"", status:"empty"}, {vendor:"Anand", status:"scheduled"}, {vendor:"", status:"empty"}, {vendor:"", status:"empty"}] },
  { time: "6:00 PM",  category: "Dairy delivery",    cells: [{ vendor:"arrival", status:"scheduled"}, {vendor:"arrival", status:"scheduled"}, {vendor:"arrival", status:"scheduled"}, {vendor:"arrival", status:"scheduled"}, {vendor:"arrival", status:"scheduled"}, {vendor:"arrival", status:"scheduled"}] },
  { time: "10:30 PM", category: "Cutoff (tomorrow)", cells: [{ vendor:"3 drafts", status:"draft"}, {vendor:"3 drafts", status:"draft"}, {vendor:"2 drafts", status:"draft"}, {vendor:"4 drafts", status:"draft"}, {vendor:"2 drafts", status:"draft"}, {vendor:"3 drafts", status:"draft"}] },
];

const BRANCH_TOTALS = [
  { d:2, v:1, p:1, a:4 }, { d:3, v:0, p:1, a:5 }, { d:3, v:0, p:1, a:3 },
  { d:2, v:1, p:2, a:5 }, { d:3, v:0, p:1, a:3 }, { d:2, v:1, p:1, a:4 },
];

// ── Cell order detail types + data ─────────────────────────────────────────

type LineItem = {
  name: string; unit: string;
  ordered: number; delivered?: number;
  pricePerUnit: number;
};

type CellDetail = {
  vendor: string; branch: string; time: string; category: string;
  status: CellStatus;
  channel: "wa-text" | "wa-voice" | "phone";
  lang?: string;
  sentAt?: string; deliveredAt?: string;
  items: LineItem[];
  note?: string;
};

type EditableItem = LineItem & { editQty: number; removed: boolean; isNew: boolean };

// Stub product catalogue for the add-item search (replace with recommendationsApi call)
const MOCK_PRODUCTS: Array<{ name: string; unit: string; price: number }> = [
  { name: "Tomato (Bangalore)", unit: "kg",  price: 35  },
  { name: "Onion (medium)",     unit: "kg",  price: 42  },
  { name: "Potato",             unit: "kg",  price: 32  },
  { name: "Carrot",             unit: "kg",  price: 55  },
  { name: "Milk (full cream)",  unit: "L",   price: 60  },
  { name: "Curd",               unit: "kg",  price: 80  },
  { name: "Paneer",             unit: "kg",  price: 380 },
  { name: "Ghee",               unit: "kg",  price: 520 },
  { name: "Eggs",               unit: "nos", price: 8   },
  { name: "Spinach",            unit: "kg",  price: 55  },
  { name: "Coriander leaves",   unit: "kg",  price: 60  },
  { name: "Curry leaves",       unit: "kg",  price: 120 },
  { name: "Green chilli",       unit: "kg",  price: 160 },
  { name: "Ginger",             unit: "kg",  price: 90  },
  { name: "Garlic",             unit: "kg",  price: 140 },
];

// Key = `${rowTime}:${branchIdx}`
const CELL_DETAILS: Record<string, CellDetail> = {
  "5:30 AM:0": { vendor:"Senthil Dairy", branch:"T. Nagar", time:"5:30 AM", category:"Dairy AM", status:"delivered", channel:"wa-text", sentAt:"5:18 AM", deliveredAt:"5:31 AM",
    items:[{name:"Milk (full cream)", unit:"L",  ordered:24, delivered:24, pricePerUnit:60},{name:"Curd",           unit:"kg", ordered:8,  delivered:8,  pricePerUnit:80},{name:"Ghee",            unit:"kg", ordered:1,  delivered:1,  pricePerUnit:520}] },
  "5:30 AM:1": { vendor:"Senthil Dairy", branch:"Nolambur", time:"5:30 AM", category:"Dairy AM", status:"delivered", channel:"wa-text", sentAt:"5:18 AM", deliveredAt:"5:33 AM",
    items:[{name:"Milk (full cream)", unit:"L",  ordered:18, delivered:18, pricePerUnit:60},{name:"Curd",           unit:"kg", ordered:5,  delivered:5,  pricePerUnit:80}] },
  "5:30 AM:3": { vendor:"Aavin Dairy", branch:"Velachery", time:"5:30 AM", category:"Dairy AM", status:"variance", channel:"wa-text", sentAt:"5:20 AM", deliveredAt:"5:35 AM",
    note:"Curd short 3kg — driver said factory batch issue. Sent half pack instead.",
    items:[{name:"Milk (toned)",      unit:"L",  ordered:22, delivered:22, pricePerUnit:55},{name:"Curd",           unit:"kg", ordered:8,  delivered:5,  pricePerUnit:78},{name:"Buttermilk",      unit:"L",  ordered:5,  delivered:5,  pricePerUnit:30}] },
  "6:15 AM:0": { vendor:"Anbu Fresh Vegetables", branch:"T. Nagar", time:"6:15 AM", category:"Vegetables AM", status:"variance", channel:"wa-voice", lang:"ta", sentAt:"5:45 AM", deliveredAt:"6:18 AM",
    note:"Short 4kg tomato — driver replaced with hybrid variety at ₹38/kg. Confirm substitute?",
    items:[{name:"Tomato (Bangalore)", unit:"kg", ordered:5, delivered:1, pricePerUnit:35},{name:"Onion (medium)",   unit:"kg", ordered:8, delivered:8, pricePerUnit:42},{name:"Curry leaves",      unit:"kg", ordered:1, delivered:1, pricePerUnit:120},{name:"Green chilli",      unit:"kg", ordered:0.5, delivered:0.5, pricePerUnit:160},{name:"Coriander",         unit:"kg", ordered:2, delivered:2, pricePerUnit:60},{name:"Ginger",            unit:"kg", ordered:1, delivered:1, pricePerUnit:90},{name:"Garlic",            unit:"kg", ordered:1, delivered:1, pricePerUnit:140},{name:"Capsicum",          unit:"kg", ordered:2, delivered:2, pricePerUnit:80},{name:"Brinjal",           unit:"kg", ordered:3, delivered:3, pricePerUnit:45}] },
  "6:15 AM:1": { vendor:"Anbu Fresh Vegetables", branch:"Nolambur", time:"6:15 AM", category:"Vegetables AM", status:"delivered", channel:"wa-voice", lang:"ta", sentAt:"5:45 AM", deliveredAt:"6:20 AM",
    items:[{name:"Tomato (Bangalore)", unit:"kg", ordered:4, delivered:4, pricePerUnit:35},{name:"Onion (medium)",   unit:"kg", ordered:6, delivered:6, pricePerUnit:42},{name:"Curry leaves",      unit:"kg", ordered:0.5, delivered:0.5, pricePerUnit:120},{name:"Green chilli",      unit:"kg", ordered:0.5, delivered:0.5, pricePerUnit:160},{name:"Coriander",         unit:"kg", ordered:1, delivered:1, pricePerUnit:60},{name:"Ginger",            unit:"kg", ordered:0.5, delivered:0.5, pricePerUnit:90},{name:"Garlic",            unit:"kg", ordered:0.5, delivered:0.5, pricePerUnit:140},{name:"Potato",            unit:"kg", ordered:5, delivered:5, pricePerUnit:32},{name:"Carrot",            unit:"kg", ordered:2, delivered:2, pricePerUnit:55}] },
  "6:15 AM:5": { vendor:"Velmurugan Vegetables", branch:"OMR", time:"6:15 AM", category:"Vegetables AM", status:"variance", channel:"wa-text", sentAt:"5:50 AM",
    note:"No acknowledgement from Velmurugan 10h after dispatch. WhatsApp delivered but unread.",
    items:[{name:"Tomato",    unit:"kg", ordered:3,   delivered:undefined, pricePerUnit:35},{name:"Onion",     unit:"kg", ordered:5,   delivered:undefined, pricePerUnit:42},{name:"Beetroot",  unit:"kg", ordered:2,   delivered:undefined, pricePerUnit:48},{name:"Drumstick", unit:"nos",ordered:20,  delivered:undefined, pricePerUnit:8},{name:"Spinach",   unit:"kg", ordered:3,   delivered:undefined, pricePerUnit:55},{name:"Beans",     unit:"kg", ordered:2,   delivered:undefined, pricePerUnit:90}] },
  "6:30 AM:0": { vendor:"Lakshmi Greens", branch:"T. Nagar", time:"6:30 AM", category:"Greens AM", status:"delivered", channel:"wa-voice", lang:"ta", sentAt:"5:50 AM", deliveredAt:"6:32 AM",
    items:[{name:"Spinach",          unit:"kg", ordered:6, delivered:6, pricePerUnit:55},{name:"Coriander leaves", unit:"kg", ordered:2, delivered:2, pricePerUnit:60},{name:"Curry leaves",      unit:"kg", ordered:1, delivered:1, pricePerUnit:120}] },
  "2:00 PM:0": { vendor:"Senthil Dairy", branch:"T. Nagar", time:"2:00 PM", category:"Dairy PM", status:"draft", channel:"wa-text",
    note:"Auto-draft based on yesterday PM order. Review before 2:00 PM cutoff.",
    items:[{name:"Milk (full cream)", unit:"L",  ordered:8,  pricePerUnit:60},{name:"Curd",           unit:"kg", ordered:3,  pricePerUnit:80},{name:"Paneer",          unit:"kg", ordered:1,  pricePerUnit:380}] },
  "2:00 PM:2": { vendor:"Aavin Dairy", branch:"Anna Nagar", time:"2:00 PM", category:"Dairy PM", status:"draft", channel:"wa-text",
    note:"Auto-draft. Curd usage +35% this week — consider bumping to 5kg.",
    items:[{name:"Milk (toned)",  unit:"L",  ordered:10, pricePerUnit:55},{name:"Curd",         unit:"kg", ordered:4,  pricePerUnit:78},{name:"Buttermilk",  unit:"L",  ordered:8,  pricePerUnit:30}] },
};

type ExceptionItem = {
  id: string; branches: string; timeLabel: string;
  tag: string; tagColor: string;
  title: string; detail: string; meta?: string;
  cta: string; ctaSecondary: string;
};

const EXCEPTIONS: ExceptionItem[] = [
  { id:"1", branches:"3 branches", timeLabel:"in 1h 12m",        tag:"ORDER DEADLINE", tagColor:C.amber,   title:"3 drafts pending review · 1 has +18% tomato vs avg · Anbu Fresh",            detail:"Velachery, OMR, T. Nagar · 10:30 PM cutoff for tomorrow's delivery", meta:"Total ₹12,400   Variance: 1 of 3", cta:"Review 3 drafts →", ctaSecondary:"Send all as drafted" },
  { id:"2", branches:"NOLAMBUR",   timeLabel:"6:15 AM",           tag:"VARIANCE",    tagColor:C.red,     title:"Tomato short 4kg · driver substituted hybrid variety · Anbu Fresh Vegetables", detail:"Anbu's WhatsApp: 'Sir local tomato sold out, hybrid 5kg replaced. Confirm?'",                        cta:"Open & decide →",   ctaSecondary:"Accept sub · ₹38/kg" },
  { id:"3", branches:"OMR",        timeLabel:"9:43 PM yesterday", tag:"NO ACK",      tagColor:C.redDark, title:"No acknowledgement · 10h after dispatch · Velmurugan Vegetables",            detail:"Sent WhatsApp text at 9:43 PM. No delivered marker on Velmurugan's number.",                         cta:"Resend via voice →", ctaSecondary:"Call Velmurugan" },
  { id:"4", branches:"VELACHERY",  timeLabel:"in 4h 18m",         tag:"ORDER DEADLINE", tagColor:C.amber,   title:"PM top-up cutoff · curd usage spiked +35% this week · Aavin Dairy",         detail:"Auto-draft used 4-week avg. Likely needs manual bump for this week's catering booking.",              cta:"Review draft →",    ctaSecondary:"Use 1-week avg instead" },
];

const HEALTH_BRANCHES = [
  { name:"T. Nagar", ok:true }, { name:"Nolambur", ok:false },
  { name:"Anna Nagar", ok:true }, { name:"Velachery", ok:true },
  { name:"Adyar", ok:true }, { name:"OMR", ok:true },
];

const OTHER_BRANCHES = [
  { name:"Nolambur",   note:"Anbu short tomato 4kg", alert:true  },
  { name:"Anna Nagar", note:"on track",              alert:false },
  { name:"Velachery",  note:"2 cutoffs in 2h",       alert:true  },
  { name:"Adyar",      note:"on track",              alert:false },
  { name:"OMR",        note:"Velmurugan no ack",     alert:true  },
];

type TEvent = {
  id: string; time: string; subLabel?: string; vendor: string;
  channel: "wa-text" | "wa-voice" | "phone" | null; lang?: string;
  items: string; amount?: number;
  status: "delivered" | "variance" | "scheduled" | "pending";
  note?: string;
};

const TIMELINE: TEvent[] = [
  { id:"1",  time:"5:30 AM",  vendor:"Senthil Dairy",          channel:"wa-text",  items:"Milk 24L · Curd 8kg · Ghee 1kg",                          amount:3400, status:"delivered" },
  { id:"2",  time:"6:15 AM",  vendor:"Anbu Fresh Vegetables",  channel:"wa-voice", lang:"ta", items:"Tomato · onion · curry leaves · 9 items",        amount:4200, status:"variance",  note:"Short 4kg tomato — driver replaced with hybrid" },
  { id:"3",  time:"6:30 AM",  vendor:"Lakshmi Greens",         channel:"wa-voice", lang:"ta", items:"Spinach 6kg · coriander 2kg · curry leaves 1kg", amount:980,  status:"delivered" },
  { id:"4",  time:"7:00 AM",  vendor:"Adyar Anand Spices",     channel:"wa-text",  items:"Sambar pwd 2kg · rasam pwd 1kg · turmeric 500g",           amount:2180, status:"delivered" },
  { id:"5",  time:"9:00 AM",  subLabel:"placing in 1h 18m",    vendor:"Pollachi Coconut Co.", channel:"phone",    items:"Coconut 40 nos · tender coconut 12 · copra 5kg", amount:2200, status:"scheduled" },
  { id:"6",  time:"10:30 AM", vendor:"SKM Eggs",                channel:"wa-text",  items:"Eggs · 6 trays (180 nos)",                                amount:1440, status:"scheduled" },
  { id:"7",  time:"11:30 AM", vendor:"Annapurna Bakery",        channel:"phone",    items:"Bread loaves 8 · buns 24 · rusk 2kg",                     amount:820,  status:"scheduled" },
  { id:"8",  time:"2:00 PM",  subLabel:"cutoff at 2:00 PM",    vendor:"Senthil Dairy · PM",  channel:"wa-text",  items:"Top-up dairy — auto-draft from yesterday PM avg",  amount:1280, status:"pending" },
  { id:"9",  time:"4:00 PM",  vendor:"Cauvery Oils",            channel:"wa-text",  items:"Sunflower oil 15L · ghee 2kg",                            amount:2600, status:"scheduled" },
  { id:"10", time:"10:30 PM", subLabel:"cutoff at 10:30 PM",   vendor:"Anbu cutoff · tomorrow", channel:"wa-voice", lang:"ta", items:"3 drafts ready · 1 has +18% tomato vs avg", amount:4400, status:"pending" },
];
const NOW_AFTER = "4";

// ── Shared components ──────────────────────────────────────────────────────

function ViewToggle({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  const opts: { id: ViewMode; label: string }[] = [
    { id: "swimlanes", label: "Swimlanes" },
    { id: "exception", label: "Needs action" },
    { id: "branch",    label: "Branch view" },
    { id: "feed",      label: "Feed" },
  ];
  return (
    <div className="flex rounded-lg overflow-hidden border text-[12px] shrink-0" style={{ borderColor: C.border }}>
      {opts.map((o, i) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={cn("px-3 py-1.5 font-medium transition-colors whitespace-nowrap", i > 0 && "border-l")}
          style={{
            borderColor: C.border,
            background: view === o.id ? C.cta : C.card,
            color: view === o.id ? "#fff" : C.muted,
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function StatusChip({ status }: { status: TEvent["status"] }) {
  const map = {
    delivered: { label: "DELIVERED", bg: "#DCFCE7", color: C.green },
    variance:  { label: "VARIANCE",  bg: "#FEE2E2", color: C.red   },
    scheduled: { label: "SCHEDULED", bg: "hsl(37 47% 93%)", color: C.muted },
    pending:   { label: "PENDING",   bg: "#FEF3C7", color: C.amber  },
  };
  const s = map[status];
  return (
    <span className="rounded-md px-2.5 py-0.5 text-[10px] font-bold tracking-wide whitespace-nowrap" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function ChannelPill({ channel, lang }: { channel: TEvent["channel"]; lang?: string }) {
  if (!channel) return null;
  const icon = channel === "wa-voice" ? <Mic size={9} /> : channel === "phone" ? <Phone size={9} /> : <MessageSquare size={9} />;
  const label = channel === "wa-text" ? "WA text" : channel === "wa-voice" ? `WA voice${lang ? ` · ${lang}` : ""}` : "Phone call";
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: "hsl(37 47% 93%)", color: C.muted, border: `1px solid ${C.border}` }}>
      {icon} {label}
    </span>
  );
}

// ── Live order drawer (real DB orders) ────────────────────────────────────

interface GRNLineItem {
  id: string;
  productId: string;
  orderItemId: string;
  name: string;
  unit: string;
  ordered: number;
  received: number;
  note: string;
}

type DrawerMode = "view" | "grn" | "grn-success";

function LiveOrderDrawer({ order, vendorDisplayName, onClose, onNavigate }: {
  order: OrderSummary;
  vendorDisplayName: string;
  onClose: () => void;
  onNavigate: (path: string) => void;
}) {
  const [mode, setMode] = useState<DrawerMode>("view");
  const [grnItems, setGrnItems] = useState<GRNLineItem[]>([]);
  const [generalNote, setGeneralNote] = useState("");
  const [loadingItems, setLoadingItems] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [shortCount, setShortCount] = useState(0);

  const vendorName = order.supplier_name || vendorDisplayName;
  const statusColor = order.status === "order_placed" ? C.green : C.amber;
  const statusLabel = (order.status ?? "").replace(/_/g, " ").toUpperCase();
  const placedDate = order.placed_at || order.created_at;

  const enterGRN = async () => {
    setLoadingItems(true);
    setMode("grn");
    try {
      const items = await orderApi.getOrderItems(order.order_id, undefined, true);
      setGrnItems(items.map(p => ({
        id: p.id || String(Math.random()),
        productId: p.product_id,
        orderItemId: p.id,
        name: p.product_name,
        unit: p.unit || "kg",
        ordered: p.quantity,
        received: p.quantity,
        note: "",
      })));
    } catch {
      setMode("view");
    } finally {
      setLoadingItems(false);
    }
  };

  const updateReceived = (id: string, delta: number) =>
    setGrnItems(prev => prev.map(it => {
      if (it.id !== id) return it;
      return { ...it, received: Math.max(0, it.received + delta) };
    }));

  const setDirectQty = (id: string, val: string) =>
    setGrnItems(prev => prev.map(it =>
      it.id !== id ? it : { ...it, received: Math.max(0, parseInt(val) || 0) }
    ));

  const updateNote = (id: string, note: string) =>
    setGrnItems(prev => prev.map(it => it.id !== id ? it : { ...it, note }));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await orderApi.recordGRN(order.order_id, {
        general_note: generalNote,
        items: grnItems.map(it => ({
          order_item_id: it.orderItemId,
          product_id: it.productId,
          product_name: it.name,
          unit: it.unit,
          ordered_qty: it.ordered,
          received_qty: it.received,
          note: it.note,
        })),
      });
      setShortCount(grnItems.filter(i => i.received < i.ordered).length);
      setMode("grn-success");
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        alert("Delivery already recorded for this order");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const totalShort = grnItems.filter(i => i.received < i.ordered).length;
  const allExact = grnItems.length > 0 && totalShort === 0;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={mode === "view" ? onClose : undefined} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-[460px] shadow-2xl flex flex-col overflow-hidden" style={{ background: C.bg }}>

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b shrink-0" style={{ background: C.card, borderColor: C.border }}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[15px] font-bold truncate" style={{ color: C.text }}>{vendorName}</span>
              <ArrowRight size={13} style={{ color: C.muted }} />
              <span className="text-[14px] font-medium truncate" style={{ color: C.muted }}>{order.branch_name ?? "—"}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              {mode === "view" && (
                <span className="rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide" style={{ background: order.status === "order_placed" ? "#DCFCE7" : "#FEF3C7", color: statusColor }}>
                  {statusLabel}
                </span>
              )}
              {mode === "grn" && (
                <span className="rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide" style={{ background: "#EFF6FF", color: "#1D4ED8" }}>
                  RECORDING DELIVERY
                </span>
              )}
              {mode === "grn-success" && (
                <span className="rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide" style={{ background: "#DCFCE7", color: C.green }}>
                  DELIVERY RECORDED
                </span>
              )}
              {order.order_number && (
                <span className="text-[11px]" style={{ color: C.muted }}>#{order.order_number}</span>
              )}
            </div>
          </div>
          <button
            onClick={mode === "grn" ? () => setMode("view") : onClose}
            className="p-1.5 rounded-lg hover:bg-stone-100 ml-3 shrink-0"
          >
            <X size={16} style={{ color: C.muted }} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── View mode ── */}
          {mode === "view" && (
            <div className="px-6 py-5 space-y-3 text-[13px]" style={{ color: C.text }}>
              {order.total_amount != null && (
                <div className="flex justify-between border-b pb-3" style={{ borderColor: C.border }}>
                  <span style={{ color: C.muted }}>Order total</span>
                  <span className="font-semibold">₹{Number(order.total_amount).toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span style={{ color: C.muted }}>Placed</span>
                <span>{placedDate ? new Date(placedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</span>
              </div>
            </div>
          )}

          {/* ── GRN mode ── */}
          {mode === "grn" && (
            <div className="px-5 py-4">
              {loadingItems ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={20} className="animate-spin" style={{ color: C.muted }} />
                </div>
              ) : (
                <>
                  {/* Variance banner */}
                  <div className="mb-3 rounded-lg px-3 py-2 text-[12px] font-medium flex items-center justify-between"
                    style={{ background: allExact ? "#DCFCE7" : totalShort > 0 ? "#FEF3C7" : "#DCFCE7", color: allExact ? C.green : C.amber }}>
                    <span>{allExact ? `All ${grnItems.length} items accounted for` : `${totalShort} of ${grnItems.length} items short — flag reason below`}</span>
                    <span style={{ color: C.muted }}>{grnItems.length - totalShort}/{grnItems.length} ✓</span>
                  </div>

                  {/* Item rows — compact table style */}
                  <div className="rounded-xl overflow-hidden border" style={{ borderColor: C.border }}>
                    {grnItems.map((item, idx) => {
                      const diff = item.received - item.ordered;
                      const isShort = diff < 0;
                      const isOver = diff > 0;
                      const statusBg = isShort ? "#FEE2E2" : isOver ? "#FEF3C7" : "#DCFCE7";
                      const statusCol = isShort ? C.red : isOver ? C.amber : C.green;
                      const statusTxt = isShort ? `Short ${Math.abs(diff)}${item.unit}` : isOver ? `+${diff}${item.unit}` : "Exact ✓";
                      return (
                        <div key={item.id} className={cn("px-4 py-3", idx > 0 && "border-t")} style={{ borderColor: C.border, background: C.card }}>
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium truncate" style={{ color: C.text }}>{item.name}</p>
                              <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>Ordered: {item.ordered} {item.unit}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: statusBg, color: statusCol }}>{statusTxt}</span>
                              <button onClick={() => updateReceived(item.id, -1)} className="h-7 w-7 rounded-md border flex items-center justify-center text-base font-light" style={{ borderColor: C.border, color: C.text }}>−</button>
                              <input
                                type="number"
                                value={item.received}
                                onChange={e => setDirectQty(item.id, e.target.value)}
                                className="w-12 text-center text-[13px] font-semibold rounded-md border outline-none"
                                style={{ borderColor: C.border, color: C.text, background: C.bg }}
                              />
                              <button onClick={() => updateReceived(item.id, 1)} className="h-7 w-7 rounded-md border flex items-center justify-center text-base font-light" style={{ borderColor: C.border, color: C.text }}>+</button>
                            </div>
                          </div>
                          {(isShort || isOver || item.note) && (
                            <input
                              type="text"
                              value={item.note}
                              onChange={e => updateNote(item.id, e.target.value)}
                              placeholder={isShort ? "Reason for short supply..." : "Note (optional)"}
                              className="mt-2 w-full text-[11px] rounded-lg px-3 py-1.5 outline-none"
                              style={{ background: isShort ? "#FEE2E2" : "#FEF3C7", border: `1px solid ${isShort ? "#FECACA" : "#FDE68A"}`, color: C.text }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* General note */}
                  <textarea
                    value={generalNote}
                    onChange={e => setGeneralNote(e.target.value)}
                    placeholder="Overall delivery note (optional)..."
                    rows={2}
                    className="mt-3 w-full text-[12px] rounded-xl px-4 py-3 outline-none resize-none"
                    style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text }}
                  />
                </>
              )}
            </div>
          )}

          {/* ── Success mode ── */}
          {mode === "grn-success" && (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
              <div className="h-14 w-14 rounded-full flex items-center justify-center" style={{ background: "#DCFCE7" }}>
                <span style={{ color: C.green, fontSize: 28 }}>✓</span>
              </div>
              <div>
                <p className="text-[17px] font-bold" style={{ color: C.text }}>Delivery recorded</p>
                <p className="text-[13px] mt-1" style={{ color: C.muted }}>
                  #{order.order_number}{shortCount > 0 ? ` · ${shortCount} short item${shortCount > 1 ? "s" : ""} flagged` : ""}
                </p>
              </div>
              {shortCount > 0 && (
                <button onClick={() => onNavigate("/variance")} className="rounded-lg px-4 py-2 text-[12px] font-semibold text-white" style={{ background: C.red }}>
                  View short supply →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t shrink-0 flex flex-col gap-2" style={{ borderColor: C.border, background: C.card }}>
          {mode === "view" && (
            <>
              <button onClick={enterGRN} className="w-full rounded-lg py-2.5 text-[13px] font-semibold text-white" style={{ background: C.cta }}>
                Record delivery (GRN)
              </button>
              <button onClick={() => onNavigate(`/order/${order.order_id}`)} className="w-full rounded-lg py-2.5 text-[13px] font-medium border" style={{ borderColor: C.border, color: C.muted, background: C.card }}>
                View full order
              </button>
            </>
          )}
          {mode === "grn" && !loadingItems && (
            <>
              <button onClick={handleSubmit} disabled={submitting} className="w-full rounded-lg py-2.5 text-[13px] font-semibold text-white disabled:opacity-60" style={{ background: C.cta }}>
                {submitting ? "Saving..." : `Confirm delivery · ${grnItems.length} items`}
              </button>
              {totalShort > 0 && (
                <p className="text-center text-[11px]" style={{ color: C.amber }}>{totalShort} short item{totalShort > 1 ? "s" : ""} will be flagged for follow-up</p>
              )}
            </>
          )}
          {mode === "grn-success" && (
            <button onClick={onClose} className="w-full rounded-lg py-2.5 text-[13px] font-medium border" style={{ borderColor: C.border, color: C.muted, background: C.card }}>
              Close
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ── Order detail panel ─────────────────────────────────────────────────────

type PanelMode = "view" | "edit-order" | "record-delivery";

function OrderDetailPanel({ detail, onClose }: { detail: CellDetail; onClose: () => void }) {
  const [mode, setMode] = useState<PanelMode>("view");

  // ── Edit-order state (draft / scheduled) ──────────────────────────────────
  const [editItems, setEditItems]   = useState<EditableItem[]>([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [addSearch, setAddSearch]   = useState("");
  const [addQty, setAddQty]         = useState(1);
  const [addSelected, setAddSelected] = useState<typeof MOCK_PRODUCTS[0] | null>(null);
  const [isSaving, setIsSaving]     = useState(false);

  // ── Record-delivery state (delivered / variance) ───────────────────────────
  const [recItems, setRecItems]     = useState<Array<{ name: string; unit: string; ordered: number; recorded: number; shortReason: string }>>([]);
  const [recNote, setRecNote]       = useState(detail.note ?? "");
  const [isRecording, setIsRecording] = useState(false);

  const statusColors: Record<CellStatus, { bg: string; color: string; label: string }> = {
    delivered: { bg: "#DCFCE7", color: C.green,              label: "DELIVERED" },
    variance:  { bg: "#FEE2E2", color: C.red,                label: "VARIANCE"  },
    draft:     { bg: "#FEF3C7", color: C.amber,              label: "DRAFT"     },
    scheduled: { bg: "hsl(37 47% 93%)", color: C.muted,      label: "SCHEDULED" },
    empty:     { bg: "transparent",     color: C.muted,       label: ""          },
  };
  const sc = statusColors[detail.status];
  const channelLabel = detail.channel === "wa-text" ? "WA text"
    : detail.channel === "wa-voice" ? `WA voice${detail.lang ? ` · ${detail.lang}` : ""}` : "Phone call";

  // Enter edit-order mode
  const enterEditOrder = () => {
    setEditItems(detail.items.map(item => ({
      ...item, editQty: item.ordered, removed: false, isNew: false,
    })));
    setShowAddItem(false);
    setAddSearch("");
    setAddSelected(null);
    setAddQty(1);
    setMode("edit-order");
  };

  // Enter record-delivery mode
  const enterRecordDelivery = () => {
    setRecItems(detail.items.map(item => ({
      name: item.name, unit: item.unit,
      ordered: item.ordered,
      recorded: item.delivered ?? item.ordered,
      shortReason: "",
    })));
    setRecNote(detail.note ?? "");
    setMode("record-delivery");
  };

  const cancelMode = () => {
    setMode("view");
    setShowAddItem(false);
    setAddSearch("");
    setAddSelected(null);
  };

  // ── Edit-order helpers ─────────────────────────────────────────────────────
  const updateEditQty = (idx: number, delta: number) =>
    setEditItems(prev => prev.map((it, i) => {
      if (i !== idx) return it;
      const q = Math.max(0, it.editQty + delta);
      return { ...it, editQty: q, removed: q === 0 };
    }));

  const setEditQtyDirect = (idx: number, val: string) => {
    const q = Math.max(0, parseInt(val) || 0);
    setEditItems(prev => prev.map((it, i) =>
      i === idx ? { ...it, editQty: q, removed: q === 0 } : it
    ));
  };

  const removeEditItem = (idx: number) =>
    setEditItems(prev => prev.map((it, i) =>
      i === idx ? { ...it, removed: true, editQty: 0 } : it
    ));

  const restoreEditItem = (idx: number) =>
    setEditItems(prev => prev.map((it, i) =>
      i === idx ? { ...it, removed: false, editQty: it.ordered } : it
    ));

  const addSearchResults = MOCK_PRODUCTS.filter(
    p => p.name.toLowerCase().includes(addSearch.toLowerCase()) &&
         !editItems.some(it => it.name === p.name && !it.removed)
  );

  const confirmAddItem = () => {
    if (!addSelected) return;
    setEditItems(prev => [...prev, {
      name: addSelected.name, unit: addSelected.unit,
      ordered: addQty, pricePerUnit: addSelected.price,
      delivered: undefined,
      editQty: addQty, removed: false, isNew: true,
    }]);
    setAddSelected(null);
    setAddSearch("");
    setAddQty(1);
    setShowAddItem(false);
  };

  const editHasChanges = editItems.some(it => it.removed || it.isNew || it.editQty !== it.ordered);
  const editTotal = editItems.filter(it => !it.removed).reduce((s, it) => s + it.editQty * it.pricePerUnit, 0);

  const saveEditOrder = async () => {
    setIsSaving(true);
    // TODO: orderApi.editOrder(detail.orderId, editItems.filter(it=>!it.removed).map(it=>({product_id:it.product_id, quantity:it.editQty})))
    await new Promise(r => setTimeout(r, 700));
    setIsSaving(false);
    cancelMode();
  };

  // ── Record-delivery helpers ────────────────────────────────────────────────
  const updateRecQty = (idx: number, delta: number) =>
    setRecItems(prev => prev.map((it, i) =>
      i === idx ? { ...it, recorded: Math.max(0, it.recorded + delta) } : it
    ));

  const setRecQtyDirect = (idx: number, val: string) =>
    setRecItems(prev => prev.map((it, i) =>
      i === idx ? { ...it, recorded: Math.max(0, parseInt(val) || 0) } : it
    ));

  const setShortReason = (idx: number, reason: string) =>
    setRecItems(prev => prev.map((it, i) =>
      i === idx ? { ...it, shortReason: reason } : it
    ));

  const recHasVariance = recItems.some(it => it.recorded < it.ordered);
  const recTotal = recItems.reduce((s, it) => {
    const orig = detail.items.find(d => d.name === it.name);
    return s + it.recorded * (orig?.pricePerUnit ?? 0);
  }, 0);

  const saveDelivery = async () => {
    setIsRecording(true);
    // TODO: orderApi.recordDelivery(detail.orderId, recItems, recNote)
    await new Promise(r => setTimeout(r, 700));
    setIsRecording(false);
    cancelMode();
  };

  // ── View mode totals ───────────────────────────────────────────────────────
  const lineTotal = (item: LineItem) => (item.delivered ?? item.ordered) * item.pricePerUnit;
  const viewTotal = detail.items.reduce((s, i) => s + lineTotal(i), 0);

  const modeLabel: Record<PanelMode, string> = {
    "view":             sc.label,
    "edit-order":       "EDITING ORDER",
    "record-delivery":  "RECORDING DELIVERY",
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={mode === "view" ? onClose : undefined} />

      <div className="fixed right-0 top-0 bottom-0 z-50 w-[500px] shadow-2xl flex flex-col overflow-hidden" style={{ background: C.bg }}>

        {/* ── Header ── */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b" style={{ background: C.card, borderColor: C.border }}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[15px] font-bold" style={{ color: C.text }}>{detail.vendor}</span>
              <ArrowRight size={13} style={{ color: C.muted }} />
              <span className="text-[14px] font-medium" style={{ color: C.muted }}>{detail.branch}</span>
              <span className="rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide"
                style={{ background: mode === "view" ? sc.bg : mode === "edit-order" ? "#EFF6FF" : "#F0FDF4",
                         color:      mode === "view" ? sc.color : mode === "edit-order" ? "#1D4ED8" : C.green }}>
                {modeLabel[mode]}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[12px]" style={{ color: C.muted }}>
              <span>{detail.time} · {detail.category} · {channelLabel}</span>
            </div>
            {mode === "view" && (detail.sentAt || detail.deliveredAt) && (
              <div className="flex items-center gap-3 mt-1 text-[11px]" style={{ color: C.muted }}>
                {detail.sentAt && <span>Sent {detail.sentAt}</span>}
                {detail.deliveredAt && <span style={{ color: C.green }}>✓ Delivered {detail.deliveredAt}</span>}
                {!detail.deliveredAt && detail.status !== "draft" && <span style={{ color: C.red }}>Not yet delivered</span>}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 ml-3 shrink-0">
            {mode === "view" && (detail.status === "draft" || detail.status === "scheduled") && (
              <button onClick={enterEditOrder}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium border transition-colors hover:bg-stone-50"
                style={{ borderColor: C.border, color: C.muted }}>
                <Pencil size={12} /> Edit order
              </button>
            )}
            {mode === "view" && (detail.status === "delivered" || detail.status === "variance") && (
              <button onClick={enterRecordDelivery}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium border transition-colors hover:bg-stone-50"
                style={{ borderColor: C.border, color: C.muted }}>
                <Pencil size={12} /> Record delivery
              </button>
            )}
            <button onClick={mode === "view" ? onClose : cancelMode}
              className="p-1.5 rounded-lg hover:bg-stone-100">
              <X size={16} style={{ color: C.muted }} />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4">

          {/* ════ VIEW MODE ════ */}
          {mode === "view" && (
            <>
              {detail.note && (
                <div className="flex items-start gap-2 rounded-lg px-3 py-2.5 mb-4 text-[12px]"
                  style={{ background: detail.status === "variance" ? "#FEE2E2" : "#FEF3C7",
                           color:      detail.status === "variance" ? C.red : C.amber }}>
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                  <span>{detail.note}</span>
                </div>
              )}
              <div className="grid pb-2 mb-1 text-[10px] font-bold uppercase tracking-wide"
                style={{ gridTemplateColumns: "1fr 72px 80px 64px 68px", color: C.muted, borderBottom: `1px solid ${C.border}` }}>
                <span>Item</span>
                <span className="text-right">Ordered</span>
                <span className="text-right">Delivered</span>
                <span className="text-right">Rate</span>
                <span className="text-right">Total</span>
              </div>
              {detail.items.map((item, i) => {
                const isShort   = item.delivered !== undefined && item.delivered < item.ordered;
                const isMissing = item.delivered === undefined && detail.status !== "draft";
                return (
                  <div key={i} className="grid py-2.5 text-[13px] border-b"
                    style={{ gridTemplateColumns: "1fr 72px 80px 64px 68px", borderColor: C.border }}>
                    <span className="font-medium pr-2" style={{ color: C.text }}>{item.name}</span>
                    <span className="text-right tabular-nums" style={{ color: C.muted }}>{item.ordered} {item.unit}</span>
                    <span className="text-right tabular-nums font-medium" style={{ color: isMissing ? C.gray : isShort ? C.red : C.green }}>
                      {item.delivered === undefined
                        ? (detail.status === "draft" ? "—" : "pending")
                        : `${item.delivered} ${item.unit}`}
                      {isShort && <span className="text-[10px] ml-1" style={{ color: C.red }}>({item.delivered! - item.ordered})</span>}
                    </span>
                    <span className="text-right tabular-nums text-[12px]" style={{ color: C.muted }}>₹{item.pricePerUnit}</span>
                    <span className="text-right tabular-nums font-semibold" style={{ color: C.text }}>
                      ₹{lineTotal(item).toLocaleString("en-IN")}
                    </span>
                  </div>
                );
              })}
              <div className="flex justify-between items-center pt-3 mt-1">
                <span className="text-[13px] font-semibold" style={{ color: C.muted }}>Order total</span>
                <span className="text-[18px] font-bold" style={{ color: C.text }}>₹{viewTotal.toLocaleString("en-IN")}</span>
              </div>
            </>
          )}

          {/* ════ EDIT ORDER MODE ════ */}
          {mode === "edit-order" && (
            <>
              <p className="text-[11px] mb-4" style={{ color: C.muted }}>
                Adjust quantities or add/remove items before the order is placed.
              </p>

              <div className="space-y-1">
                {editItems.map((item, i) => (
                  <div key={i} className={cn("rounded-xl border px-4 py-3 transition-all",
                    item.removed ? "opacity-40" : item.isNew ? "border-green-200 bg-green-50" : item.editQty !== item.ordered ? "border-blue-200 bg-blue-50" : "")}
                    style={!item.removed && !item.isNew && item.editQty === item.ordered ? { borderColor: C.border, background: C.card } : {}}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium truncate" style={{ color: C.text }}>{item.name}</p>
                        {item.isNew && <span className="text-[10px] font-bold" style={{ color: C.green }}>NEW</span>}
                        {!item.isNew && !item.removed && item.editQty !== item.ordered && (
                          <span className="text-[10px]" style={{ color: "#1D4ED8" }}>
                            {item.ordered} → {item.editQty} {item.unit}
                          </span>
                        )}
                        {item.removed && <span className="text-[10px]" style={{ color: C.red }}>REMOVED</span>}
                      </div>

                      {item.removed ? (
                        <button onClick={() => restoreEditItem(i)}
                          className="flex items-center gap-1 text-[11px] font-medium rounded-lg px-2 py-1 border"
                          style={{ borderColor: C.border, color: C.muted }}>
                          <RotateCcw size={11} /> Restore
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center rounded-lg border overflow-hidden" style={{ borderColor: C.border }}>
                            <button onClick={() => updateEditQty(i, -1)}
                              className="w-8 h-8 flex items-center justify-center hover:bg-stone-50 transition-colors"
                              style={{ color: C.muted }}>
                              <Minus size={13} />
                            </button>
                            <input
                              type="number" value={item.editQty} min={0}
                              onChange={e => setEditQtyDirect(i, e.target.value)}
                              className="w-12 h-8 text-center text-[13px] font-semibold border-x outline-none bg-white"
                              style={{ color: C.text, borderColor: C.border }}
                            />
                            <button onClick={() => updateEditQty(i, 1)}
                              className="w-8 h-8 flex items-center justify-center hover:bg-stone-50 transition-colors"
                              style={{ color: C.muted }}>
                              <Plus size={13} />
                            </button>
                          </div>
                          <span className="text-[12px] w-6" style={{ color: C.muted }}>{item.unit}</span>
                          <button onClick={() => removeEditItem(i)}
                            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                            style={{ color: C.gray }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add item */}
              {!showAddItem ? (
                <button onClick={() => setShowAddItem(true)}
                  className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl border border-dashed py-2.5 text-[12px] font-medium transition-colors hover:bg-stone-50"
                  style={{ borderColor: C.border, color: C.muted }}>
                  <Plus size={13} /> Add item
                </button>
              ) : (
                <div className="mt-3 rounded-xl border p-4" style={{ borderColor: C.border, background: C.card }}>
                  <div className="flex items-center gap-2 rounded-lg border px-3 py-2 mb-3" style={{ borderColor: C.border, background: C.bg }}>
                    <Search size={13} style={{ color: C.muted }} />
                    <input
                      autoFocus
                      placeholder="Search products…"
                      value={addSearch}
                      onChange={e => { setAddSearch(e.target.value); setAddSelected(null); }}
                      className="flex-1 text-[13px] bg-transparent outline-none"
                      style={{ color: C.text }}
                    />
                    {addSearch && (
                      <button onClick={() => { setAddSearch(""); setAddSelected(null); }}>
                        <X size={12} style={{ color: C.muted }} />
                      </button>
                    )}
                  </div>
                  {addSearch && !addSelected && (
                    <div className="rounded-lg border overflow-hidden mb-3" style={{ borderColor: C.border }}>
                      {addSearchResults.slice(0, 6).map(p => (
                        <button key={p.name} onClick={() => { setAddSelected(p); setAddSearch(p.name); }}
                          className="w-full flex items-center justify-between px-3 py-2.5 text-left border-b last:border-b-0 hover:bg-stone-50"
                          style={{ borderColor: C.border }}>
                          <span className="text-[13px] font-medium" style={{ color: C.text }}>{p.name}</span>
                          <span className="text-[12px]" style={{ color: C.muted }}>₹{p.price}/{p.unit}</span>
                        </button>
                      ))}
                      {addSearchResults.length === 0 && (
                        <p className="px-3 py-2.5 text-[12px]" style={{ color: C.muted }}>No products found</p>
                      )}
                    </div>
                  )}
                  {addSelected && (
                    <div className="flex items-center gap-3 rounded-lg border px-3 py-2.5 mb-3" style={{ borderColor: "hsl(145 50% 75%)", background: "#F0FDF4" }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold" style={{ color: C.text }}>{addSelected.name}</p>
                        <p className="text-[11px]" style={{ color: C.muted }}>₹{addSelected.price}/{addSelected.unit}</p>
                      </div>
                      <div className="flex items-center rounded-lg border overflow-hidden" style={{ borderColor: C.border }}>
                        <button onClick={() => setAddQty(q => Math.max(1, q - 1))}
                          className="w-7 h-7 flex items-center justify-center hover:bg-stone-50" style={{ color: C.muted }}>
                          <Minus size={12} />
                        </button>
                        <input type="number" value={addQty} min={1}
                          onChange={e => setAddQty(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-10 h-7 text-center text-[12px] font-semibold border-x outline-none bg-white"
                          style={{ color: C.text, borderColor: C.border }} />
                        <button onClick={() => setAddQty(q => q + 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-stone-50" style={{ color: C.muted }}>
                          <Plus size={12} />
                        </button>
                      </div>
                      <span className="text-[12px]" style={{ color: C.muted }}>{addSelected.unit}</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => { setShowAddItem(false); setAddSearch(""); setAddSelected(null); }}
                      className="flex-1 py-2 rounded-lg border text-[12px] font-medium"
                      style={{ borderColor: C.border, color: C.muted }}>
                      Cancel
                    </button>
                    <button onClick={confirmAddItem} disabled={!addSelected}
                      className="flex-1 py-2 rounded-lg text-[12px] font-semibold text-white disabled:opacity-40"
                      style={{ background: C.cta }}>
                      Add to order
                    </button>
                  </div>
                </div>
              )}

              {/* Changes summary */}
              {editHasChanges && (
                <div className="mt-4 rounded-xl border px-4 py-3" style={{ borderColor: "hsl(215 50% 80%)", background: "#EFF6FF" }}>
                  <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: "#1D4ED8" }}>Changes</p>
                  {editItems.map((it, i) => {
                    if (it.removed)              return <p key={i} className="text-[12px]" style={{ color: C.red }}>− {it.name} removed</p>;
                    if (it.isNew)                return <p key={i} className="text-[12px]" style={{ color: C.green }}>+ {it.name} · {it.editQty} {it.unit}</p>;
                    if (it.editQty !== it.ordered) return <p key={i} className="text-[12px]" style={{ color: "#1D4ED8" }}>~ {it.name} · {it.ordered} → {it.editQty} {it.unit}</p>;
                    return null;
                  })}
                  <div className="flex justify-between mt-2 pt-2 border-t" style={{ borderColor: "hsl(215 50% 80%)" }}>
                    <span className="text-[12px]" style={{ color: C.muted }}>New total</span>
                    <span className="text-[13px] font-bold" style={{ color: C.text }}>₹{editTotal.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ════ RECORD DELIVERY MODE ════ */}
          {mode === "record-delivery" && (
            <>
              <p className="text-[11px] mb-4" style={{ color: C.muted }}>
                Enter what was actually received. Short items will be flagged for variance.
              </p>

              <div className="space-y-1">
                {recItems.map((item, i) => {
                  const isShort = item.recorded < item.ordered;
                  return (
                    <div key={i} className="rounded-xl border px-4 py-3"
                      style={{ borderColor: isShort ? "#FCA5A5" : C.border, background: isShort ? "#FEF2F2" : C.card }}>
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <p className="text-[13px] font-medium flex-1 min-w-0 truncate" style={{ color: C.text }}>{item.name}</p>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px]" style={{ color: C.muted }}>Ordered: {item.ordered} {item.unit}</span>
                          <div className="flex items-center rounded-lg border overflow-hidden" style={{ borderColor: isShort ? "#FCA5A5" : C.border }}>
                            <button onClick={() => updateRecQty(i, -1)}
                              className="w-8 h-8 flex items-center justify-center hover:bg-stone-50"
                              style={{ color: C.muted }}>
                              <Minus size={13} />
                            </button>
                            <input type="number" value={item.recorded} min={0}
                              onChange={e => setRecQtyDirect(i, e.target.value)}
                              className="w-14 h-8 text-center text-[13px] font-semibold border-x outline-none bg-white"
                              style={{ color: isShort ? C.red : C.green, borderColor: isShort ? "#FCA5A5" : C.border }} />
                            <button onClick={() => updateRecQty(i, 1)}
                              className="w-8 h-8 flex items-center justify-center hover:bg-stone-50"
                              style={{ color: C.muted }}>
                              <Plus size={13} />
                            </button>
                          </div>
                          <span className="text-[12px] w-6" style={{ color: C.muted }}>{item.unit}</span>
                        </div>
                      </div>
                      {isShort && (
                        <input
                          placeholder="Why short? (driver note, substitution…)"
                          value={item.shortReason}
                          onChange={e => setShortReason(i, e.target.value)}
                          className="mt-2 w-full rounded-lg border px-3 py-2 text-[12px] outline-none"
                          style={{ borderColor: "#FCA5A5", background: "#FFF7F7", color: C.text }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Overall delivery note */}
              <div className="mt-3">
                <p className="text-[11px] font-semibold mb-1.5" style={{ color: C.muted }}>Delivery note (optional)</p>
                <textarea
                  rows={3}
                  value={recNote}
                  onChange={e => setRecNote(e.target.value)}
                  placeholder="e.g. Driver said cold-storage issue, will compensate tomorrow…"
                  className="w-full rounded-xl border px-4 py-3 text-[13px] outline-none resize-none"
                  style={{ borderColor: C.border, background: C.card, color: C.text }}
                />
              </div>

              {/* Variance summary */}
              {recHasVariance && (
                <div className="mt-3 rounded-xl border px-4 py-3" style={{ borderColor: "#FCA5A5", background: "#FEF2F2" }}>
                  <p className="text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: C.red }}>Variance summary</p>
                  {recItems.filter(it => it.recorded < it.ordered).map((it, i) => (
                    <p key={i} className="text-[12px]" style={{ color: C.red }}>
                      {it.name}: ordered {it.ordered} · received {it.recorded} · short {it.recorded - it.ordered} {it.unit}
                    </p>
                  ))}
                  <div className="flex justify-between mt-2 pt-2 border-t" style={{ borderColor: "#FCA5A5" }}>
                    <span className="text-[12px]" style={{ color: C.muted }}>Billed total</span>
                    <span className="text-[13px] font-bold" style={{ color: C.text }}>₹{recTotal.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 flex gap-3 border-t" style={{ background: C.card, borderColor: C.border }}>
          {mode === "view" && detail.status === "draft" && (
            <>
              <button className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold border"
                style={{ borderColor: C.border, color: C.muted }}>
                Skip tomorrow
              </button>
              <button className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white"
                style={{ background: C.cta }}>
                Confirm order
              </button>
            </>
          )}

          {mode === "edit-order" && (
            <>
              <button onClick={cancelMode}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold border"
                style={{ borderColor: C.border, color: C.muted }}>
                Discard
              </button>
              <button onClick={saveEditOrder} disabled={!editHasChanges || isSaving}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-40"
                style={{ background: C.cta }}>
                {isSaving ? "Saving…" : `Save changes · ₹${editTotal.toLocaleString("en-IN")}`}
              </button>
            </>
          )}

          {mode === "record-delivery" && (
            <>
              <button onClick={cancelMode}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold border"
                style={{ borderColor: C.border, color: C.muted }}>
                Discard
              </button>
              <button onClick={saveDelivery} disabled={isRecording}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-40"
                style={{ background: recHasVariance ? C.red : C.green }}>
                {isRecording ? "Saving…" : recHasVariance ? "Save with variance" : "Confirm delivery"}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── View A: Swimlanes ──────────────────────────────────────────────────────

const CELL_COLORS: Record<CellStatus, { bg: string; color: string }> = {
  delivered: { bg: "#166534", color: "#fff"          },
  variance:  { bg: "#991B1B", color: "#fff"          },
  draft:     { bg: "hsl(33 65% 38%)", color: "#fff"  },
  scheduled: { bg: "transparent", color: C.muted     },
  empty:     { bg: "transparent", color: "transparent"},
};

function GridCell({ cell, onClick }: { cell: SwimlaneCell; onClick?: () => void }) {
  const s = CELL_COLORS[cell.status];
  if (cell.status === "empty") return <div className="border-l py-2 px-1.5 min-h-[52px]" style={{ borderColor: C.border }} />;
  return (
    <div
      className={cn("border-l py-2 px-1.5 min-h-[52px]", onClick && cell.status !== "scheduled" && "cursor-pointer")}
      style={{ borderColor: C.border }}
      onClick={cell.status !== "scheduled" ? onClick : undefined}
    >
      {cell.status === "scheduled" ? (
        <div className="flex items-start gap-1">
          <span className="text-[11px]" style={{ color: C.muted }}>{cell.vendor}</span>
        </div>
      ) : (
        <div className={cn("rounded px-1.5 py-1 h-full transition-opacity", onClick && "hover:opacity-80")} style={{ background: s.bg }}>
          <p className="text-[11px] font-semibold leading-tight" style={{ color: s.color }}>{cell.vendor}</p>
          {cell.detail && <p className="text-[10px] mt-0.5" style={{ color: s.color, opacity: 0.8 }}>{cell.detail}</p>}
        </div>
      )}
    </div>
  );
}

function SwimlaneView({ date }: { date: string }) {
  const { branches, sessionBranches, ruleOverrides, todayOrders, loading, hasSession } = useTodayData(date);
  const [selectedCell, setSelectedCell] = useState<CellDetail | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<{ order: OrderSummary; vendorName: string } | null>(null);
  const navigate = useNavigate();

  const todayStr = new Date().toISOString().slice(0, 10);
  const isToday = date === todayStr;

  // Compute the next upcoming cutoff within 4 hours, grouping vendors at the same time.
  const nextCutoff = useMemo(() => {
    if (!isToday) return null;
    const nowMs = Date.now();
    const fourHours = 4 * 60 * 60 * 1000;

    const cutoffTimes: Map<number, string[]> = new Map();

    for (const [key, rule] of Object.entries(ruleOverrides)) {
      if (!rule.cutoff || rule.cutoff.toLowerCase().includes("previous day")) continue;
      const timeMatch = rule.cutoff.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!timeMatch) continue;
      let h = parseInt(timeMatch[1]);
      const m = parseInt(timeMatch[2]);
      const ampm = timeMatch[3].toUpperCase();
      if (ampm === "PM" && h !== 12) h += 12;
      if (ampm === "AM" && h === 12) h = 0;

      const cutoffDate = new Date();
      cutoffDate.setHours(h, m, 0, 0);
      if (cutoffDate.getTime() <= nowMs) {
        // Try tomorrow
        cutoffDate.setDate(cutoffDate.getDate() + 1);
      }
      const ms = cutoffDate.getTime();
      if (ms - nowMs > fourHours) continue;

      const vendor = key.slice(0, key.indexOf("|"));
      const existing = cutoffTimes.get(ms) ?? [];
      if (!existing.includes(vendor)) existing.push(vendor);
      cutoffTimes.set(ms, existing);
    }

    if (cutoffTimes.size === 0) return null;
    const minMs = Math.min(...cutoffTimes.keys());
    return { time: new Date(minMs), vendors: cutoffTimes.get(minMs) ?? [] };
  }, [ruleOverrides, isToday]);

  // Use session branch names for columns (they match rule_override keys exactly)
  const colBranches = sessionBranches.length > 0 ? sessionBranches : branches.map(b => b.branch_name);

  const rows = buildRealSwimlaneRows(ruleOverrides, colBranches, todayOrders, date, branches);
  const now = nowMinutes();
  const nowLabel = (() => {
    const h = Math.floor(now / 60), m = now % 60;
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
  })();

  const COL = `140px repeat(${colBranches.length}, minmax(110px, 1fr))`;

  // Branch order totals for footer — fuzzy match session names → DB branch names
  const branchOrderCounts = colBranches.map(branchName => {
    const normalized = branchName.toUpperCase().replace(/\s+BRANCH$/i, "").replace(/\s+/g, "");
    const placed = todayOrders.filter(o => {
      const on = (o.branch_name ?? "").toUpperCase().replace(/\s+/g, "");
      return on === normalized || on.includes(normalized) || normalized.includes(on);
    }).length;
    const activeVendors = rows.filter(r => {
      const ci = colBranches.indexOf(branchName);
      return r.cells[ci]?.status !== "empty";
    }).length;
    return { placed, activeVendors };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin" style={{ color: C.muted }} />
        <span className="ml-3 text-[14px]" style={{ color: C.muted }}>Loading today's schedule…</span>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="rounded-xl border p-12 text-center" style={{ background: C.card, borderColor: C.border }}>
        <p className="text-[14px] font-medium mb-2" style={{ color: C.text }}>Supply setup not completed</p>
        <p className="text-[13px]" style={{ color: C.muted }}>
          Complete your Supply Setup to see today's vendor schedule here.
        </p>
        <a href="/setup" className="inline-block mt-4 px-5 py-2 rounded-lg text-[13px] font-semibold text-white" style={{ background: C.cta }}>
          Go to Supply Setup →
        </a>
      </div>
    );
  }

  if (rows.length === 0) {
    const dayName = new Date(date + "T12:00:00").toLocaleDateString("en-IN", { weekday: "long" });
    return (
      <div className="rounded-xl border p-12 text-center" style={{ background: C.card, borderColor: C.border }}>
        <p className="text-[14px] font-medium mb-2" style={{ color: C.text }}>No deliveries scheduled for {dayName}</p>
        <p className="text-[13px]" style={{ color: C.muted }}>
          All vendor rules are set to rest today. Edit your Supply Setup to update delivery days.
        </p>
        <a href="/setup" className="inline-block mt-4 px-5 py-2 rounded-lg text-[13px] font-semibold text-white" style={{ background: C.cta }}>
          Edit Supply Setup →
        </a>
      </div>
    );
  }

  // Find where NOW fits in the sorted rows
  let nowInsertIdx = rows.length;
  for (let i = 0; i < rows.length; i++) {
    if (!rows[i].isPrevDay && rows[i].cutoffMins > now) {
      nowInsertIdx = i;
      break;
    }
  }

  return (
    <div>
      <CutoffBanner nextCutoff={nextCutoff} />

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-[11px] flex-wrap" style={{ color: C.muted }}>
        {[
          { bg: "hsl(33 65% 38%)", label: "Order placed" },
          { bg: "#991B1B",         label: "Cutoff missed" },
          { bg: "#D1D5DB",         label: "Scheduled" },
        ].map(l => (
          <span key={l.label} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded" style={{ background: l.bg }} />
            {l.label}
          </span>
        ))}
        {isToday && (
          <span className="ml-auto flex items-center gap-1.5" style={{ color: C.amber }}>
            <span className="h-2 w-2 rounded-full" style={{ background: C.amber }} />
            Now {nowLabel}
          </span>
        )}
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: C.border }}>
        <div className="overflow-x-auto">
          {/* Header */}
          <div className="grid" style={{ gridTemplateColumns: COL, background: "hsl(37 30% 94%)", borderBottom: `1px solid ${C.border}` }}>
            <div className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wide" style={{ color: C.muted }}>
              Vendor · cutoff
            </div>
            {colBranches.map((branchName, bi) => {
              const stats = branchOrderCounts[bi];
              const hasMissed = rows.some(r => r.cells[bi]?.status === "variance");
              const displayName = branchName.replace(/\s*BRANCH\s*$/i, "");
              return (
                <div key={branchName} className="border-l px-2 py-2.5" style={{ borderColor: C.border }}>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: hasMissed ? C.red : stats.placed > 0 ? C.green : C.gray }} />
                    <span className="text-[12px] font-semibold truncate" style={{ color: C.text }}>{displayName}</span>
                  </div>
                  <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>
                    {stats.placed > 0 ? `${stats.placed} order${stats.placed > 1 ? "s" : ""} placed` : `${stats.activeVendors} vendors today`}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Rows */}
          {rows.map((row, idx) => (
            <React.Fragment key={row.vendor}>
              {isToday && idx === nowInsertIdx && (
                <div className="grid items-center" style={{ gridTemplateColumns: COL, borderTop: `2px dashed ${C.amber}`, background: "hsl(37 55% 95%)" }}>
                  <div className="px-3 py-1 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ background: C.amber }} />
                    <span className="text-[11px] font-bold" style={{ color: C.amber }}>NOW {nowLabel}</span>
                  </div>
                  {colBranches.map((_, i) => <div key={i} className="border-l" style={{ borderColor: C.border }} />)}
                </div>
              )}
              <div className="grid border-t" style={{ gridTemplateColumns: COL, borderColor: C.border, background: C.card }}>
                <div className="px-3 py-2.5 shrink-0">
                  <p className="text-[12px] font-semibold truncate" style={{ color: C.text }}>{row.vendor}</p>
                  <p className="text-[10px]" style={{ color: C.muted }}>
                    cutoff {row.isPrevDay ? "prev day · " : ""}{row.cutoff.replace(/ previous day| same day/i, "")}
                  </p>
                </div>
                {row.cells.map((cell, ci) => (
                  <GridCell
                    key={ci}
                    cell={cell}
                    onClick={() => {
                      // Try mock data first (demo rows)
                      const detail = CELL_DETAILS[`${row.vendor}:${ci}`];
                      if (detail) { setSelectedCell(detail); return; }
                      // Real data: find matching order → open drawer
                      const branchName = colBranches[ci] ?? "";
                      const norm = branchName.toUpperCase().replace(/\s+BRANCH$/i, "").replace(/\s+/g, "");
                      const dbBranch = branches.find(b => {
                        const n = b.branch_name.toUpperCase().replace(/\s+/g, "");
                        return n === norm || n.includes(norm) || norm.includes(n);
                      });
                      const order = todayOrders.find(o => {
                        const on = (o.branch_name ?? "").toUpperCase().replace(/\s+/g, "");
                        return on === norm || on.includes(norm) || norm.includes(on) ||
                          (dbBranch != null && o.branch_id === dbBranch.id);
                      });
                      if (order) setSelectedOrder({ order, vendorName: row.vendor });
                      else navigate("/orders");
                    }}
                  />
                ))}
              </div>
            </React.Fragment>
          ))}

          {/* Now marker at bottom if all rows are past */}
          {isToday && nowInsertIdx === rows.length && (
            <div className="grid items-center border-t" style={{ gridTemplateColumns: COL, borderTop: `2px dashed ${C.amber}`, background: "hsl(37 55% 95%)", borderColor: C.border }}>
              <div className="px-3 py-1 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: C.amber }} />
                <span className="text-[11px] font-bold" style={{ color: C.amber }}>NOW {nowLabel}</span>
              </div>
              {branches.map((_, i) => <div key={i} className="border-l" style={{ borderColor: C.border }} />)}
            </div>
          )}

          {/* Footer */}
          <div className="grid border-t" style={{ gridTemplateColumns: COL, borderColor: C.border, background: "hsl(37 30% 94%)" }}>
            <div className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: C.muted }}>
              {isToday ? "TODAY" : new Date(date + "T12:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }).toUpperCase()}
            </div>
            {branchOrderCounts.map((t, i) => (
              <div key={i} className="border-l px-2 py-2.5 text-[10px]" style={{ borderColor: C.border, color: C.muted }}>
                {t.placed > 0
                  ? <span style={{ color: C.green }}>✓ {t.placed} order{t.placed > 1 ? "s" : ""}</span>
                  : <span>{t.activeVendors} scheduled</span>
                }
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedCell && (
        <OrderDetailPanel detail={selectedCell} onClose={() => setSelectedCell(null)} />
      )}
      {selectedOrder && (
        <LiveOrderDrawer
          order={selectedOrder.order}
          vendorDisplayName={selectedOrder.vendorName}
          onClose={() => setSelectedOrder(null)}
          onNavigate={(path) => { setSelectedOrder(null); navigate(path); }}
        />
      )}
    </div>
  );
}

// ── View B: By exception ───────────────────────────────────────────────────

function ExceptionView({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const [autopilotOpen, setAutopilotOpen] = useState(false);

  return (
    <div>
      {/* Branch health + summary bar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: C.muted }}>Branch health</span>
          {HEALTH_BRANCHES.map(b => (
            <span key={b.name} className="flex items-center gap-1.5 text-[12px]" style={{ color: b.ok ? C.muted : C.red }}>
              <span className="h-2 w-2 rounded-full" style={{ background: b.ok ? C.green : C.red }} />
              {b.name}
            </span>
          ))}
        </div>
        <div className="text-[12px]" style={{ color: C.muted }}>
          <span className="font-semibold" style={{ color: C.text }}>₹1.63L</span> spend today &nbsp;·&nbsp;
          <span className="font-semibold" style={{ color: C.text }}>47</span> deliveries done &nbsp;·&nbsp;
          <span className="font-semibold" style={{ color: C.text }}>18</span> ahead
        </div>
      </div>

      {/* Needs you now */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2 mb-3">
          <h2 className="text-[17px] font-bold" style={{ color: C.text }}>Needs you now</h2>
          <span className="text-[12px]" style={{ color: C.muted }}>4 items · ranked by deadline + impact</span>
        </div>
        <div className="space-y-2">
          {EXCEPTIONS.map(ex => (
            <div key={ex.id} className="flex gap-4 rounded-xl p-4 border" style={{ background: C.card, borderColor: C.border }}>
              {/* Left context */}
              <div className="w-28 shrink-0">
                <p className="text-[11px] font-bold uppercase" style={{ color: C.text }}>{ex.branches}</p>
                <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>{ex.timeLabel}</p>
                <span className="inline-block mt-1.5 rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white" style={{ background: ex.tagColor }}>
                  {ex.tag}
                </span>
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold leading-snug" style={{ color: C.text }}>{ex.title}</p>
                <p className="text-[12px] mt-1" style={{ color: C.muted }}>{ex.detail}</p>
                {ex.meta && <p className="text-[11px] mt-1" style={{ color: C.muted }}>{ex.meta}</p>}
              </div>
              {/* Actions */}
              <div className="shrink-0 flex flex-col items-end gap-1.5">
                <button
                  onClick={() => ex.id === "1" ? navigate("/inbox") : undefined}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white whitespace-nowrap"
                  style={{ background: C.cta }}
                >
                  {ex.cta}
                </button>
                <button className="text-[11px] whitespace-nowrap" style={{ color: C.muted }}>{ex.ctaSecondary}</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Running on autopilot */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2 mb-3">
          <h2 className="text-[17px] font-bold" style={{ color: C.text }}>Running on autopilot</h2>
          <span className="text-[12px]" style={{ color: C.muted }}>auto-confirms unless flagged · all within ±20% of avg</span>
        </div>
        <div className="space-y-2">
          {[
            { count: 47, label: "Drafts auto-confirming for tonight's cutoffs",  sub: "across 12 vendors · 6 branches · all within tolerance" },
            { count: 18, label: "Deliveries scheduled later today",              sub: "next at 9:00 AM · Pollachi Coconut to all 6 branches" },
            { count: 8,  label: "Acknowledgements pending · within window",      sub: "all sent <2h ago · auto-escalates if no reply by morning" },
          ].map(row => (
            <div key={row.label} className="flex items-center gap-4 rounded-xl px-4 py-3 border" style={{ background: C.card, borderColor: C.border }}>
              <span className="h-7 w-7 shrink-0 flex items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: C.text }}>{row.count}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium" style={{ color: C.text }}>{row.label}</p>
                <p className="text-[11px]" style={{ color: C.muted }}>{row.sub}</p>
              </div>
              <button className="text-[12px] shrink-0" style={{ color: C.muted }}>
                {autopilotOpen ? "Collapse ↑" : "Expand ↓"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Done today */}
      <div>
        <div className="flex items-baseline gap-2 mb-3">
          <h2 className="text-[17px] font-bold" style={{ color: C.text }}>Done today</h2>
          <span className="text-[12px]" style={{ color: C.muted }}>matched POs, no variance · ledger updated</span>
        </div>
        <div className="flex items-center gap-4 rounded-xl px-4 py-3 border" style={{ background: C.card, borderColor: C.border }}>
          <span className="h-7 w-7 shrink-0 flex items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: C.green }}>47</span>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium" style={{ color: C.text }}>Deliveries received and matched</p>
            <p className="text-[11px]" style={{ color: C.muted }}>₹38,400 invoiced · 0 variance flags · ledger updated automatically</p>
          </div>
          <button className="text-[12px] shrink-0" style={{ color: C.muted }}>View ledger ↓</button>
        </div>
      </div>
    </div>
  );
}

// ── View C: Branch view ────────────────────────────────────────────────────

function BranchView({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const [activeBranch, setActiveBranch] = useState("T. Nagar");

  return (
    <div>
      {/* Branch header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg text-[11px] font-bold text-white shrink-0" style={{ background: C.cta }}>
          {activeBranch.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: C.muted }}>Branch</p>
          <button className="flex items-center gap-1 text-[15px] font-bold" style={{ color: C.text }}>
            {activeBranch} <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Other branches strip */}
      <div className="mb-5">
        <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: C.muted }}>Other branches · tap to switch</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {OTHER_BRANCHES.map(b => (
            <button
              key={b.name}
              onClick={() => setActiveBranch(b.name)}
              className="shrink-0 rounded-lg px-3 py-2 text-left border transition-colors hover:border-amber-400"
              style={{ background: C.card, borderColor: C.border, minWidth: 140 }}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: b.alert ? C.red : C.green }} />
                <span className="text-[12px] font-semibold" style={{ color: C.text }}>{b.name}</span>
              </div>
              <p className="text-[10px]" style={{ color: b.alert ? C.red : C.muted }}>{b.note}</p>
            </button>
          ))}
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-5 gap-3 mb-5">
        {[
          { label: "TODAY'S SPEND",  value: "₹38.4K", sub: "across 10 vendors" },
          { label: "DELIVERED",      value: "4",       sub: "of 10 today"       },
          { label: "VARIANCE",       value: "1",       sub: "Anbu · short tomato", red: true },
          { label: "PENDING REVIEW", value: "2",       sub: "next cutoff 2:00 PM", amber: true },
          { label: "UPCOMING",       value: "6",       sub: "next at 9:00 AM"   },
        ].map(t => (
          <div key={t.label} className="rounded-xl p-4 border" style={{ background: C.card, borderColor: C.border }}>
            <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: C.muted }}>{t.label}</p>
            <p className="text-[20px] font-bold leading-tight" style={{ color: t.red ? C.red : t.amber ? C.amber : C.text }}>{t.value}</p>
            <p className="text-[10px] mt-0.5" style={{ color: C.muted }}>{t.sub}</p>
          </div>
        ))}
      </div>

      {/* Cutoff banner */}
      <div className="flex items-center gap-4 rounded-xl px-5 py-3.5 mb-5 border" style={{ background: "hsl(37 70% 93%)", borderColor: "hsl(33 50% 80%)" }}>
        <div className="h-9 w-9 shrink-0 flex items-center justify-center rounded-full" style={{ background: C.cta }}>
          <Clock size={16} color="#fff" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.cta }}>{activeBranch} · Anbu cutoff in 1h 12m</p>
          <p className="text-[13px] mt-0.5" style={{ color: C.text }}>
            <strong>3 drafts</strong> pending — one has <span style={{ color: C.red }}>+18% tomato vs 4-week avg</span>
          </p>
        </div>
        <button className="text-[12px] font-semibold flex items-center gap-1.5 rounded-lg px-4 py-2 text-white shrink-0" style={{ background: C.cta }} onClick={() => navigate("/inbox")}>
          Review <ArrowRight size={13} />
        </button>
      </div>

      {/* Timeline */}
      <div className="rounded-xl border overflow-hidden" style={{ background: C.card, borderColor: C.border }}>
        {TIMELINE.map((ev, idx) => {
          const showNow = TIMELINE[idx - 1]?.id === NOW_AFTER;
          return (
            <React.Fragment key={ev.id}>
              {showNow && (
                <div className="flex items-center gap-3 px-5 py-1.5" style={{ borderTop: `2px dashed ${C.amber}`, background: "hsl(37 55% 95%)" }}>
                  <span className="h-2 w-2 rounded-full" style={{ background: C.amber }} />
                  <span className="text-[12px] font-bold" style={{ color: C.amber }}>7:42 AM</span>
                  <span className="text-[12px]" style={{ color: C.muted }}>Now · Tue 12 Nov</span>
                </div>
              )}
              <div className="flex items-start gap-4 px-5 py-3.5 border-t" style={{ borderColor: C.border }}>
                <div className="w-[90px] shrink-0 text-right">
                  <p className="text-[13px] font-semibold" style={{ color: C.text }}>{ev.time}</p>
                  {ev.subLabel && <p className="text-[10px] mt-0.5" style={{ color: C.muted }}>{ev.subLabel}</p>}
                </div>
                <div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: ev.status === "delivered" ? C.green : ev.status === "variance" ? C.red : ev.status === "pending" ? C.amber : C.gray }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[13px] font-semibold" style={{ color: C.text }}>{ev.vendor}</span>
                    <ChannelPill channel={ev.channel} lang={ev.lang} />
                  </div>
                  <p className="text-[12px] mt-0.5" style={{ color: C.muted }}>{ev.items}</p>
                  {ev.note && (
                    <p className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: C.amber }}>
                      <AlertTriangle size={10} /> {ev.note}
                    </p>
                  )}
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1.5">
                  {ev.amount && <span className="text-[13px] font-semibold" style={{ color: C.text }}>₹{ev.amount.toLocaleString("en-IN")}</span>}
                  <StatusChip status={ev.status} />
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function Today() {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewMode>("swimlanes");
  const { branches } = useAuth();

  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const isToday = selectedDate === todayStr;

  const dateLabel = new Date(selectedDate + "T12:00:00").toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  }).toUpperCase();

  const shiftDate = (delta: number) => {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const headings: Record<ViewMode, { title: string; sub: string }> = {
    swimlanes: { title: isToday ? "Today · all branches" : `${dateLabel.split(",")[0]} · all branches`, sub: `${branches.length} branch${branches.length !== 1 ? "es" : ""} · ${dateLabel}` },
    exception: { title: "Today · what needs you", sub: "Only showing exceptions and decisions" },
    branch:    { title: isToday ? "Today" : dateLabel.split(",")[0], sub: dateLabel },
    feed:      { title: "Feed",                   sub: "Activity across all branches" },
  };

  const h = headings[view];

  return (
    <div className="frame-container mx-auto px-4 py-8" style={{ color: C.text }}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] font-semibold tracking-widest uppercase mb-1" style={{ color: C.muted }}>{h.sub}</p>
          <h1 className="text-[36px] font-bold leading-none font-playfair">{h.title}</h1>
        </div>
        <div className="flex items-center gap-2 mt-1.5 shrink-0">
          {/* Date navigation */}
          <div className="flex items-center rounded-lg border overflow-hidden" style={{ borderColor: C.border }}>
            <button
              onClick={() => shiftDate(-1)}
              className="px-2 py-1.5 hover:bg-stone-100 transition-colors"
              style={{ color: C.muted }}
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="px-3 py-1.5 text-[11px] font-semibold border-x transition-colors hover:bg-stone-100"
              style={{ borderColor: C.border, color: isToday ? C.cta : C.text }}
            >
              {isToday ? "Today" : new Date(selectedDate + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </button>
            <button
              onClick={() => shiftDate(1)}
              className="px-2 py-1.5 hover:bg-stone-100 transition-colors"
              style={{ color: C.muted }}
            >
              <ChevronRight size={15} />
            </button>
          </div>
          <ViewToggle view={view} onChange={setView} />
        </div>
      </div>

      {view === "swimlanes" && <SwimlaneView date={selectedDate} />}
      {view === "exception" && <ExceptionView navigate={navigate} />}
      {view === "branch"    && <BranchView navigate={navigate} />}
      {view === "feed"      && (
        <div className="rounded-xl border p-12 text-center" style={{ background: C.card, borderColor: C.border }}>
          <p className="text-[14px]" style={{ color: C.muted }}>Feed view — coming soon</p>
        </div>
      )}
    </div>
  );
}
