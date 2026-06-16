import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Image as ImageIcon,
  MessageCircle,
  Plus,
  Sheet as SheetIcon,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { T } from "./tokens";

export type FileKind = "zip" | "sheet" | "pdf" | "image" | "other";
export type VendorStatus = "empty" | "reading" | "ready";

export interface VendorFile {
  id: string;
  name: string;
  kind: FileKind;
}

export interface OnboardingVendor {
  id: string;
  name: string;
  category: string;
  files: VendorFile[];
  status: VendorStatus;
}

export interface OnboardingBranch {
  id: string;
  name: string;
  address: string;
  vendors: OnboardingVendor[];
}

interface Props {
  branches: OnboardingBranch[];
  onChange: (branches: OnboardingBranch[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const SHEET_EXT = new Set(["csv", "xls", "xlsx", "ods", "tsv"]);
const IMAGE_EXT = new Set(["png", "jpg", "jpeg", "heic", "webp", "gif"]);

function classifyFile(name: string): FileKind {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "zip") return "zip";
  if (SHEET_EXT.has(ext)) return "sheet";
  if (ext === "pdf") return "pdf";
  if (IMAGE_EXT.has(ext)) return "image";
  return "other";
}

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

function emptyVendor(): OnboardingVendor {
  return { id: newId(), name: "", category: "", files: [], status: "empty" };
}

function emptyBranch(): OnboardingBranch {
  return {
    id: newId(),
    name: "",
    address: "",
    vendors: [emptyVendor()],
  };
}

export function buildInitialBranches(): OnboardingBranch[] {
  return [emptyBranch()];
}

export default function ManualUploadStep({
  branches,
  onChange,
  onNext,
  onBack,
}: Props) {
  const totalBranches = branches.length;
  const totalVendors = branches.reduce((n, b) => n + b.vendors.length, 0);
  const totalFiles = branches.reduce(
    (n, b) => n + b.vendors.reduce((m, v) => m + v.files.length, 0),
    0
  );
  const stillReading = branches.some((b) =>
    b.vendors.some((v) => v.status === "reading")
  );

  const updateBranch = (
    branchId: string,
    fn: (b: OnboardingBranch) => OnboardingBranch
  ) => {
    onChange(branches.map((b) => (b.id === branchId ? fn(b) : b)));
  };

  const updateVendor = (
    branchId: string,
    vendorId: string,
    fn: (v: OnboardingVendor) => OnboardingVendor
  ) => {
    updateBranch(branchId, (b) => ({
      ...b,
      vendors: b.vendors.map((v) => (v.id === vendorId ? fn(v) : v)),
    }));
  };

  const removeVendor = (branchId: string, vendorId: string) => {
    updateBranch(branchId, (b) => ({
      ...b,
      vendors: b.vendors.filter((v) => v.id !== vendorId),
    }));
  };

  const addVendor = (branchId: string) => {
    updateBranch(branchId, (b) => ({
      ...b,
      vendors: [...b.vendors, emptyVendor()],
    }));
  };

  const addBranch = () => onChange([...branches, emptyBranch()]);

  const removeBranch = (branchId: string) => {
    if (branches.length === 1) {
      toast("Add another branch first if you want to remove this one.");
      return;
    }
    onChange(branches.filter((b) => b.id !== branchId));
  };

  const handleFiles = (
    branchId: string,
    vendorId: string,
    fileList: FileList | null
  ) => {
    if (!fileList || fileList.length === 0) return;
    const incoming: VendorFile[] = Array.from(fileList).map((f) => ({
      id: newId(),
      name: f.name,
      kind: classifyFile(f.name),
    }));
    updateVendor(branchId, vendorId, (v) => ({
      ...v,
      files: [...v.files, ...incoming],
      status: "reading",
    }));
  };

  return (
    <div
      className="flex flex-col"
      style={{ background: T.cream, color: T.ink }}
    >
      <div style={{ padding: "28px 56px 0" }}>
        <div
          className="flex items-end justify-between gap-8 mb-5"
          style={{ flexWrap: "wrap" }}
        >
          <div className="max-w-[720px]">
            <div className="flex items-center gap-3.5 mb-2">
              <div
                className="text-[11px] uppercase"
                style={{
                  color: T.muted,
                  letterSpacing: "0.18em",
                }}
              >
                Step 2 · Branches → Vendors → POs
              </div>
              <span
                className="inline-block w-1 h-1 rounded-full"
                style={{ background: T.line }}
              />
              <button
                onClick={() =>
                  toast("Chat-based setup is coming soon — using manual for now.")
                }
                className="inline-flex items-center gap-1.5 rounded-full font-medium transition-opacity hover:opacity-80"
                style={{
                  padding: "5px 12px",
                  background: "white",
                  border: `1px solid ${T.line}`,
                  color: T.amberDk,
                  fontSize: 12,
                }}
              >
                <MessageCircle size={12} />
                Rather talk it through?
                <ArrowRight size={11} />
              </button>
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
              Drop a month of{" "}
              <em style={{ color: T.amber, fontStyle: "italic" }}>POs</em> for
              each vendor
            </h1>
            <p
              className="mt-3"
              style={{
                fontSize: 14,
                color: T.muted,
                lineHeight: 1.55,
                maxWidth: 640,
              }}
            >
              A whole-month zip, a folder of sheets and PDFs, or a roll of
              WhatsApp screenshots — Farmaze reads them all and reconstructs
              each vendor's catalogue, prices and ordering rhythm.
            </p>
          </div>

          <div className="flex gap-6 pb-1">
            {[
              [totalBranches, "branches"],
              [totalVendors, "vendors"],
              [totalFiles, "files"],
            ].map(([n, l]) => (
              <div key={l} className="text-right">
                <div
                  className="font-playfair"
                  style={{
                    fontSize: 30,
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
                    fontSize: 10.5,
                    color: T.muted,
                    letterSpacing: "0.14em",
                  }}
                >
                  {l}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 pb-1">
          {branches.map((b) => (
            <BranchCard
              key={b.id}
              branch={b}
              canRemove={branches.length > 1}
              onRemove={() => removeBranch(b.id)}
              onUpdate={(fn) => updateBranch(b.id, fn)}
              onAddVendor={() => addVendor(b.id)}
              onUpdateVendor={(vendorId, fn) =>
                updateVendor(b.id, vendorId, fn)
              }
              onRemoveVendor={(vendorId) => removeVendor(b.id, vendorId)}
              onFiles={(vendorId, files) =>
                handleFiles(b.id, vendorId, files)
              }
            />
          ))}

          <button
            onClick={addBranch}
            className="flex items-center justify-center gap-2 transition-colors hover:bg-black/5"
            style={{
              padding: "16px 20px",
              background: "transparent",
              border: `1.5px dashed ${T.line}`,
              borderRadius: 14,
              color: T.muted,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            <Plus size={13} /> Add another branch
          </button>
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
          style={{ fontSize: 13, color: T.muted, background: "none", border: "none", cursor: "pointer" }}
        >
          <ArrowLeft size={13} /> Back
        </button>
        <div className="flex items-center gap-3.5">
          {stillReading && (
            <span style={{ fontSize: 11.5, color: T.muted }}>
              Still parsing some files — review unlocks shortly
            </span>
          )}
          <button
            onClick={onNext}
            disabled={totalVendors === 0}
            className="inline-flex items-center gap-1.5 font-semibold transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{
              borderRadius: 8,
              padding: "9px 18px",
              fontSize: 13,
              background: T.amber,
              color: T.cream,
              border: "none",
              cursor: totalVendors === 0 ? "not-allowed" : "pointer",
            }}
          >
            Review extracted data <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Branch card ───────────────────────────────────────────────────────────
interface BranchCardProps {
  branch: OnboardingBranch;
  canRemove: boolean;
  onRemove: () => void;
  onUpdate: (fn: (b: OnboardingBranch) => OnboardingBranch) => void;
  onAddVendor: () => void;
  onUpdateVendor: (
    vendorId: string,
    fn: (v: OnboardingVendor) => OnboardingVendor
  ) => void;
  onRemoveVendor: (vendorId: string) => void;
  onFiles: (vendorId: string, files: FileList | null) => void;
}

function BranchCard({
  branch,
  canRemove,
  onRemove,
  onUpdate,
  onAddVendor,
  onUpdateVendor,
  onRemoveVendor,
  onFiles,
}: BranchCardProps) {
  const totalFiles = branch.vendors.reduce((n, v) => n + v.files.length, 0);
  const totalVendors = branch.vendors.length;

  return (
    <div
      style={{
        background: T.surface,
        border: `1px solid ${T.line}`,
        borderRadius: 14,
        overflow: "hidden",
        boxShadow: "0 1px 2px rgb(0 0 0 / 0.03)",
      }}
    >
      <div
        className="flex items-center gap-3.5"
        style={{
          padding: "16px 20px",
          background:
            "linear-gradient(180deg, hsl(37 47% 99%) 0%, hsl(37 47% 97%) 100%)",
          borderBottom: `1px solid ${T.line}`,
        }}
      >
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: T.ink,
            color: "white",
          }}
        >
          <BranchGlyph size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <input
            value={branch.name}
            placeholder="Branch name (e.g. Tiffin Shastra · T. Nagar)"
            onChange={(e) =>
              onUpdate((b) => ({ ...b, name: e.target.value }))
            }
            className="block w-full bg-transparent border-0 outline-none p-0 font-medium"
            style={{
              fontSize: 15,
              color: T.ink,
              letterSpacing: "-0.005em",
            }}
          />
          <input
            value={branch.address}
            placeholder="Address · covers · meal types"
            onChange={(e) =>
              onUpdate((b) => ({ ...b, address: e.target.value }))
            }
            className="block w-full bg-transparent border-0 outline-none p-0 mt-0.5"
            style={{ fontSize: 11.5, color: T.muted }}
          />
        </div>
        <div
          className="flex gap-4 uppercase"
          style={{ fontSize: 11, color: T.muted, letterSpacing: "0.08em" }}
        >
          {[
            [totalVendors, "vendors"],
            [totalFiles, "files"],
          ].map(([n, l]) => (
            <span key={l}>
              <strong
                className="font-playfair"
                style={{
                  fontSize: 16,
                  color: T.ink,
                  fontWeight: 500,
                  letterSpacing: 0,
                  textTransform: "none",
                  marginRight: 6,
                }}
              >
                {n}
              </strong>
              {l}
            </span>
          ))}
        </div>
        <button
          onClick={onAddVendor}
          className="inline-flex items-center gap-1.5"
          style={{
            padding: "6px 12px",
            borderRadius: 999,
            fontSize: 12,
            background: "white",
            border: `1px solid ${T.line}`,
            color: T.ink,
            cursor: "pointer",
          }}
        >
          <Plus size={11} /> Add vendor
        </button>
        {canRemove && (
          <button
            onClick={onRemove}
            title="Remove branch"
            className="flex items-center justify-center hover:bg-black/5 rounded transition-colors"
            style={{
              padding: 6,
              background: "transparent",
              border: "none",
              color: T.muted,
              cursor: "pointer",
            }}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div>
        {branch.vendors.map((v) => (
          <VendorRow
            key={v.id}
            vendor={v}
            onUpdate={(fn) => onUpdateVendor(v.id, fn)}
            onRemove={() => onRemoveVendor(v.id)}
            onFiles={(files) => onFiles(v.id, files)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Vendor row ────────────────────────────────────────────────────────────
interface VendorRowProps {
  vendor: OnboardingVendor;
  onUpdate: (fn: (v: OnboardingVendor) => OnboardingVendor) => void;
  onRemove: () => void;
  onFiles: (files: FileList | null) => void;
}

function VendorRow({ vendor, onUpdate, onRemove, onFiles }: VendorRowProps) {
  // Stub the parse: 1.5s after the vendor enters "reading", flip to "ready".
  useEffect(() => {
    if (vendor.status !== "reading") return;
    const timer = window.setTimeout(() => {
      onUpdate((v) => (v.status === "reading" ? { ...v, status: "ready" } : v));
    }, 1500);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendor.status]);

  return (
    <div
      className="grid items-start"
      style={{
        gridTemplateColumns: "200px 1fr 28px",
        gap: 20,
        padding: "16px 18px",
        borderTop: `1px solid ${T.lineSoft}`,
      }}
    >
      <div>
        <input
          value={vendor.name}
          placeholder="Vendor name"
          onChange={(e) =>
            onUpdate((v) => ({ ...v, name: e.target.value }))
          }
          className="block w-full bg-transparent border-0 outline-none p-0 font-medium"
          style={{ fontSize: 14, color: T.ink, lineHeight: 1.2 }}
        />
        <input
          value={vendor.category}
          placeholder="Category & frequency"
          onChange={(e) =>
            onUpdate((v) => ({ ...v, category: e.target.value }))
          }
          className="block w-full bg-transparent border-0 outline-none p-0 mt-1 uppercase"
          style={{
            fontSize: 11,
            color: T.muted,
            letterSpacing: "0.06em",
          }}
        />
      </div>

      <div>
        {vendor.files.length === 0 ? (
          <EmptyDrop name={vendor.name || "this vendor"} onFiles={onFiles} />
        ) : (
          <VendorSummary
            vendor={vendor}
            onMore={onFiles}
            onClear={() =>
              onUpdate((v) => ({ ...v, files: [], status: "empty" }))
            }
          />
        )}
      </div>

      <button
        onClick={onRemove}
        title="Remove vendor"
        className="flex items-center justify-center hover:bg-black/5 rounded transition-colors"
        style={{
          padding: 4,
          background: "transparent",
          border: "none",
          color: T.muted,
          cursor: "pointer",
          alignSelf: "start",
          marginTop: 4,
        }}
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

// ─── Empty dropzone ────────────────────────────────────────────────────────
function EmptyDrop({
  name,
  onFiles,
}: {
  name: string;
  onFiles: (files: FileList | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        onFiles(e.dataTransfer.files);
      }}
      style={{
        border: `1.5px dashed ${T.amber}66`,
        borderRadius: 12,
        padding: "16px 18px",
        background: dragOver
          ? "rgba(217,151,87,0.12)"
          : "rgba(217,151,87,0.04)",
        display: "flex",
        alignItems: "center",
        gap: 14,
        cursor: "pointer",
        transition: "background .15s",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          onFiles(e.target.files);
          if (inputRef.current) inputRef.current.value = "";
        }}
        accept=".zip,.pdf,.csv,.xls,.xlsx,.tsv,.png,.jpg,.jpeg,.heic,.webp"
      />
      <span
        className="inline-flex items-center justify-center flex-shrink-0"
        style={{
          width: 36,
          height: 36,
          borderRadius: 9,
          background: T.amberBg,
          color: T.amberDk,
        }}
      >
        <Upload size={16} />
      </span>
      <div>
        <div style={{ color: T.ink, fontSize: 13, fontWeight: 500 }}>
          Drop or click to upload {name}'s POs
        </div>
        <div style={{ color: T.muted, fontSize: 11.5, marginTop: 2 }}>
          Whole-month{" "}
          <span style={{ color: T.inkSoft }}>.zip</span> · many sheets/PDFs at
          once · a roll of WhatsApp screenshots
        </div>
      </div>
    </div>
  );
}

// ─── Filled vendor summary ─────────────────────────────────────────────────
function VendorSummary({
  vendor,
  onMore,
  onClear,
}: {
  vendor: OnboardingVendor;
  onMore: (files: FileList | null) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const counts = vendor.files.reduce(
    (acc, f) => {
      acc[f.kind] = (acc[f.kind] || 0) + 1;
      return acc;
    },
    {} as Record<FileKind, number>
  );
  const ready = vendor.status === "ready";

  return (
    <div
      style={{
        background: "white",
        border: `1px solid ${T.line}`,
        borderRadius: 12,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          onMore(e.target.files);
          if (inputRef.current) inputRef.current.value = "";
        }}
        accept=".zip,.pdf,.csv,.xls,.xlsx,.tsv,.png,.jpg,.jpeg,.heic,.webp"
      />
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-5 flex-wrap">
          <Stat n={vendor.files.length} label="files" />
        </div>
        <span
          className="inline-flex items-center gap-1 flex-shrink-0"
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: ready ? T.leaf : T.amberDk,
            background: ready ? T.leafLt : T.amberLt,
            padding: "4px 10px",
            borderRadius: 99,
          }}
        >
          {ready ? (
            <>
              <Check size={11} /> All parsed
            </>
          ) : (
            <>
              <span
                className="inline-block"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 99,
                  background: T.amberDk,
                  animation: "pulse 1.4s ease-in-out infinite",
                }}
              />
              Reading {vendor.files.length} file
              {vendor.files.length === 1 ? "" : "s"}
            </>
          )}
        </span>
      </div>

      <div
        className="flex items-center justify-between gap-3.5"
        style={{
          paddingTop: 12,
          borderTop: `1px dashed ${T.lineSoft}`,
        }}
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          {counts.zip ? (
            <Chip color={T.amberDk} icon={<ZipGlyph size={12} />} label={`${counts.zip} zip${counts.zip > 1 ? "s" : ""}`} />
          ) : null}
          {counts.sheet ? (
            <Chip color={T.leaf} icon={<SheetIcon size={12} />} label={`${counts.sheet} sheet${counts.sheet > 1 ? "s" : ""}`} />
          ) : null}
          {counts.pdf ? (
            <Chip color={T.muted} icon={<FileText size={12} />} label={`${counts.pdf} PDF${counts.pdf > 1 ? "s" : ""}`} />
          ) : null}
          {counts.image ? (
            <Chip color={T.amberDk} icon={<ImageIcon size={12} />} label={`${counts.image} screenshot${counts.image > 1 ? "s" : ""}`} />
          ) : null}
          {counts.other ? (
            <Chip color={T.muted} icon={<FileText size={12} />} label={`${counts.other} other`} />
          ) : null}
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5"
            style={{
              padding: "5px 11px",
              borderRadius: 99,
              background: "transparent",
              border: `1px solid ${T.line}`,
              color: T.ink,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            <Plus size={11} /> Add more
          </button>
          <button
            onClick={onClear}
            className="inline-flex items-center gap-1.5"
            style={{
              padding: "5px 11px",
              borderRadius: 99,
              background: "transparent",
              border: `1px solid ${T.line}`,
              color: T.muted,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div>
      <span
        className="font-playfair"
        style={{
          fontSize: 22,
          color: T.ink,
          letterSpacing: "-0.01em",
        }}
      >
        {n}
      </span>
      <span
        className="uppercase"
        style={{
          fontSize: 11.5,
          color: T.muted,
          marginLeft: 5,
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function Chip({
  color,
  icon,
  label,
}: {
  color: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5"
      style={{
        padding: "4px 10px",
        borderRadius: 99,
        background: "hsl(37 47% 97%)",
        border: `1px solid ${T.lineSoft}`,
        fontSize: 11.5,
        color: T.inkSoft,
      }}
    >
      <span className="inline-flex" style={{ color }}>
        {icon}
      </span>
      {label}
    </span>
  );
}

// ─── Custom branch glyph (matches design SVG) ──────────────────────────────
function BranchGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l1.5-4.5A2 2 0 0 1 6.4 3h11.2a2 2 0 0 1 1.9 1.5L21 9" />
      <path d="M3 9v2a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0V9" />
      <path d="M5 13v8h14v-8" />
    </svg>
  );
}

function ZipGlyph({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M10 12h2v2h-2zM10 16h2v2h-2zM10 8h2v2h-2zM10 4h2v2h-2z" />
    </svg>
  );
}
