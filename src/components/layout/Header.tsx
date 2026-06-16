
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import CartIcon from "@/components/cart/CartIcon";
import MobileNav from "./MobileNav";
import {
  LogOut,
  Settings,
  User,
  ShoppingBag,
  ShoppingCart,
  FileText,
  Home,
  Zap,
  BarChart3,
  Headphones,
  Sparkles,
  MessageSquare,
  Package,
  IndianRupee,
  Users,
  Store,
} from "lucide-react";
import './../../Header.css'

type NavItem = {
  path: string;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
};

const Header = () => {
  const { user, isLoggedIn, logout } = useAuth();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<string>("");

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Common nav items for both authenticated and public users
  const commonNavItems: NavItem[] = [];

  // Scroll to section function — also updates hash + active state
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(`#${sectionId}`);
      window.history.replaceState(null, '', `#${sectionId}`);
    }
  };

  // Track hash changes
  useEffect(() => {
    const handleHashChange = () => setActiveSection(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    // Set initial hash
    if (window.location.hash) setActiveSection(window.location.hash);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // IntersectionObserver for auto-highlighting on scroll (public pages only)
  useEffect(() => {
    if (isLoggedIn) return;
    const sections = ['about', 'contact'];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(`#${entry.target.id}`);
          }
        });
      },
      { threshold: 0.3 }
    );
    // Delay to let DOM render
    const timer = setTimeout(() => {
      sections.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      });
    }, 500);
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, [isLoggedIn, location.pathname]);

  // Reset active section when navigating away from home
  useEffect(() => {
    if (location.pathname !== '/') setActiveSection('');
  }, [location.pathname]);

  // Public-only nav items
  const publicOnlyNavItems: NavItem[] = [
    { path: "", label: "Home" },
    { path: "#about", label: "About Us", onClick: () => scrollToSection('about') },
    { path: "#contact", label: "Contact Us", onClick: () => scrollToSection('contact') },
  ];

  const isAdmin = user?.role === 'client_admin';

  // Auth header nav: role-based items
  const authHeaderNavItems: NavItem[] = isAdmin
    ? [
        { path: "/insights", label: "Insights", icon: <Sparkles size={15} className="mr-1.5" /> },
        { path: "/dashboard", label: "Dashboard", icon: <Home size={15} className="mr-1.5" /> },
        { path: "/setup", label: "Supply Setup", icon: <Store size={15} className="mr-1.5" /> },
        { path: "/users", label: "Users", icon: <Users size={15} className="mr-1.5" /> },
      ]
    : [
        { path: "/smart-order", label: "Smart Order", icon: <Zap size={15} className="mr-1.5" /> },
        { path: "/chat-order", label: "Procurement Agent", icon: <MessageSquare size={15} className="mr-1.5" /> },
        { path: "/procurement/prices", label: "Prices", icon: <IndianRupee size={15} className="mr-1.5" /> },
        { path: "/orders", label: "Orders", icon: <ShoppingBag size={15} className="mr-1.5" /> },
        { path: "/support", label: "Support", icon: <Headphones size={15} className="mr-1.5" /> },
      ];

  // Combine nav items based on authentication status
  const navItems = isLoggedIn
    ? [...commonNavItems, ...authHeaderNavItems]
    : [...publicOnlyNavItems, ...commonNavItems];

  const isActive = (path: string) => {
    if (path.startsWith('#')) {
      return activeSection === path;
    }
    if (path === "" && location.pathname === "/" && !activeSection) return true;
    return location.pathname === path;
  };

  // Determine home link based on authentication status and role
  const homeLink = isLoggedIn
    ? (isAdmin ? "/insights" : "/smart-order")
    : "/";

  return (
    <header className="py-3 headersection">
      <div className="container mx-auto flex justify-between items-center px-4">
        <div className="flex items-center">
          {/* Mobile menu on the left */}
          {!isLoggedIn && <MobileNav links={publicOnlyNavItems} />}

          <Link to={homeLink} className="flex items-center ml-2 md:ml-0 group">
            <img
              src="/logo_header.png"
              alt="FarmAze Logo"
              className="h-7 w-auto transition-transform duration-200 group-hover:scale-105"
            />
          </Link>
        </div>

        <nav className="hidden md:flex items-center justify-center gap-1">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const linkContent = (
              <>
                {item.icon}
                {item.label}
              </>
            );

            const className = `relative px-3.5 py-2 text-[13px] font-medium transition-all duration-200 flex items-center rounded-lg ${
              active
                ? "text-primary bg-primary/[0.06]"
                : "text-[#555] hover:text-foreground hover:bg-muted/50"
            }`;

            return item.onClick ? (
              <button
                key={item.path}
                onClick={item.onClick}
                className={className}
              >
                {linkContent}
              </button>
            ) : (
              <Link
                key={item.path}
                to={item.path || "/"}
                className={className}
              >
                {linkContent}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <>
              <CartIcon />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative rounded-full h-8 w-8 p-0 hover:ring-2 hover:ring-primary/20 transition-all duration-200"
                  >
                    <Avatar className="h-8 w-8 border border-gray-200/60 shadow-sm">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg border border-gray-100/80 backdrop-blur-xl bg-white/95 p-1">
                  <div className="flex items-center justify-start gap-2 p-2.5 mx-1">
                    <div className="flex flex-col space-y-0.5 leading-none">
                      {user?.name && <p className="font-semibold text-sm">{user.name}</p>}
                      {user?.email && (
                        <p className="w-[200px] truncate text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <DropdownMenuSeparator className="mx-1 bg-gray-100" />

                  {/* Primary actions in profile dropdown */}
                  <DropdownMenuItem asChild className="rounded-lg mx-1 cursor-pointer">
                    <Link to="/invoices" className="flex items-center">
                      <FileText size={15} className="mr-2 text-muted-foreground" />
                      Invoices
                    </Link>
                  </DropdownMenuItem>
                  {/* Dashboard and Procurement removed from client profile */}
                  <DropdownMenuItem asChild className="rounded-lg mx-1 cursor-pointer">
                    <Link to="/my-products" className="flex items-center">
                      <Package size={15} className="mr-2 text-muted-foreground" />
                      My Business
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="mx-1 bg-gray-100" />

                  <DropdownMenuItem asChild className="rounded-lg mx-1 cursor-pointer">
                    <Link to="/profile" className="flex items-center">
                      <User size={15} className="mr-2 text-muted-foreground" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-lg mx-1 cursor-pointer">
                    <Link
                      to="/profile?tab=settings"
                      className="flex items-center"
                    >
                      <Settings size={15} className="mr-2 text-muted-foreground" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="mx-1 bg-gray-100" />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600 flex items-center rounded-lg mx-1 cursor-pointer"
                    onClick={handleLogout}
                  >
                    <LogOut size={15} className="mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center">
              <Link to="/login">
                <Button
                  className="bg-transparent hover:bg-black/5 text-black border border-black font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 px-5"
                >
                  Login
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
