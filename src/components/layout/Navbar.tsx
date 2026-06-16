
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const links = [
    { href: "/", label: "Home" },
    { href: "/smart-order", label: "Smart Order" },
    { href: "/orders", label: "Orders" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/inventory", label: "Inventory" },
    { href: "/reports", label: "Reports" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    // Close mobile menu when route changes
    setIsMenuOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-white/90 backdrop-blur-md shadow-sm py-2"
          : "bg-transparent py-4"
      )}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link
          to="/"
          className="relative z-10 flex items-center text-2xl font-bold"
        >
          <span className="text-farmaze-green">Farm</span>
          <span className="text-farmaze-orange">aze</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "font-medium transition-all hover:text-farmaze-green",
                location.pathname === link.href
                  ? "text-farmaze-green"
                  : "text-gray-700"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Navigation Actions */}
        <div className="hidden md:flex items-center space-x-4">
          <button className="text-gray-700 hover:text-farmaze-green transition-colors">
            <Search size={20} />
          </button>
          <Button
            variant="ghost"
            className="text-gray-700 hover:text-farmaze-green"
          >
            My Account
          </Button>
          <Button className="bg-farmaze-green hover:bg-farmaze-green/90">
            Log In
          </Button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-gray-700 z-20"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Navigation Overlay */}
        <div
          className={cn(
            "fixed inset-0 bg-white z-10 flex flex-col pt-20 px-6 transition-transform duration-300 ease-in-out md:hidden",
            isMenuOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="flex flex-col space-y-6">
            {links.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "text-xl font-medium py-2 border-b border-gray-100",
                  location.pathname === link.href
                    ? "text-farmaze-green"
                    : "text-gray-700"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-auto pb-8 pt-4 flex flex-col space-y-4">
            <Button className="w-full justify-center">
              <User size={18} className="mr-2" />
              My Account
            </Button>
            <Button className="w-full bg-farmaze-green hover:bg-farmaze-green/90">
              Log In
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
