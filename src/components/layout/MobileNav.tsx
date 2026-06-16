
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import FadeInSection from "@/components/ui/FadeInSection";

interface MobileNavProps {
  links: { path: string; label: string }[];
}

const MobileNav: React.FC<MobileNavProps> = ({ links }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (isOpen && !target.closest('[data-mobile-nav="true"]')) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const isActive = (path: string) => {
    if (path === "" && location.pathname === "/") return true;
    return location.pathname === path;
  };

  return (
    <div data-mobile-nav="true" className="md:hidden">
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-50 p-2 text-gray-700"
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Side Navigation Menu - Changed from right to left */}
      <div
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-[280px] bg-white shadow-xl transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-[-100%]"
        )}
      >
        <div className="flex h-full flex-col overflow-y-auto">
          {/* Menu Header */}
          <div className="flex items-center justify-between border-b border-gray-100 p-4">
            <Link to="/" className="flex items-center" onClick={() => setIsOpen(false)}>
              <img
                src="/logo_header.png"
                alt="FarmAze Logo"
                className="h-8 w-auto"
              />
            </Link>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-gray-700"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* Menu Links */}
          <nav className="flex-1 p-4">
            <ul className="space-y-4">
              {links.map((link, index) => (
                <FadeInSection 
                  key={link.path} 
                  delay={index * 100}
                  direction="left"
                >
                  <li>
                    <Link
                      to={link.path || "/"}
                      className={cn(
                        "block rounded-md px-4 py-2 font-medium transition-colors",
                        isActive(link.path)
                          ? "bg-[#F26075]/10 text-[#F26075]"
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      {link.label}
                    </Link>
                  </li>
                </FadeInSection>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default MobileNav;
