/**
 * AppShell — Warm editorial sidebar layout for the Farmaze client dashboard.
 * Light cream sidebar. Identity lives only at the bottom (no duplication).
 */
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Clock,
  Inbox,
  Package,
  Truck,
  FileText,
  TriangleAlert,
  Settings,
  LogOut,
  MessageCircle,
  Menu,
  X,
  ChevronUp,
  Store,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ── Design tokens ─────────────────────────────────────────────────────────────
const S = {
  bg: "hsl(37 40% 92%)",
  activeBg: "#fff",
  border: "hsl(37 30% 84%)",
  text: "hsl(20 45% 12%)",
  muted: "hsl(20 30% 48%)",
  amber: "hsl(33 65% 46%)",
  red: "#DC2626",
};

type NavItem = {
  path: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  badge?: number;
  badgeRed?: boolean;
};

const ADMIN_NAV: NavItem[] = [
  { path: "/today",    label: "Today",    icon: Clock },
  { path: "/inbox",    label: "Inbox",    icon: Inbox,         badge: 4 },
  { path: "/orders",   label: "Orders",   icon: Package },
  { path: "/vendors",  label: "Vendors",  icon: Truck },
  { path: "/invoices", label: "Invoices", icon: FileText },
  { path: "/variance", label: "Variance", icon: TriangleAlert, badge: 2, badgeRed: true },
  { path: "/setup",    label: "Supply Setup", icon: Store },
];

const CLIENT_NAV: NavItem[] = [
  { path: "/today",        label: "Today",       icon: Clock },
  { path: "/smart-order",  label: "Smart Order", icon: Zap },
  { path: "/inbox",        label: "Inbox",       icon: Inbox,         badge: 4 },
  { path: "/orders",       label: "Orders",      icon: Package },
  { path: "/vendors",      label: "Vendors",     icon: Truck },
  { path: "/invoices",     label: "Invoices",    icon: FileText },
  { path: "/variance",     label: "Variance",    icon: TriangleAlert, badge: 2, badgeRed: true },
];

const WHATSAPP_URL = "https://wa.me/919150527186";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout, branches } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = user?.role === "client_admin" || user?.role === "admin" || user?.role === "super_admin";
  const navItems = isAdmin ? ADMIN_NAV : CLIENT_NAV;

  const businessName = user?.name || "My Restaurant";
  const username = user?.email || "";
  const roleLabel =
    user?.role === "client_admin" ? "Owner" :
    user?.role === "admin" ? "Admin" :
    user?.role === "super_admin" ? "Super Admin" :
    "Staff";
  const branchCount = branches.length;

  const initials = businessName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const SidebarInner = () => (
    <div className="flex h-full flex-col" style={{ background: S.bg, borderRight: `1px solid ${S.border}` }}>

      {/* Logo */}
      <div className="px-5 pt-7 pb-6">
        <Link to={isAdmin ? "/insights" : "/today"} onClick={() => setMobileOpen(false)}>
          <img
            src="/logo_header.png"
            alt="Farmaze"
            className="h-6 w-auto brightness-0 opacity-75"
          />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            location.pathname === item.path ||
            location.pathname.startsWith(item.path + "/");
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all",
                active ? "shadow-sm" : "hover:bg-black/5"
              )}
              style={
                active
                  ? { background: S.activeBg, color: S.text }
                  : { color: S.muted }
              }
            >
              <Icon size={15} strokeWidth={active ? 2 : 1.5} />
              <span className="flex-1">{item.label}</span>
              {item.badge != null && (
                <span
                  className="h-[18px] min-w-[18px] px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                  style={{ background: item.badgeRed ? S.red : S.amber }}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom — WhatsApp + identity menu */}
      <div className="px-3 pb-4 pt-3" style={{ borderTop: `1px solid ${S.border}` }}>
        {/* WhatsApp */}
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] transition-colors hover:bg-black/5 mb-1"
          style={{ color: "hsl(145 40% 40%)" }}
        >
          <MessageCircle size={14} strokeWidth={1.5} />
          <span>Switch to WhatsApp</span>
        </a>

        {/* Identity — triggers Settings + Logout dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left hover:bg-black/5 transition-colors outline-none">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ background: S.amber }}
              >
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold leading-tight truncate" style={{ color: S.text }}>
                  {businessName}
                </p>
                <p className="text-[10px] truncate" style={{ color: S.muted }}>
                  {username && `${username} · `}{roleLabel}
                </p>
              </div>
              <ChevronUp size={12} style={{ color: S.muted }} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-52 mb-1">
            <DropdownMenuItem
              onClick={() => { navigate("/profile"); setMobileOpen(false); }}
              className="text-[13px] gap-2"
            >
              <Settings size={13} />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-[13px] gap-2 text-red-600 focus:text-red-600"
            >
              <LogOut size={13} />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ background: "hsl(37 47% 96%)" }}>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-[220px] shrink-0 fixed h-screen">
        <SidebarInner />
      </aside>

      {/* Mobile top bar */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 h-14 border-b"
        style={{ background: S.bg, borderColor: S.border }}
      >
        <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2">
          <Menu size={20} style={{ color: S.text }} />
        </button>
        <img src="/logo_header.png" alt="Farmaze" className="h-5 w-auto brightness-0 opacity-75" />
        <div className="w-9" />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-[260px] shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-full hover:bg-black/10"
            >
              <X size={16} style={{ color: S.muted }} />
            </button>
            <SidebarInner />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-[220px] pt-14 lg:pt-0 min-w-0">
        {children}
      </main>
    </div>
  );
}
