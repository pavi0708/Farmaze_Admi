import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  User,
  LogOut,
} from "lucide-react";

const Footer = () => {
  const { user, isLoggedIn, logout } = useAuth();

  const homeLink = isLoggedIn ? "/smart-order" : "/";
  return (
    <footer className="bg-muted/50 pt-16 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div>
            <Link to={homeLink} className="flex items-center">
              <img
                src="/logo_header.png"
                alt="FarmAze Logo"
                className="h-8 w-auto"
              />
            </Link>
            <p className="text-muted-foreground mb-4 mt-4">
              B2B procurement intelligence for HoReCa. AI agents for ordering,
              forecasting and waste — built for Indian kitchens.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://www.linkedin.com/company/farmaze1/"
                className="hover:text-primary transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Linkedin size={20} />
              </a>
              <a
                href="https://www.instagram.com/farmazed/"
                className="hover:text-primary transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram size={20} />
              </a>
              <a
                href="#"
                className="hover:text-primary transition-colors"
              >
                <Twitter size={20} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4 font-playfair">Agents</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/chat-order" className="text-muted-foreground hover:text-primary transition-colors">
                  Procurement
                </Link>
              </li>
              <li>
                <Link to="/insights" className="text-muted-foreground hover:text-primary transition-colors">
                  Insights
                </Link>
              </li>
              <li>
                <Link to="/smart-order" className="text-muted-foreground hover:text-primary transition-colors">
                  Smart Order
                </Link>
              </li>
              <li>
                <Link to="/waste-analytics" className="text-muted-foreground hover:text-primary transition-colors">
                  Waste Intelligence
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4 font-playfair">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <a
                  href="https://www.google.com/maps/place/Farmaze/@13.1194802,80.1965603,17z/data=!3m1!4b1!4m6!3m5!1s0x3a52655cf6312ee5:0xb3c922d9ea85e666!8m2!3d13.1194802!4d80.1965603!16s%2Fg%2F11v42gnpq0?entry=ttu&g_ep=EgoyMDI1MDMxMi4wIKXMDSoJLDEwMjExNDU1SAFQAw%3D%3D"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start"
                >
                  <MapPin
                    size={20}
                    className="text-primary mt-1 mr-3 flex-shrink-0"
                  />
                  <span className="text-muted-foreground">
                    38, Palla Street, north, Padmavathy Nagar, Agraharam, Korattur, Chennai, Tamil Nadu 600076
                  </span>
                </a>
              </li>
              <li className="flex items-center">
                <a
                  href="tel:+916369724626"
                  className="flex items-center"
                >
                  <Phone
                    size={20}
                    className="text-primary mr-3 flex-shrink-0"
                  />
                  <span className="text-muted-foreground">+91 6369724626</span>
                </a>
              </li>
              <li className="flex items-center">
                <a
                  href="mailto:farmaze.official@gmail.com"
                  className="flex items-center"
                >
                  <Mail
                    size={20}
                    className="text-primary mr-3 flex-shrink-0"
                  />
                  <span className="text-muted-foreground">farmaze.official@gmail.com</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              {new Date().getFullYear()} Farmaze. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a
                href="#"
                className="text-muted-foreground text-sm hover:text-primary transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-muted-foreground text-sm hover:text-primary transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="text-muted-foreground text-sm hover:text-primary transition-colors"
              >
                Sitemap
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
