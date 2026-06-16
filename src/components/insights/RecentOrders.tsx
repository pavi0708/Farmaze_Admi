/**
 * RecentOrders — Compact list of the last 5 orders for the current client.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Loader2 } from "lucide-react";
import orderApi from "@/api/orderApi";

type Order = {
  id: string;
  created_at?: string;
  delivered_at?: string;
  total_selling_price?: number;
  total?: number;
  status?: string;
  items_count?: number;
  product_count?: number;
};

export default function RecentOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Last 30 days of orders, take top 5 most recent
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        const fmt = (d: Date) => d.toISOString().split("T")[0];
        const res = await orderApi.getOrders(fmt(start), fmt(end)).catch(() => null);
        if (cancelled) return;
        if (res) {
          const list: Order[] = Array.isArray(res)
            ? (res as Order[])
            : (res as { orders?: Order[] }).orders || [];
          const sorted = [...list].sort((a, b) => {
            const da = new Date(a.created_at || 0).getTime();
            const db = new Date(b.created_at || 0).getTime();
            return db - da;
          });
          setOrders(sorted.slice(0, 5));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const formatINR = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  const formatDate = (iso?: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  const statusColor = (s?: string) => {
    const status = (s || "").toLowerCase();
    if (status.includes("deliver") || status.includes("complet")) return "hsl(145 40% 38%)";
    if (status.includes("cancel") || status.includes("reject")) return "hsl(0 65% 48%)";
    return "hsl(33 65% 46%)";
  };

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        background: "hsl(37 47% 96%)",
        borderColor: "hsl(37 20% 85%)",
      }}
    >
      <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: "hsl(37 20% 88%)" }}>
        <h3
          className="font-playfair text-[16px]"
          style={{ color: "hsl(20 45% 12%)" }}
        >
          Recent orders
        </h3>
        <Link
          to="/orders"
          className="text-[11px] uppercase tracking-wider hover:underline"
          style={{ color: "hsl(33 65% 46%)" }}
        >
          View all
        </Link>
      </div>

      <div>
        {loading ? (
          <div className="p-6 flex items-center justify-center">
            <Loader2 size={14} className="animate-spin" style={{ color: "hsl(20 20% 50%)" }} />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-[13px]" style={{ color: "hsl(20 20% 50%)" }}>
              No orders yet
            </p>
            <Link
              to="/smart-order"
              className="mt-2 inline-block text-[12px] font-medium"
              style={{ color: "hsl(33 65% 46%)" }}
            >
              Place your first order →
            </Link>
          </div>
        ) : (
          orders.map((o, i) => (
            <Link
              key={o.id || i}
              to={`/order/${o.id}`}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/[0.02] border-b last:border-b-0"
              style={{ borderColor: "hsl(37 20% 90%)" }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium truncate" style={{ color: "hsl(20 45% 12%)" }}>
                  {formatDate(o.created_at)} · {o.items_count || o.product_count || 0} items
                </p>
                <p className="text-[11px]" style={{ color: "hsl(20 20% 50%)" }}>
                  {o.status ? <span style={{ color: statusColor(o.status) }}>● {o.status}</span> : "Pending"}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[13px] font-semibold" style={{ color: "hsl(20 45% 12%)" }}>
                  {formatINR(Number(o.total_selling_price || o.total || 0))}
                </p>
              </div>
              <ChevronRight size={14} style={{ color: "hsl(20 20% 60%)" }} />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
