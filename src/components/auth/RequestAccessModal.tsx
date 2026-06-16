import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const WHATSAPP_NUMBER = "919150527186";

interface Props {
  onClose: () => void;
}

const RequestAccessModal = ({ onClose }: Props) => {
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !whatsapp.trim()) {
      setError("Both fields are required.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      // Fire-and-forget — don't block on DB errors, lead is captured via WhatsApp
      supabase
        .from("landing_leads" as never)
        .insert({
          contact_person: name.trim(),
          phone: whatsapp.trim(),
          source: "login_page",
          business_name: "",
          email: "",
        })
        .then(({ error: sbError }) => {
          if (sbError) console.warn("landing_leads insert failed:", sbError.message);
        });

      setDone(true);

      // Open WhatsApp after short delay so user sees the confirmation
      setTimeout(() => {
        const msg = encodeURIComponent(
          `Hi, I just requested access to Farmaze. My name is ${name.trim()}.`
        );
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
      }, 800);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div
          className="relative w-full max-w-sm rounded-2xl p-7 shadow-2xl"
          style={{ background: "hsl(37 47% 96%)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-black/5 transition-colors"
          >
            <X size={16} style={{ color: "hsl(20 20% 50%)" }} />
          </button>

          {!done ? (
            <>
              <h3
                className="font-playfair text-[22px] leading-tight"
                style={{ color: "hsl(20 45% 12%)" }}
              >
                Request access
              </h3>
              <p
                className="mt-1.5 text-[13px] font-rubik"
                style={{ color: "hsl(20 20% 50%)" }}
              >
                We'll set you up within 48 hours.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label
                    className="block text-[12px] font-medium mb-1.5"
                    style={{ color: "hsl(20 30% 35%)" }}
                  >
                    Your name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ravi Kumar"
                    className="w-full rounded-lg px-3.5 py-2.5 text-[13px] outline-none transition-colors"
                    style={{
                      background: "hsl(37 30% 90%)",
                      border: "1px solid hsl(37 20% 82%)",
                      color: "hsl(20 45% 12%)",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "hsl(33 65% 46%)")}
                    onBlur={(e) => (e.target.style.borderColor = "hsl(37 20% 82%)")}
                  />
                </div>

                <div>
                  <label
                    className="block text-[12px] font-medium mb-1.5"
                    style={{ color: "hsl(20 30% 35%)" }}
                  >
                    WhatsApp number
                  </label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-lg px-3.5 py-2.5 text-[13px] outline-none transition-colors"
                    style={{
                      background: "hsl(37 30% 90%)",
                      border: "1px solid hsl(37 20% 82%)",
                      color: "hsl(20 45% 12%)",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "hsl(33 65% 46%)")}
                    onBlur={(e) => (e.target.style.borderColor = "hsl(37 20% 82%)")}
                  />
                </div>

                {error && (
                  <p className="text-[12px] text-red-600">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg py-2.5 text-[13px] font-semibold transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{
                    background: "hsl(33 65% 46%)",
                    color: "hsl(37 47% 96%)",
                  }}
                >
                  {loading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : null}
                  {loading ? "Submitting…" : "Request access"}
                </button>
              </form>
            </>
          ) : (
            <div className="py-4 text-center">
              <div
                className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-xl"
                style={{ background: "hsl(145 40% 32% / 0.12)" }}
              >
                ✅
              </div>
              <h3
                className="font-playfair text-[20px]"
                style={{ color: "hsl(20 45% 12%)" }}
              >
                Request received!
              </h3>
              <p
                className="mt-2 text-[13px] font-rubik"
                style={{ color: "hsl(20 20% 50%)" }}
              >
                Opening WhatsApp so you can reach us directly…
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default RequestAccessModal;
