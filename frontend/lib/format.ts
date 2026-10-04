import type { FineEstimate, Severity } from "./types";

export function riskColor(score: number): string {
  if (score < 25) return "#2EC07A";
  if (score < 50) return "#E8B840";
  return "#E24B4A";
}

export const SEV_LABEL: Record<Severity, string> = { critical: "CRIT", high: "HIGH", medium: "MED", low: "LOW" };
export const SEV_CLASS: Record<Severity, string> = {
  critical: "gap-sev-crit",
  high: "gap-sev-high",
  medium: "gap-sev-med",
  low: "gap-sev-low",
};

/** Indian-grouping INR, e.g. 2500000 -> ₹25,00,000 */
export function inr(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export function fineRange(f: FineEstimate): string {
  if (f.max_total === 0) return "None estimated";
  return f.min_total === f.max_total ? inr(f.max_total) : `${inr(f.min_total)} – ${inr(f.max_total)}`;
}

export function parseControls(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}
