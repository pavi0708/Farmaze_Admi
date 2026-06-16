/**
 * Pure transforms: OnboardParseResult → wizard step data shapes.
 * No API calls, no side effects — safe to use in useMemo.
 */
import type { OnboardParseResult } from "@/api/agentApi";

// ── Shared types (used by OnboardingSetup steps) ──────────────────────────

export interface ExtractedVendor {
  id: string;
  name: string;
  description: string;
  sources: { label: string; type: "wa" | "pdf" | "sheet" }[];
  days: boolean[];
  rhythmLabel: string;
  catalogueCount: number;
  spentLabel: string;
  confidence: number;
  confirmed: boolean;
}

export interface BranchData {
  id: string;
  name: string;
  address: string;
  covers: number;
  service: string;
  vendors: ExtractedVendor[];
}

export interface VendorRule {
  id: string;
  name: string;
  branch: string;
  description: string;
  needsReview: boolean;
  confirmed: boolean;
  days: boolean[];
  perDay: string;
  cutoff: string;
  channel: string;
  lang: string;
}

export interface ReviewVendor {
  id: string;
  name: string;
  branch: string;
  itemCount: number;
  categories: string;
  status: "ready" | "missing_phone";
  products?: { name: string; unit: string; avgPrice: number; freq: string }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function formatINR(amount: number): string {
  if (amount >= 100000) {
    const l = amount / 100000;
    const formatted = l % 1 === 0 ? l.toFixed(0) : l.toFixed(2).replace(/\.?0+$/, "");
    return `₹${formatted}L`;
  }
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

function freqLabel(freq: number): string {
  if (freq >= 20) return "Daily";
  if (freq >= 8) return "Weekly";
  if (freq >= 3) return "Bi-weekly";
  return "Occasional";
}

function confidence(invoiceCount: number): number {
  if (invoiceCount >= 15) return 94;
  if (invoiceCount >= 8) return 88;
  if (invoiceCount >= 3) return 78;
  return 65;
}

// ── Step 2a: Your Supply ──────────────────────────────────────────────────

export function parsedToBranchData(parsed: OnboardParseResult): BranchData[] {
  return (parsed.branches ?? []).map((branchName) => {
    const branchVendors: ExtractedVendor[] = (parsed.vendors ?? [])
      .filter((v) => (v.branches ?? []).includes(branchName))
      .map((v) => {
        const conf = confidence(v.invoice_count);
        const topProducts = [...v.products]
          .sort((a, b) => b.frequency - a.frequency)
          .slice(0, 3)
          .map((p) => p.name)
          .join(", ");

        const branchStats = (v as any).per_branch?.[branchName];
        const invoiceCount = branchStats?.invoice_count ?? v.invoice_count;
        const totalSpend = branchStats?.total_spend ?? v.total_spend;
        const branchProducts = branchStats?.products ?? v.products;
        const branchProductCount = branchStats?.products?.length ?? v.product_count;
        const branchConf = confidence(invoiceCount);

        const branchTopProducts = [...branchProducts]
          .sort((a: { frequency: number }, b: { frequency: number }) => b.frequency - a.frequency)
          .slice(0, 3)
          .map((p: { name: string }) => p.name)
          .join(", ");

        return {
          id: `${slugify(branchName)}-${slugify(v.name)}`,
          name: v.name,
          description: branchTopProducts || `${branchProductCount} products`,
          sources: [
            {
              label: `${invoiceCount} invoice${invoiceCount !== 1 ? "s" : ""}`,
              type: "pdf" as const,
            },
          ],
          days: [true, true, true, true, true, true, false],
          rhythmLabel: "DAILY • MON–SAT",
          catalogueCount: branchProductCount,
          spentLabel: formatINR(totalSpend),
          confidence: branchConf,
          confirmed: branchConf >= 78,
        };
      });

    return {
      id: slugify(branchName),
      name: branchName,
      address: "",
      covers: 0,
      service: "lunch + dinner",
      vendors: branchVendors,
    };
  });
}

// ── Step 2b: Order Rules ──────────────────────────────────────────────────

export function parsedToVendorRules(parsed: OnboardParseResult): VendorRule[] {
  const rules: VendorRule[] = [];

  const sorted = [...(parsed.vendors ?? [])].sort((a, b) => b.invoice_count - a.invoice_count);

  for (const v of sorted) {
    const topItems = [...(v.products ?? [])]
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 2)
      .map((p) => p.name)
      .join(", ");

    const branches = (v.branches ?? []).length > 0 ? v.branches! : ["Main Branch"];
    for (const branch of branches) {
      const key = `${v.name}|${branch}`;
      const override = (parsed as any).rule_overrides?.[key];
      rules.push({
        id: `${slugify(v.name)}-${slugify(branch)}`,
        name: v.name,
        branch,
        description: topItems || `${v.product_count} products`,
        needsReview: true,
        confirmed: false,
        days: override?.days ?? [true, true, true, true, true, true, false],
        perDay: override?.per_day ?? "Once a day",
        cutoff: override?.cutoff ?? "10:30 PM previous day",
        channel: override?.channel ?? "WA text",
        lang: "",
      });
    }
  }

  return rules;
}

// ── Step 3: Review ────────────────────────────────────────────────────────

export function parsedToReviewVendors(parsed: OnboardParseResult): ReviewVendor[] {
  const result: ReviewVendor[] = [];

  for (const v of (parsed.vendors ?? [])) {
    const topProducts = [...(v.products ?? [])]
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10)
      .map((p) => ({
        name: p.name,
        unit: p.unit,
        avgPrice: p.rate,
        freq: freqLabel(p.frequency),
      }));

    const categories = [...(v.products ?? [])]
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 3)
      .map((p) => p.name)
      .join(", ");

    const branches = (v.branches ?? []).length > 0 ? v.branches! : ["Main Branch"];

    for (const branch of branches) {
      result.push({
        id: `${slugify(v.name)}-${slugify(branch)}`,
        name: v.name,
        branch,
        itemCount: v.product_count,
        categories,
        status: "ready" as const,
        products: topProducts,
      });
    }
  }

  return result;
}
