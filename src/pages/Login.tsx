import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import LoginForm from "@/components/auth/LoginForm";
import { useAuth } from "@/context/AuthContext";
import RequestAccessModal from "@/components/auth/RequestAccessModal";

const MARKETING_SITE = "https://farmaze.com";

// Use referrer if it's a farmaze.com domain, otherwise fall back to marketing site
const getBackUrl = (): string => {
  try {
    const ref = document.referrer;
    if (ref) {
      const url = new URL(ref);
      if (url.hostname.endsWith("farmaze.com")) return ref;
    }
  } catch {}
  return MARKETING_SITE;
};

const Login = () => {
  const { loginWithGoogle } = useAuth();
  const location = useLocation();
  const message = location.state?.message;
  const backUrl = React.useMemo(() => getBackUrl(), []);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Google login error:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex lg:w-[46%] flex-col justify-between p-10 relative overflow-hidden"
        style={{ background: "hsl(20 40% 10%)" }}
      >
        {/* Glow orbs */}
        <div className="absolute pointer-events-none"
          style={{ top: "-100px", right: "-100px", width: "500px", height: "500px", borderRadius: "50%", background: "hsl(33 60% 40% / 0.12)", filter: "blur(100px)" }} />
        <div className="absolute pointer-events-none"
          style={{ bottom: "-80px", left: "-80px", width: "400px", height: "400px", borderRadius: "50%", background: "hsl(145 40% 28% / 0.08)", filter: "blur(90px)" }} />

        {/* Top: logo + eyebrow */}
        <div className="relative">
          <a href={MARKETING_SITE} target="_blank" rel="noopener noreferrer">
            <img src="/logo_header.png" alt="Farmaze" className="h-6 w-auto brightness-0 invert opacity-90" />
          </a>
          <p className="mt-3 text-[10px] uppercase tracking-[0.24em] font-medium"
            style={{ color: "hsl(33 65% 46%)" }}>
            AI Ops Platform
          </p>
        </div>

        {/* Middle: headline + chat mockup */}
        <div className="relative flex-1 flex flex-col justify-center py-8">
          <h1 className="font-playfair leading-[1.06] tracking-tight mb-2"
            style={{ fontSize: "44px", color: "hsl(37 47% 96%)" }}>
            Put your kitchen<br />on autopilot.
          </h1>
          <p className="text-[13px] mb-8" style={{ color: "hsl(37 47% 96% / 0.45)" }}>
            Three AI agents handling procurement,<br />reviews, and insights.
          </p>

          {/* WhatsApp chat mockup */}
          <div className="rounded-2xl overflow-hidden"
            style={{ background: "hsl(20 30% 16%)", border: "1px solid hsl(37 47% 96% / 0.06)" }}>
            {/* Chat header */}
            <div className="px-4 py-3 flex items-center gap-3"
              style={{ borderBottom: "1px solid hsl(37 47% 96% / 0.05)" }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{ background: "hsl(33 65% 46%)", color: "hsl(37 47% 96%)" }}>
                FZ
              </div>
              <div>
                <p className="text-[12px] font-medium" style={{ color: "hsl(37 47% 96% / 0.9)" }}>Farmaze Agent</p>
                <p className="text-[10px]" style={{ color: "hsl(145 40% 50%)" }}>● Online</p>
              </div>
            </div>

            {/* Messages */}
            <div className="px-4 py-4 space-y-3">
              <p className="text-center text-[10px] tracking-wide"
                style={{ color: "hsl(37 47% 96% / 0.25)" }}>
                TODAY · 06:32
              </p>

              {/* Agent message */}
              <div className="flex gap-2.5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5"
                  style={{ background: "hsl(33 65% 46%)", color: "hsl(37 47% 96%)" }}>
                  FZ
                </div>
                <div className="rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-[75%]"
                  style={{ background: "hsl(20 25% 22%)" }}>
                  <p className="text-[12.5px] leading-[1.55]" style={{ color: "hsl(37 47% 96% / 0.88)" }}>
                    Good morning, Chef. Based on yesterday's covers:{" "}
                    <span style={{ color: "hsl(37 47% 96%)" }}>18kg tomato · 22kg onion · 6kg paneer</span>
                    {" · "}skip potato. Reply yes to confirm.
                  </p>
                </div>
              </div>

              {/* User reply */}
              <div className="flex justify-end">
                <div className="rounded-2xl rounded-tr-sm px-3.5 py-2 text-[12.5px] font-medium"
                  style={{ background: "hsl(145 35% 22%)", color: "hsl(37 47% 96% / 0.9)" }}>
                  yes ✅
                </div>
              </div>

              {/* Agent confirmation */}
              <div className="flex gap-2.5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5"
                  style={{ background: "hsl(33 65% 46%)", color: "hsl(37 47% 96%)" }}>
                  FZ
                </div>
                <div className="rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-[75%]"
                  style={{ background: "hsl(20 25% 22%)" }}>
                  <p className="text-[12.5px] leading-[1.55]" style={{ color: "hsl(37 47% 96% / 0.88)" }}>
                    Done. Order placed with Farmaze.{" "}
                    <span style={{ color: "hsl(37 47% 96%)" }}>Delivery tomorrow 6 AM.</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: quote */}
        <div className="relative">
          <p className="font-playfair italic text-[12px]"
            style={{ color: "hsl(37 47% 96% / 0.22)" }}>
            "Goes live in 48 hours. One WhatsApp message to cancel."
          </p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div
        className="flex-1 flex flex-col"
        style={{ background: "hsl(37 47% 96%)" }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 pt-7 lg:justify-end">
          <a href={backUrl} className="lg:hidden">
            <img src="/logo_header.png" alt="Farmaze" className="h-6 w-auto" />
          </a>
          <a href={backUrl}
            className="text-[10px] uppercase tracking-[0.2em] hover:opacity-70 transition-opacity"
            style={{ color: "hsl(20 30% 50%)" }}>
            ← Back to Website
          </a>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-8 py-8">
          <div className="w-full max-w-[340px]">
            <h2 className="font-playfair leading-[1.1]"
              style={{ fontSize: "32px", color: "hsl(20 45% 12%)" }}>
              Sign in to your{" "}
              <em className="italic" style={{ color: "hsl(33 65% 46%)" }}>account.</em>
            </h2>
            <p className="mt-2 text-[13px] font-rubik" style={{ color: "hsl(20 20% 50%)" }}>
              Welcome back — your agents are working.
            </p>

            {message && (
              <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 border border-red-100">
                <p className="text-[13px] font-medium text-red-700">{message}</p>
              </div>
            )}

            <div className="mt-7">
              <LoginForm onGoogleLogin={handleGoogleLogin} />
            </div>

            <p className="mt-6 text-center text-[12px] font-rubik" style={{ color: "hsl(20 20% 50%)" }}>
              New to Farmaze?{" "}
              <button
                onClick={() => setShowRequestModal(true)}
                className="font-semibold hover:underline bg-transparent border-0 p-0 cursor-pointer"
                style={{ color: "hsl(33 65% 46%)" }}
              >
                Request access
              </button>
            </p>

            {showRequestModal && (
              <RequestAccessModal onClose={() => setShowRequestModal(false)} />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 pb-6 text-center">
          <p className="text-[10px]" style={{ color: "hsl(20 20% 65%)" }}>
            Privacy Policy · Terms of Service · Contact Support | © 2026 Farmaze
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
