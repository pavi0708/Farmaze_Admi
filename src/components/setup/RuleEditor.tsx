/**
 * RuleEditor — inline editor for a single order rule.
 * Renders day pills, frequency select, channel select, and cutoff input.
 */
import { useState } from "react";
import type { VendorRule } from "@/utils/onboardingTransform";

interface Props {
  rule: VendorRule;
  onSave: (updates: { days: boolean[]; perDay: string; channel: string; cutoff: string }) => void;
  onCancel: () => void;
  saving?: boolean;
}

const T = {
  bg: "hsl(37 47% 96%)",
  surface: "#fff",
  border: "hsl(37 20% 88%)",
  ink: "hsl(20 45% 12%)",
  muted: "hsl(20 20% 48%)",
  amber: "hsl(33 65% 46%)",
  amberLight: "hsl(37 70% 93%)",
};

const DAY_LETTERS = ["M", "T", "W", "T", "F", "S", "S"];
const FREQ_OPTS = ["Daily", "2× a week", "3× a week", "4× a week", "5× a week", "6× a week", "On-demand"];
const CHANNELS = ["WA text", "WA voice", "WA photo", "Email"];

function freqLimit(freq: string): number | null {
  const m = freq.match(/^(\d+)× a week$/);
  return m ? parseInt(m[1]) : null;
}

// Parse "10:30 PM previous day" → { time: "22:30", when: "previous day" }
function parseCutoff(cutoff: string): { time: string; when: string } {
  const whenMatch = cutoff.match(/previous day|same day/i);
  const when = whenMatch ? whenMatch[0].toLowerCase() : "previous day";
  const timeMatch = cutoff.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!timeMatch) return { time: "22:30", when };
  let h = parseInt(timeMatch[1]);
  const m = timeMatch[2];
  const ampm = timeMatch[3].toUpperCase();
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return { time: `${String(h).padStart(2, "0")}:${m}`, when };
}

// Format "22:30" + "previous day" → "10:30 PM previous day"
function formatCutoff(time: string, when: string): string {
  const [hStr, mStr] = time.split(":");
  let h = parseInt(hStr);
  const ampm = h >= 12 ? "PM" : "AM";
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h}:${mStr} ${ampm} ${when}`;
}

export default function RuleEditor({ rule, onSave, onCancel, saving }: Props) {
  const [days, setDays] = useState<boolean[]>(rule.days.slice());
  const [perDay, setPerDay] = useState(rule.perDay);
  const [channel, setChannel] = useState(rule.channel);
  const parsed = parseCutoff(rule.cutoff);
  const [cutoffTime, setCutoffTime] = useState(parsed.time);
  const [cutoffWhen, setCutoffWhen] = useState(parsed.when);

  const selectedCount = days.filter(Boolean).length;

  const toggleDay = (i: number) => {
    setDays(prev => {
      const next = prev.slice();
      if (next[i]) {
        next[i] = false;
        return next;
      }
      const limit = freqLimit(perDay);
      if (limit !== null && selectedCount >= limit) {
        // deselect the first currently-selected day to make room
        const firstOn = next.findIndex(v => v);
        if (firstOn >= 0) next[firstOn] = false;
      }
      next[i] = true;
      return next;
    });
  };

  const handleFreqChange = (freq: string) => {
    setPerDay(freq);
    const limit = freqLimit(freq);
    if (limit !== null) {
      setDays(prev => {
        const next = prev.slice();
        let kept = 0;
        return next.map(v => {
          if (v && kept < limit) { kept++; return true; }
          return false;
        });
      });
    }
  };

  const selectStyle: React.CSSProperties = {
    fontSize: 12,
    color: T.ink,
    border: `1px solid ${T.border}`,
    borderRadius: 6,
    padding: "3px 6px",
    background: T.surface,
    outline: "none",
  };

  return (
    <div
      className="grid items-start px-5 py-4 border-b last:border-b-0"
      style={{
        gridTemplateColumns: "1fr 1fr",
        gap: "16px",
        borderColor: T.border,
        background: T.amberLight,
      }}
    >
      {/* Left column: vendor/branch + days */}
      <div className="flex flex-col gap-3">
        <div>
          <p className="text-[13px] font-semibold" style={{ color: T.ink }}>{rule.name}</p>
          <p className="text-[11px]" style={{ color: T.muted }}>{rule.branch}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: T.muted }}>
            Order days
          </p>
          <div className="flex gap-1">
            {DAY_LETTERS.map((letter, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleDay(i)}
                className="h-7 w-7 rounded text-[10px] font-bold flex items-center justify-center transition-colors"
                style={{
                  background: days[i] ? T.amber : T.border,
                  color: days[i] ? "#fff" : T.muted,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {letter}
              </button>
            ))}
          </div>
          {freqLimit(perDay) !== null && (
            <p className="text-[10px] mt-1" style={{ color: selectedCount === freqLimit(perDay) ? T.amber : T.muted }}>
              {selectedCount} / {freqLimit(perDay)} days selected
            </p>
          )}
        </div>
      </div>

      {/* Right column: frequency, channel, cutoff, actions */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: T.muted }}>
              Frequency
            </label>
            <select value={perDay} onChange={e => handleFreqChange(e.target.value)} style={selectStyle}>
              {FREQ_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: T.muted }}>
              Channel
            </label>
            <select value={channel} onChange={e => setChannel(e.target.value)} style={selectStyle}>
              {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: T.muted }}>
            Order cutoff
          </label>
          <div className="flex gap-2">
            <input
              type="time"
              value={cutoffTime}
              onChange={e => setCutoffTime(e.target.value)}
              style={{ ...selectStyle, flex: 1 }}
            />
            <select value={cutoffWhen} onChange={e => setCutoffWhen(e.target.value)} style={selectStyle}>
              <option value="previous day">Previous day</option>
              <option value="same day">Same day</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <button
            type="button"
            disabled={saving}
            onClick={() => onSave({ days, perDay, channel, cutoff: formatCutoff(cutoffTime, cutoffWhen) })}
            className="px-4 py-1.5 rounded-lg text-[12px] font-semibold text-white transition-opacity"
            style={{ background: T.amber, opacity: saving ? 0.6 : 1 }}
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-colors"
            style={{ color: T.muted, background: T.border }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
