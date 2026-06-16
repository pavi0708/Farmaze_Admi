/**
 * QuickReorderStrip — "Order what we ordered last time" strip
 * Shows the most recent order per branch and lets the user add all items to the current order list.
 * Seeds from localStorage key: farmaze_quick_reorder
 */

import React, { useEffect, useState } from 'react';
import { RotateCcw, ChevronRight, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'farmaze_quick_reorder';

interface ReorderItem {
  name: string;
  qty: number;
  unit: string;
  productId?: string;
}

interface LastOrder {
  branchId:    string;
  branchName:  string;
  date:        string;   // ISO string
  daysAgo:     number;
  items:       ReorderItem[];
  vendorName?: string;
}

interface QuickReorderStripProps {
  branchId:   string | null;
  branchName?: string;
  onAddItems: (items: ReorderItem[]) => void;
}

function getDaysAgo(dateStr: string): number {
  const then = new Date(dateStr);
  const now  = new Date();
  return Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
}

export function seedQuickReorderDemo(branchId: string, branchName: string) {
  let existing: Record<string, LastOrder> = {};
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    // Guard: old format was an array — reset to empty object
    existing = Array.isArray(raw) ? {} : (raw as Record<string, LastOrder>);
  } catch { existing = {}; }
  if (existing[branchId]) return; // already seeded
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  existing[branchId] = {
    branchId,
    branchName,
    date:      twoDaysAgo.toISOString(),
    daysAgo:   2,
    items: [
      { name: 'Tomato (Bangalore)', qty: 5,  unit: 'kg' },
      { name: 'Onion (medium)',     qty: 8,  unit: 'kg' },
      { name: 'Milk (full cream)',  qty: 24, unit: 'L'  },
      { name: 'Curd',              qty: 8,  unit: 'kg' },
      { name: 'Curry leaves',      qty: 1,  unit: 'kg' },
    ],
    vendorName: 'Anbu Fresh + Senthil Dairy',
  } as LastOrder;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

const QuickReorderStrip: React.FC<QuickReorderStripProps> = ({ branchId, onAddItems, branchName }) => {
  const [lastOrder, setLastOrder] = useState<LastOrder | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded]   = useState(false);
  const [added, setAdded]         = useState(false);

  useEffect(() => {
    if (!branchId) return;
    // Seed demo data if empty — use real branch name
    seedQuickReorderDemo(branchId, branchName || branchId);
    const store = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const order: LastOrder | undefined = store[branchId];
    if (order) {
      setLastOrder({ ...order, daysAgo: getDaysAgo(order.date) });
    }
  }, [branchId, branchName]);

  if (!lastOrder || dismissed) return null;

  const itemPreview = lastOrder.items.slice(0, 3).map(i => i.name.split(' ')[0]).join(', ');
  const moreCount   = Math.max(0, lastOrder.items.length - 3);

  return (
    <div className="mx-0 mb-2 rounded-xl overflow-hidden border border-primary/20 bg-primary/5">
      {/* Main row */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <RotateCcw size={13} className="text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-medium text-foreground truncate">
            Last order · {lastOrder.daysAgo}d ago
          </p>
          <p className="text-[10px] text-muted-foreground truncate">
            {itemPreview}{moreCount > 0 ? ` +${moreCount} more` : ''}
            {lastOrder.vendorName ? ` · ${lastOrder.vendorName}` : ''}
          </p>
        </div>
        <button
          onClick={() => setExpanded(v => !v)}
          className="text-[11px] text-primary font-medium flex items-center gap-0.5 shrink-0"
        >
          {expanded ? 'Hide' : 'See all'}
          <ChevronRight size={11} className={cn('transition-transform', expanded && 'rotate-90')} />
        </button>
        <button
          onClick={() => {
            if (added) return;
            onAddItems(lastOrder.items);
            setAdded(true);
            setTimeout(() => setAdded(false), 2000);
          }}
          className={cn(
            "ml-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold shrink-0 transition-colors flex items-center gap-1",
            added
              ? "bg-green-600 text-white cursor-default"
              : "bg-primary text-white hover:bg-primary/90"
          )}
        >
          {added ? <><Check size={10} /> Added</> : 'Reorder'}
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="ml-0.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={12} />
        </button>
      </div>

      {/* Expanded items */}
      {expanded && (
        <div className="border-t border-primary/10 px-3 py-2 space-y-1">
          {lastOrder.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-[12px]">
              <span className="text-foreground">{item.name}</span>
              <span className="text-muted-foreground font-medium tabular-nums">
                {item.qty} {item.unit}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuickReorderStrip;
