import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Pencil,
  Plus,
} from "lucide-react";
import type { OnboardingBranch } from "./ManualUploadStep";
import { T } from "./tokens";

interface Props {
  branches: OnboardingBranch[];
  onSubmit: () => void;
  onBack: () => void;
  submitting: boolean;
}

interface VendorReviewRow {
  key: string;
  name: string;
  branches: string[];
  fileCount: number;
  category: string;
  hasName: boolean;
}

function rollupVendors(branches: OnboardingBranch[]): VendorReviewRow[] {
  const byKey = new Map<string, VendorReviewRow>();
  branches.forEach((b) => {
    const branchLabel = b.name.trim() || "Unnamed branch";
    b.vendors.forEach((v) => {
      const trimmed = v.name.trim();
      const key = trimmed.toLowerCase() || `unnamed:${v.id}`;
      const existing = byKey.get(key);
      if (existing) {
        existing.fileCount += v.files.length;
        if (!existing.branches.includes(branchLabel)) {
          existing.branches.push(branchLabel);
        }
        if (!existing.category && v.category) existing.category = v.category;
      } else {
        byKey.set(key, {
          key,
          name: trimmed || "Unnamed vendor",
          branches: [branchLabel],
          fileCount: v.files.length,
          category: v.category,
          hasName: trimmed.length > 0,
        });
      }
    });
  });
  return Array.from(byKey.values());
}

