/**
 * SupplySetup — persistent view of the current vendor/branch configuration.
 *
 * Loads the last onboarding session and shows branches, vendors, and order
 * rules. Rules and products are editable inline; changes are saved to the
 * session via farmaze-agent endpoints. "Re-import" navigates to /onboarding.
 */
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
  getOnboardSession,
  renameBranchInSession,
  updateRuleInSession,
  upsertProductInSession,
  deleteProductInSession,
  type OnboardSession,
  type OnboardParseResult,
  type RuleOverride,
} from "@/api/agentApi";
import {
  parsedToBranchData,
  parsedToVendorRules,
  formatINR,
  type VendorRule,
} from "@/utils/onboardingTransform";
import RuleEditor from "@/components/setup/RuleEditor";
import ProductEditor from "@/components/setup/ProductEditor";
import {
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Check,
  Store,
  Calendar,
  FileText,
  Loader2,
  Edit2,
} from "lucide-react";

// ── Design tokens (same warm editorial palette as OnboardingSetup) ─────────
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
};

const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];

interface Product {
  name: string;
  unit: string;
  rate: number;
  avg_qty?: number;
  frequency?: number;
}

function shortDate(iso: string): string {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch { return iso; }
}

// ── Small reusable bits ────────────────────────────────────────────────────

function CadenceDots({ days }: { days: boolean[] }) {
  return (
    <div className="flex gap-0.5">
      {DAY_LETTERS.map((l, i) => (
        <div
          key={i}
          className="h-5 w-5 rounded text-[9px] font-bold flex items-center justify-center"
          style={{
            background: days[i] ? T.amber : T.border,
            color: days[i] ? "#fff" : T.muted,
          }}
        >
          {l}
        </div>
      ))}
    </div>
  );
}

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="font-playfair text-[22px] font-bold leading-none" style={{ color: T.ink }}>{value}</p>
      <p className="text-[10px] mt-0.5 uppercase tracking-widest" style={{ color: T.muted }}>{label}</p>
    </div>
  );
}

// ── Vendor card (collapsible, with inline rule + product editor) ─────────────

interface VendorCardProps {
  vendor: ReturnType<typeof parsedToBranchData>[number]["vendors"][number];
  rule?: VendorRule;
  products: Product[];
  saving?: boolean;
  onSaveRule: (updates: { days: boolean[]; perDay: string; channel: string; cutoff: string }) => void;
  onUpsert: (originalName: string, name: string, unit: string, rate: number) => void;
  onDelete: (name: string) => void;
}

