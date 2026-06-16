/**
 * Shared chart color palette — warm amber family.
 * Use these across ALL Recharts visualizations for brand consistency.
 */

export const CHART_COLORS = {
  /** Primary amber series — use for bars, areas, pie slices */
  primary: ["#B8672B", "#D4944A", "#E8B573", "#F0C078", "#F9DEB5"] as const,

  /** Coral accent — use ONLY for comparison/highlight overlays */
  accent: "#F16870",

  /** Grid & axis colors — warm neutral tones */
  grid: "hsl(30, 23%, 88%)",
  axis: "hsl(29, 15%, 48%)",
  axisLabel: "hsl(20, 45%, 16%)",

  /** Gradient definitions */
  gradients: {
    amber: { start: "#B8672B", end: "#B8672B00" },
    coral: { start: "#F16870", end: "#F1687000" },
  },
} as const;

/** Extended palette for branch breakdowns and multi-series charts */
export const BRANCH_PALETTE = [
  "#B8672B", "#D4944A", "#F16870", "#E8B573", "#F0C078", "#F9DEB5", "#C4774A", "#D98F5A",
] as const;

/** Category donut/pie palette — all warm tones, no blue/green */
export const CATEGORY_PALETTE = [
  "#B8672B", "#D4944A", "#E8B573", "#F0C078", "#F9DEB5", "#F16870",
] as const;

export default CHART_COLORS;