export default function ReviewStep({
  branches,
  onSubmit,
  onBack,
  submitting,
}: Props) {
  const rows = useMemo(() => rollupVendors(branches), [branches]);
  const namedRows = rows.filter((r) => r.hasName);
  const unnamedCount = rows.length - namedRows.length;
  const branchCount = branches.filter((b) => b.name.trim().length > 0).length || branches.length;
  const totalFiles = rows.reduce((n, r) => n + r.fileCount, 0);

  const [expanded, setExpanded] = useState<string | null>(
    namedRows[0]?.key ?? null
  );

  return (
    <div
      className="flex flex-col"
      style={{ background: T.cream, color: T.ink }}
    >
      <div style={{ padding: "32px 56px 0" }}>
        <div
          className="flex items-end justify-between mb-6"
          style={{ flexWrap: "wrap", gap: 24 }}
        >
          <div>
            <div
              className="uppercase"
              style={{
                fontSize: 11,
                color: T.muted,
                letterSpacing: "0.18em",
                marginBottom: 6,
              }}
            >
              Step 3 — Review
            </div>
            <h1
              className="font-playfair m-0"
              style={{
                fontSize: 38,
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                color: T.ink,
              }}
            >
              Here's what we{" "}
              <em style={{ color: T.amber, fontStyle: "italic" }}>captured</em>
            </h1>
            <p
              className="mt-2.5"
              style={{
                fontSize: 14,
                color: T.muted,
                lineHeight: 1.55,
                maxWidth: 600,
              }}
            >
              Click any vendor to expand. Items extracted from your POs will
              appear here once parsing finishes — for now, we'll register each
              vendor under your account.
            </p>
          </div>
          <div className="flex gap-5 pb-1">
            {[
              [branchCount, "branches"],
              [namedRows.length, "vendors"],
              [totalFiles, "files"],
            ].map(([n, l]) => (
              <div key={l} className="text-right">
                <div
                  className="font-playfair"
                  style={{
                    fontSize: 28,
                    color: T.ink,
                    lineHeight: 1,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {n}
                </div>
                <div
                  className="uppercase mt-1"
                  style={{
                    fontSize: 11,
                    color: T.muted,
                    letterSpacing: "0.12em",
                  }}
                >
                  {l}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="flex flex-col"
          style={{
            background: T.surface,
            border: `1px solid ${T.line}`,
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                className="uppercase"
                style={{
                  background: "hsl(37 47% 98%)",
                  borderBottom: `1px solid ${T.line}`,
                  fontSize: 10.5,
                  color: T.muted,
                  letterSpacing: "0.14em",
                }}
              >
                <th style={{ padding: "11px 16px", width: 28 }} />
                <th
                  style={{
                    padding: "11px 12px",
                    textAlign: "left",
                    fontWeight: 500,
                  }}
                >
                  Vendor / Branch
                </th>
                <th
                  style={{
                    padding: "11px 12px",
                    textAlign: "left",
                    fontWeight: 500,
                  }}
                >
                  Files
                </th>
                <th
                  style={{
                    padding: "11px 12px",
                    textAlign: "left",
                    fontWeight: 500,
                  }}
                >
                  Category
                </th>
                <th
                  style={{
                    padding: "11px 12px",
                    textAlign: "left",
                    fontWeight: 500,
                  }}
                >
                  Status
                </th>
                <th style={{ padding: "11px 16px", width: 40 }} />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: "48px 16px",
                      textAlign: "center",
                      color: T.muted,
                      fontSize: 13,
                    }}
                  >
                    No vendors yet. Go back and add at least one vendor.
                  </td>
                </tr>
              )}
              {rows.map((row) => (
                <ReviewRow
                  key={row.key}
                  row={row}
                  expanded={expanded === row.key}
                  onToggle={() =>
                    setExpanded((cur) => (cur === row.key ? null : row.key))
                  }
                />
              ))}
            </tbody>
          </table>
          <div
            className="flex items-center justify-between"
            style={{
              padding: "14px 16px",
              borderTop: `1px dashed ${T.line}`,
            }}
          >
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 font-medium"
              style={{
                background: "transparent",
                border: "none",
                color: T.amberDk,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              <Plus size={13} /> Add another vendor
            </button>
            <span style={{ fontSize: 11.5, color: T.muted }}>
              {unnamedCount > 0
                ? `${unnamedCount} unnamed vendor${unnamedCount > 1 ? "s" : ""} will be skipped on submit`
                : "All vendors look good"}
            </span>
          </div>
        </div>
      </div>

      <div
        className="flex justify-between items-center"
        style={{
          padding: "16px 56px 18px",
          borderTop: `1px solid ${T.line}`,
        }}
      >
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 hover:underline"
          style={{
            fontSize: 13,
            color: T.muted,
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={13} /> Back
        </button>
        <button
          onClick={onSubmit}
          disabled={namedRows.length === 0 || submitting}
          className="inline-flex items-center gap-1.5 font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{
            borderRadius: 8,
            padding: "9px 18px",
            fontSize: 13,
            background: T.amber,
            color: T.cream,
            border: "none",
            cursor:
              namedRows.length === 0 || submitting ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Saving…" : "Finish setup"}
          <Check size={13} />
        </button>
      </div>
    </div>
  );
}

interface ReviewRowProps {
  row: VendorReviewRow;
  expanded: boolean;
  onToggle: () => void;
}

function ReviewRow({ row, expanded, onToggle }: ReviewRowProps) {
  const ready = row.hasName;
  return (
    <>
      <tr
        onClick={onToggle}
        style={{
          borderBottom: `1px solid ${T.lineSoft}`,
          background: expanded ? T.amberBg : "transparent",
          cursor: "pointer",
        }}
      >
        <td style={{ padding: "12px 16px", width: 28 }}>
          <span style={{ display: "inline-flex", color: T.muted }}>
            {expanded ? (
              <ChevronDown size={13} />
            ) : (
              <ChevronRight size={13} />
            )}
          </span>
        </td>
        <td style={{ padding: "12px 12px" }}>
          <div style={{ fontSize: 13.5, fontWeight: 500, color: T.ink }}>
            {row.name}
          </div>
          {row.branches.length > 0 && (
            <div
              style={{ fontSize: 11, color: T.muted, marginTop: 2 }}
            >
              {row.branches.join(" · ")}
            </div>
          )}
        </td>
        <td
          style={{
            padding: "12px 12px",
            fontSize: 12.5,
            color: T.muted,
            fontFamily: '"JetBrains Mono", monospace',
          }}
        >
          {row.fileCount === 0
            ? "—"
            : `${row.fileCount} file${row.fileCount > 1 ? "s" : ""}`}
        </td>
        <td style={{ padding: "12px 12px", fontSize: 12.5, color: T.muted }}>
          {row.category || "—"}
        </td>
        <td style={{ padding: "12px 12px" }}>
          <span
            className="inline-flex items-center gap-1"
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: ready ? T.leaf : T.amberDk,
              background: ready ? T.leafLt : T.amberLt,
              padding: "3px 9px",
              borderRadius: 99,
            }}
          >
            {ready ? <Check size={11} /> : <AlertTriangle size={11} />}
            {ready ? "Ready" : "Needs name"}
          </span>
        </td>
        <td style={{ padding: "12px 16px", textAlign: "right" }}>
          <span
            style={{
              display: "inline-flex",
              color: T.muted,
              padding: 4,
            }}
          >
            <Pencil size={13} />
          </span>
        </td>
      </tr>
      {expanded && (
        <tr style={{ background: T.amberBg, borderBottom: `1px solid ${T.lineSoft}` }}>
          <td colSpan={6} style={{ padding: "0 16px 14px 50px" }}>
            <div
              className="uppercase"
              style={{
                fontSize: 11,
                color: T.muted,
                letterSpacing: "0.16em",
                padding: "10px 0",
              }}
            >
              {row.fileCount > 0
                ? `${row.fileCount} file${row.fileCount > 1 ? "s" : ""} pending parse`
                : "No files uploaded — vendor will be added without an item list"}
            </div>
            <div
              style={{
                background: T.surface,
                border: `1px solid ${T.line}`,
                borderRadius: 8,
                padding: "16px 14px",
                fontSize: 12.5,
                color: T.muted,
                lineHeight: 1.55,
              }}
            >
              {row.fileCount > 0 ? (
                <>
                  We'll extract products, prices and ordering frequency from
                  your POs in the background. You can edit any item later from
                  <strong style={{ color: T.inkSoft }}> My Products</strong>.
                </>
              ) : (
                <>
                  This vendor will be created under your account. You can drop
                  POs anytime from
                  <strong style={{ color: T.inkSoft }}> My Suppliers</strong>{" "}
                  to populate the catalogue.
                </>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