function VendorCard({ vendor, rule, products, saving, onSaveRule, onUpsert, onDelete }: VendorCardProps) {
  const [open, setOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(false);

  const days = rule?.days ?? vendor.days;
  const rhythmLabel = rule
    ? `${rule.perDay.toUpperCase()} · ${days.map((d, i) => d ? DAY_LETTERS[i] : null).filter(Boolean).join("")}`
    : vendor.rhythmLabel;

  return (
    <div className="border rounded-xl overflow-hidden mb-2" style={{ borderColor: T.border }}>
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-stone-50 transition-colors text-left"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="h-5 w-5 rounded flex items-center justify-center shrink-0"
            style={{ background: vendor.confidence >= 78 ? T.green : T.amber }}
          >
            <Check size={11} color="#fff" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold truncate" style={{ color: T.ink }}>{vendor.name}</p>
            <p className="text-[11px] truncate" style={{ color: T.muted }}>{vendor.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-5 shrink-0 ml-4">
          <div className="text-right">
            <p className="text-[12px] font-semibold" style={{ color: T.ink }}>{vendor.catalogueCount} items</p>
            <p className="text-[11px]" style={{ color: T.muted }}>{vendor.spentLabel} spent</p>
          </div>
          <div className="flex items-center gap-1 text-[11px]" style={{ color: T.muted }}>
            {vendor.sources[0]?.label}
          </div>
          {open ? <ChevronDown size={14} style={{ color: T.muted }} /> : <ChevronRight size={14} style={{ color: T.muted }} />}
        </div>
      </button>

      {open && (
        <div className="border-t" style={{ borderColor: T.border, background: "hsl(37 47% 98%)" }}>
          {/* ── Schedule section ── */}
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: T.muted }}>Order Schedule</p>
              {!editingSchedule && (
                <button
                  onClick={() => setEditingSchedule(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium"
                  style={{ color: T.amber, background: T.amberLight, border: `1px solid ${T.amberBorder}` }}
                >
                  <Edit2 size={11} />
                  Edit schedule
                </button>
              )}
            </div>

            {editingSchedule && rule ? (
              <RuleEditor
                rule={rule}
                saving={saving}
                onSave={updates => { onSaveRule(updates); setEditingSchedule(false); }}
                onCancel={() => setEditingSchedule(false)}
              />
            ) : (
              <div className="flex items-center gap-4">
                <CadenceDots days={days} />
                <p className="text-[11px] font-medium" style={{ color: T.muted }}>{rhythmLabel}</p>
                {rule && (
                  <>
                    <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: T.border, color: T.muted }}>{rule.channel || "WA text"}</span>
                    <span className="text-[10px]" style={{ color: T.muted }}>Cutoff: {rule.cutoff}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── Products section ── */}
          <div className="px-4 pb-3">
            <div className="flex items-center justify-between mb-1 mt-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: T.muted }}>Products</p>
              <p className="text-[10px]" style={{ color: T.muted }}>Click any cell to edit · hover to delete</p>
            </div>
            <ProductEditor
              vendorName={vendor.name}
              products={products}
              onUpsert={onUpsert}
              onDelete={onDelete}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Order rule row (read mode) ─────────────────────────────────────────────

function RuleRow({ rule }: { rule: VendorRule }) {
  return (
    <div
      className="grid items-center px-5 py-3"
      style={{ gridTemplateColumns: "1fr 120px 130px 110px 110px", gap: "12px" }}
    >
      <div>
        <p className="text-[13px] font-semibold" style={{ color: T.ink }}>{rule.name}</p>
        <p className="text-[11px]" style={{ color: T.muted }}>{rule.branch}</p>
      </div>
      <CadenceDots days={rule.days} />
      <p className="text-[12px]" style={{ color: T.muted }}>{rule.perDay}</p>
      <p className="text-[12px]" style={{ color: T.muted }}>{rule.channel || "WA text"}</p>
      <p className="text-[12px]" style={{ color: T.muted }}>{rule.cutoff}</p>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function SupplySetup() {
  const navigate = useNavigate();
  const { user, branches: authBranches } = useAuth();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<OnboardSession | null>(null);
  const [error, setError] = useState("");
  const [branchNames, setBranchNames] = useState<Record<string, string>>({});
  const [editingBranch, setEditingBranch] = useState<string | null>(null);
  const [ruleOverrides, setRuleOverrides] = useState<Record<string, RuleOverride>>({});
  const [vendorProducts, setVendorProducts] = useState<Record<string, Product[]>>({});
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    const clientId = user?.client_id;
    if (!clientId) { setLoading(false); return; }
    getOnboardSession(clientId)
      .then(res => { setSession(res.data.session); })
      .catch(() => setError("Could not load setup data."))
      .finally(() => setLoading(false));
  }, [user?.client_id]);

  const parsed: OnboardParseResult | null = useMemo(() => {
    if (!session?.result) return null;
    if (typeof session.result === "string") {
      try { return JSON.parse(session.result) as OnboardParseResult; } catch { return null; }
    }
    return session.result as OnboardParseResult;
  }, [session]);

  const hasData = !!(parsed && (parsed.vendors?.length ?? 0) > 0);

  // Hydrate local state from the loaded session
  useEffect(() => {
    if (!parsed) return;
    setRuleOverrides((parsed as any).rule_overrides ?? {});
    // Key by "vendor|branch" — use per-branch product list when available
    const prodMap: Record<string, Product[]> = {};
    for (const v of parsed.vendors ?? []) {
      const vendorBranches = (v.branches ?? []).length > 0 ? v.branches : ["Main Branch"];
      for (const branch of vendorBranches) {
        const perBranch = (v as any).per_branch?.[branch];
        prodMap[`${v.name}|${branch}`] = perBranch?.products ?? v.products ?? [];
      }
    }
    setVendorProducts(prodMap);

    // Populate branchNames from branch_mapping if not already renamed by user
    const bm = (parsed as any).branch_mapping as Record<string, string> | undefined;
    if (bm && authBranches.length > 0) {
      const autoNames: Record<string, string> = {};
      for (const [sessionName, branchId] of Object.entries(bm)) {
        const dbBranch = authBranches.find(b => b.id === branchId);
        if (dbBranch) autoNames[sessionName] = dbBranch.branch_name;
      }
      if (Object.keys(autoNames).length > 0) {
        setBranchNames(prev => ({ ...autoNames, ...prev })); // user renames win over auto
      }
    }
  }, [parsed, authBranches]);

  // Merge rule overrides into the parsed result for display
  const rules = useMemo(() => {
    if (!hasData || !parsed) return [];
    return parsedToVendorRules({ ...parsed, rule_overrides: ruleOverrides } as any);
  }, [hasData, parsed, ruleOverrides]);

  const branches = useMemo(() => (hasData ? parsedToBranchData(parsed!) : []), [hasData, parsed]);

  const commitBranchRename = (originalName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === originalName) { setEditingBranch(null); return; }
    setBranchNames(prev => ({ ...prev, [originalName]: trimmed }));
    setEditingBranch(null);
    const clientId = user?.client_id;
    const sessionId = session?.id;
    if (clientId && sessionId) {
      renameBranchInSession(clientId, sessionId, originalName, trimmed).catch(() => {});
    }
  };

  const displayName = (original: string) => branchNames[original] ?? original;

  const handleRuleSave = (
    rule: VendorRule,
    updates: { days: boolean[]; perDay: string; channel: string; cutoff: string },
  ) => {
    const key = `${rule.name}|${rule.branch}`;
    const override: RuleOverride = {
      days: updates.days,
      per_day: updates.perDay,
      channel: updates.channel,
      cutoff: updates.cutoff,
    };
    setRuleOverrides(prev => ({ ...prev, [key]: override }));
    setEditingRuleId(null);
    if (user?.client_id && session?.id) {
      setSavingKey(key);
      updateRuleInSession(user.client_id, session.id, {
        vendor: rule.name,
        branch: rule.branch,
        ...override,
      })
        .catch(() => toast.error("Could not save rule"))
        .finally(() => setSavingKey(null));
    }
  };

  const handleProductUpsert = (
    vendorName: string,
    branchName: string,
    originalName: string,
    name: string,
    unit: string,
    rate: number,
  ) => {
    const key = `${vendorName}|${branchName}`;
    setVendorProducts(prev => {
      const products = [...(prev[key] ?? [])];
      if (!originalName) {
        products.push({ name, unit, rate, avg_qty: 0, frequency: 0 });
      } else {
        const i = products.findIndex(p => p.name === originalName);
        if (i >= 0) products[i] = { ...products[i], name, unit, rate };
      }
      return { ...prev, [key]: products };
    });
    if (user?.client_id && session?.id) {
      upsertProductInSession(user.client_id, session.id, {
        vendor: vendorName,
        original_name: originalName,
        name,
        unit,
        rate,
      }).catch(() => toast.error("Could not save product"));
    }
  };

  const handleProductDelete = (vendorName: string, branchName: string, productName: string) => {
    const key = `${vendorName}|${branchName}`;
    setVendorProducts(prev => ({
      ...prev,
      [key]: (prev[key] ?? []).filter(p => p.name !== productName),
    }));
    if (user?.client_id && session?.id) {
      deleteProductInSession(user.client_id, session.id, vendorName, productName)
        .catch(() => toast.error("Could not delete product"));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={22} className="animate-spin" style={{ color: T.amber }} />
      </div>
    );
  }

  return (
    <div className="frame-container mx-auto px-4 py-8">
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: T.muted }}>
            Configuration
          </p>
          <h1 className="font-playfair text-[34px] font-bold leading-tight" style={{ color: T.ink }}>
            Supply <em className="not-italic" style={{ color: T.amber }}>Setup</em>
          </h1>
          <p className="text-[13px] mt-1" style={{ color: T.muted }}>
            Your vendor configuration extracted from invoices.
          </p>
        </div>
        <button
          onClick={() => navigate("/onboarding")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white mt-2"
          style={{ background: T.amber }}
        >
          <RefreshCw size={14} /> Re-import order history
        </button>
      </div>

      {/* No data state */}
      {!hasData && !error && (
        <div
          className="rounded-xl border px-6 py-10 flex flex-col items-center text-center"
          style={{ background: T.surface, borderColor: T.border }}
        >
          <Store size={32} style={{ color: T.muted }} className="mb-3" />
          <p className="text-[14px] font-semibold mb-1" style={{ color: T.ink }}>No setup yet</p>
          <p className="text-[13px] mb-4" style={{ color: T.muted }}>
            Import your past orders to automatically configure vendors, branches, and order rules.
          </p>
          <button
            onClick={() => navigate("/onboarding")}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-semibold text-white"
            style={{ background: T.amber }}
          >
            Import order history →
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border px-4 py-3 text-[13px]" style={{ background: "#FEF2F2", borderColor: "#FCA5A5", color: "#DC2626" }}>
          {error}
        </div>
      )}

      {hasData && parsed && (
        <>
          {/* Import metadata */}
          <div
            className="rounded-xl border px-5 py-4 mb-6 flex items-center justify-between flex-wrap gap-4"
            style={{ background: T.amberLight, borderColor: T.amberBorder }}
          >
            <div className="flex items-center gap-6">
              <StatPill value={parsed.total_invoices.toString()} label="invoices" />
              <StatPill value={(parsed.vendors?.length ?? 0).toString()} label="vendors" />
              <StatPill value={(parsed.branches?.length ?? 0).toString()} label="branches" />
            </div>
            <div className="flex items-center gap-4 text-[12px]" style={{ color: T.muted }}>
              {parsed.date_range.from && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={12} />
                  {shortDate(parsed.date_range.from)} – {shortDate(parsed.date_range.to!)}
                </span>
              )}
              {session?.created_at && (
                <span className="flex items-center gap-1.5">
                  <FileText size={12} />
                  Imported {shortDate(session.created_at.split("T")[0])}
                </span>
              )}
            </div>
          </div>

          {/* Branches + vendors */}
          <h2 className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: T.muted }}>
            Branches &amp; Vendors
          </h2>
          {branches.map(branch => (
            <div
              key={branch.id}
              className="rounded-xl border overflow-hidden mb-4"
              style={{ background: T.surface, borderColor: T.border }}
            >
              <div
                className="flex items-center justify-between px-5 py-3"
                style={{ background: "hsl(37 47% 98%)", borderBottom: `1px solid ${T.border}` }}
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center text-[16px]" style={{ background: T.border }}>🍽️</div>
                  <div>
                    {editingBranch === branch.name ? (
                      <input
                        autoFocus
                        className="text-[14px] font-semibold rounded px-1.5 py-0.5 outline-none border"
                        style={{ color: T.ink, borderColor: T.amber, background: T.amberLight, minWidth: 200 }}
                        defaultValue={displayName(branch.name)}
                        onBlur={e => commitBranchRename(branch.name, e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter") commitBranchRename(branch.name, e.currentTarget.value);
                          if (e.key === "Escape") setEditingBranch(null);
                        }}
                      />
                    ) : (
                      <button
                        className="flex items-center gap-1.5 text-[14px] font-semibold text-left group"
                        style={{ color: T.ink }}
                        onClick={() => setEditingBranch(branch.name)}
                        title="Click to rename"
                      >
                        <span className="truncate max-w-[320px]">{displayName(branch.name)}</span>
                        <Edit2 size={11} style={{ color: T.muted }} className="shrink-0" />
                      </button>
                    )}
                    <p className="text-[11px]" style={{ color: T.muted }}>
                      {branch.vendors.length} vendor{branch.vendors.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[12px] font-semibold" style={{ color: T.ink }}>
                    {formatINR(branch.vendors.reduce((s, v) => {
                      const spend = parseInt(v.spentLabel.replace(/[^0-9]/g, ""), 10) || 0;
                      return s + spend;
                    }, 0))}
                  </p>
                  <p className="text-[11px]" style={{ color: T.muted }}>total spend</p>
                </div>
              </div>
              <div className="px-4 py-3">
                {branch.vendors.map(v => {
                  const branchDisplayName = branchNames[branch.name] ?? branch.name;
                  const rule = rules.find(r => r.name === v.name && r.branch === branchDisplayName);
                  const prodKey = `${v.name}|${branch.name}`;
                  return (
                    <VendorCard
                      key={v.id}
                      vendor={v}
                      rule={rule}
                      products={vendorProducts[prodKey] ?? []}
                      saving={rule ? savingKey === `${rule.name}|${rule.branch}` : false}
                      onSaveRule={updates => rule && handleRuleSave(rule, updates)}
                      onUpsert={(originalName, name, unit, rate) =>
                        handleProductUpsert(v.name, branch.name, originalName, name, unit, rate)
                      }
                      onDelete={name => handleProductDelete(v.name, branch.name, name)}
                    />
                  );
                })}
              </div>
            </div>
          ))}

        </>
      )}
    </div>
  );
}
