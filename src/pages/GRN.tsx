/**
 * GRN — Goods Received Note
 * Standalone delivery verification page. Mobile-first (done at the door).
 * Auto-saves draft to localStorage. Works without backend — submits when API lands.
 *
 * Route: /grn/:orderId?
 * Linked from: Orders page "Record Delivery" button
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, CheckCircle2, AlertTriangle, Minus, Plus,
  Save, ClipboardCheck, Package, FileText,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import orderApi from "@/api/orderApi";

// ── Design tokens (matches Today / PendingConfirmations) ───────────────────
const C = {
  bg:       "hsl(37 47% 96%)",
  card:     "#fff",
  border:   "hsl(37 20% 88%)",
  text:     "hsl(20 45% 12%)",
  muted:    "hsl(20 20% 48%)",
  green:    "#16A34A",
  greenBg:  "#DCFCE7",
  amber:    "#D97706",
  amberBg:  "#FEF3C7",
  red:      "#DC2626",
  redBg:    "#FEE2E2",
  cta:      "hsl(33 65% 46%)",
};

const DRAFT_KEY_PREFIX = "farmaze_grn_draft_";
const RECORDS_KEY      = "farmaze_grn_records";

// ── Types ──────────────────────────────────────────────────────────────────
interface GRNItem {
  id:           string;   // React key / state identity (order_item_id or fallback)
  productId:    string;   // actual product UUID — sent to API as product_id
  orderItemId:  string;   // order_item_id FK — sent to API as order_item_id
  name:         string;
  unit:         string;
  ordered:      number;
  received:     number;
  note:         string;   // substitution / short reason
}

interface GRNDraft {
  orderId:    string;
  orderNumber:string;
  vendorName: string;
  savedAt:    string;
  items:      GRNItem[];
  generalNote:string;
}

// ── Qty stepper ────────────────────────────────────────────────────────────
function QtyStepper({
  value, unit, max, onChange,
}: { value: number; unit: string; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        className="h-8 w-8 rounded-lg border flex items-center justify-center text-lg font-light transition-colors hover:bg-stone-50 active:bg-stone-100"
        style={{ borderColor: C.border, color: C.text }}
      >
        −
      </button>
      <span
        className="text-[15px] font-semibold w-14 text-center tabular-nums"
        style={{ color: C.text }}
      >
        {value}<span className="text-[11px] font-normal ml-0.5" style={{ color: C.muted }}>{unit}</span>
      </span>
      <button
        onClick={() => onChange(Math.min(max * 2, value + 1))}
        className="h-8 w-8 rounded-lg border flex items-center justify-center text-lg font-light transition-colors hover:bg-stone-50 active:bg-stone-100"
        style={{ borderColor: C.border, color: C.text }}
      >
        +
      </button>
    </div>
  );
}

// ── Item row ───────────────────────────────────────────────────────────────
function ItemRow({
  item,
  onReceivedChange,
  onNoteChange,
}: {
  item: GRNItem;
  onReceivedChange: (id: string, v: number) => void;
  onNoteChange: (id: string, note: string) => void;
}) {
  const diff = item.received - item.ordered;
  const isShort   = diff < 0;
  const isOver    = diff > 0;
  const isExact   = diff === 0;

  const statusBg    = isShort ? C.redBg  : isOver ? C.amberBg : C.greenBg;
  const statusColor = isShort ? C.red    : isOver ? C.amber   : C.green;
  const statusLabel = isShort ? `Short ${Math.abs(diff)}${item.unit}`
                   : isOver  ? `+${diff}${item.unit} extra`
                   : "Exact ✓";

  return (
    <div
      className="rounded-xl p-4 mb-2.5 transition-all"
      style={{ background: C.card, border: `1px solid ${C.border}` }}
    >
      {/* Item name + status pill */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[14px] font-semibold" style={{ color: C.text }}>{item.name}</p>
          <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>
            Ordered: <strong>{item.ordered}{item.unit}</strong>
          </p>
        </div>
        <span
          className="text-[11px] font-semibold px-2.5 py-1 rounded-full ml-2 shrink-0"
          style={{ background: statusBg, color: statusColor }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Received qty stepper */}
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-medium" style={{ color: C.muted }}>Received</p>
        <QtyStepper
          value={item.received}
          unit={item.unit}
          max={item.ordered}
          onChange={(v) => onReceivedChange(item.id, v)}
        />
      </div>

      {/* Note field — show when there's a variance */}
      {(isShort || isOver || item.note) && (
        <div className="mt-3">
          <input
            type="text"
            value={item.note}
            onChange={(e) => onNoteChange(item.id, e.target.value)}
            placeholder={isShort ? "Reason for short supply..." : "Note (optional)"}
            className="w-full text-[12px] rounded-lg px-3 py-2 outline-none"
            style={{
              background: isShort ? C.redBg : C.amberBg,
              border: `1px solid ${isShort ? "#FECACA" : "#FDE68A"}`,
              color: C.text,
            }}
          />
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function GRN() {
  const { orderId } = useParams<{ orderId?: string }>();
  const navigate    = useNavigate();

  const [items, setItems]             = useState<GRNItem[]>([]);
  const [generalNote, setGeneralNote] = useState("");
  const [orderNumber, setOrderNumber] = useState(orderId ? `#${orderId.slice(-6).toUpperCase()}` : "");
  const [vendorName, setVendorName]   = useState("Vendor");
  const [isLoading, setIsLoading]     = useState(!!orderId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftKey = `${DRAFT_KEY_PREFIX}${orderId ?? "manual"}`;

  // ── Load order or restore draft ────────────────────────────────────────
  useEffect(() => {
    const savedDraft = localStorage.getItem(draftKey);

    if (orderId) {
      // Try to load real order from API
      (async () => {
        try {
          const [order, orderItems] = await Promise.all([
            orderApi.getOrderById(orderId),
            orderApi.getOrderItems(orderId, undefined, true),
          ]);
          const mapped: GRNItem[] = orderItems.map((p) => ({
            id:          p.id || String(Math.random()),
            productId:   p.product_id,
            orderItemId: p.id,
            name:        p.product_name,
            unit:        p.unit || "kg",
            ordered:     p.quantity,
            received:    p.quantity, // default: full delivery
            note:        "",
          }));
          setItems(mapped);
          setOrderNumber(order.order_number || `#${orderId.slice(-6).toUpperCase()}`);
          setVendorName(order.supplier_name || "Vendor");

          // Overlay saved draft if exists
          if (savedDraft) {
            try {
              const draft: GRNDraft = JSON.parse(savedDraft);
              if (draft.items?.length) {
                setItems(draft.items);
                setGeneralNote(draft.generalNote || "");
                toast.info("Draft restored — continue where you left off");
              }
            } catch { /* ignore corrupt draft */ }
          }
        } catch {
          // API failed — try draft or show empty
          if (savedDraft) {
            try {
              const draft: GRNDraft = JSON.parse(savedDraft);
              setItems(draft.items || []);
              setGeneralNote(draft.generalNote || "");
              setOrderNumber(draft.orderNumber || orderNumber);
              setVendorName(draft.vendorName || "Vendor");
              toast.info("Draft restored — continue where you left off");
            } catch { /* ignore */ }
          }
        } finally {
          setIsLoading(false);
        }
      })();
    } else {
      // Manual GRN (no orderId) — restore draft if exists
      if (savedDraft) {
        try {
          const draft: GRNDraft = JSON.parse(savedDraft);
          setItems(draft.items || []);
          setGeneralNote(draft.generalNote || "");
          toast.info("Draft restored — continue where you left off");
        } catch { /* ignore */ }
      } else {
        // Start with a blank row
        setItems([{
          id: "manual-1", productId: "", orderItemId: "", name: "", unit: "kg",
          ordered: 1, received: 1, note: "",
        }]);
      }
      setIsLoading(false);
    }
  }, [orderId]);

  // ── Auto-save draft ────────────────────────────────────────────────────
  const saveDraft = useCallback(() => {
    if (items.length === 0) return;
    const draft: GRNDraft = {
      orderId:     orderId ?? "manual",
      orderNumber,
      vendorName,
      savedAt:     new Date().toISOString(),
      items,
      generalNote,
    };
    localStorage.setItem(draftKey, JSON.stringify(draft));
  }, [items, generalNote, orderId, orderNumber, vendorName, draftKey]);

  useEffect(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(saveDraft, 800);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [items, generalNote, saveDraft]);

  // ── Handlers ──────────────────────────────────────────────────────────
  const updateReceived = (id: string, v: number) =>
    setItems(prev => prev.map(it => it.id === id ? { ...it, received: v } : it));

  const updateNote = (id: string, note: string) =>
    setItems(prev => prev.map(it => it.id === id ? { ...it, note } : it));

  const handleSubmit = async () => {
    if (!orderId) {
      toast.error("No order ID — cannot save GRN");
      return;
    }
    setIsSubmitting(true);
    try {
      await orderApi.recordGRN(orderId, {
        general_note: generalNote,
        items: items.map(it => ({
          order_item_id: it.orderItemId,
          product_id:    it.productId,
          product_name:  it.name,
          unit:          it.unit,
          ordered_qty:   it.ordered,
          received_qty:  it.received,
          note:          it.note,
        })),
      });

      // Clear draft
      localStorage.removeItem(draftKey);

      setSubmitted(true);
      toast.success("Delivery recorded", { description: `${orderNumber} saved successfully` });
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409) {
        toast.error("Delivery already recorded for this order", { description: "Navigate to Variance to view it" });
        navigate("/variance");
        return;
      }
      toast.error("Failed to save — draft kept");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Summary stats ──────────────────────────────────────────────────────
  const shortItems  = items.filter(i => i.received < i.ordered).length;
  const exactItems  = items.filter(i => i.received === i.ordered).length;
  const totalItems  = items.length;

  // ── Success screen ─────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
        style={{ background: C.bg }}
      >
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div
            className="h-16 w-16 rounded-full flex items-center justify-center"
            style={{ background: C.greenBg }}
          >
            <CheckCircle2 size={32} style={{ color: C.green }} />
          </div>
          <h1 className="text-[22px] font-bold font-playfair" style={{ color: C.text }}>
            Delivery recorded
          </h1>
          <p className="text-[13px]" style={{ color: C.muted }}>
            {orderNumber} · {shortItems > 0 ? `${shortItems} short item${shortItems > 1 ? "s" : ""} flagged` : "All items received"}
          </p>
          {shortItems > 0 && (
            <button
              onClick={() => navigate("/variance")}
              className="mt-4 w-full py-3 rounded-xl text-[14px] font-semibold text-white"
              style={{ background: C.red }}
            >
              View short supply →
            </button>
          )}
          <button
            onClick={() => navigate("/orders")}
            className={`${shortItems > 0 ? '' : 'mt-4 '}w-full py-3 rounded-xl text-[14px] font-semibold text-white`}
            style={{ background: shortItems > 0 ? C.card : C.cta, color: shortItems > 0 ? C.text : '#fff', border: shortItems > 0 ? `1px solid ${C.border}` : 'none' }}
          >
            Back to Orders
          </button>
          <button
            onClick={() => navigate("/today")}
            className="w-full py-3 rounded-xl text-[14px] font-medium border"
            style={{ borderColor: C.border, color: C.muted, background: C.card }}
          >
            View Today's Schedule
          </button>
        </div>
      </div>
    );
  }

  // ── Loading ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
        <p className="text-[13px]" style={{ color: C.muted }}>Loading order…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32" style={{ background: C.bg, color: C.text }}>
      {/* ── Header ── */}
      <div
        className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3.5 border-b"
        style={{ background: C.card, borderColor: C.border }}
      >
        <button
          onClick={() => navigate(-1)}
          className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-stone-50 transition-colors"
          style={{ border: `1px solid ${C.border}` }}
        >
          <ArrowLeft size={15} style={{ color: C.text }} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.muted }}>
            Record Delivery
          </p>
          <h1 className="text-[16px] font-bold leading-tight truncate" style={{ color: C.text }}>
            {orderNumber} · {vendorName}
          </h1>
        </div>
        {/* Auto-save indicator */}
        <div className="flex items-center gap-1.5 text-[10px]" style={{ color: C.muted }}>
          <Save size={11} />
          <span>Auto-saved</span>
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* ── Summary bar ── */}
        {totalItems > 0 && (
          <div
            className="flex items-center gap-3 rounded-xl px-4 py-3 mb-4"
            style={{ background: shortItems > 0 ? C.amberBg : C.greenBg, border: `1px solid ${shortItems > 0 ? "#FDE68A" : "#BBF7D0"}` }}
          >
            {shortItems > 0 ? (
              <AlertTriangle size={15} style={{ color: C.amber }} />
            ) : (
              <CheckCircle2 size={15} style={{ color: C.green }} />
            )}
            <p className="text-[12px] font-medium" style={{ color: shortItems > 0 ? C.amber : C.green }}>
              {shortItems > 0
                ? `${shortItems} of ${totalItems} items short — flag reason below`
                : `All ${totalItems} items accounted for`}
            </p>
            {shortItems > 0 && (
              <span className="ml-auto text-[11px]" style={{ color: C.muted }}>
                {exactItems}/{totalItems} ✓
              </span>
            )}
          </div>
        )}

        {/* ── Item rows ── */}
        {items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            onReceivedChange={updateReceived}
            onNoteChange={updateNote}
          />
        ))}

        {/* ── General note ── */}
        <div
          className="rounded-xl p-4 mt-2"
          style={{ background: C.card, border: `1px solid ${C.border}` }}
        >
          <div className="flex items-center gap-2 mb-2">
            <FileText size={13} style={{ color: C.muted }} />
            <p className="text-[12px] font-medium" style={{ color: C.muted }}>General note</p>
          </div>
          <textarea
            rows={3}
            value={generalNote}
            onChange={(e) => setGeneralNote(e.target.value)}
            placeholder="Overall delivery condition, driver name, any issues..."
            className="w-full text-[13px] bg-transparent outline-none resize-none"
            style={{ color: C.text }}
          />
        </div>
      </div>

      {/* ── Sticky footer CTA ── */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 py-4 border-t"
        style={{ background: C.card, borderColor: C.border }}
      >
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || items.length === 0}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-[14px] font-semibold text-white transition-opacity",
            (isSubmitting || items.length === 0) && "opacity-50 cursor-not-allowed"
          )}
          style={{ background: C.cta }}
        >
          <ClipboardCheck size={16} />
          {isSubmitting ? "Saving…" : `Confirm Delivery · ${totalItems} item${totalItems !== 1 ? "s" : ""}`}
        </button>
        {shortItems > 0 && (
          <p className="text-center text-[11px] mt-2" style={{ color: C.amber }}>
            {shortItems} short item{shortItems > 1 ? "s" : ""} will be flagged for follow-up
          </p>
        )}
      </div>
    </div>
  );
}
