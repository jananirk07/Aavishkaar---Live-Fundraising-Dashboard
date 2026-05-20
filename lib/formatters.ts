import { Currency } from "@/types/fund";
import { parseAmount } from "./parseAmount";

/**
 * Format a monetary amount for display.
 *
 * `amount` may arrive as a raw CSV string, a number, null, or undefined —
 * parseAmount() normalises it before any arithmetic or toFixed() call.
 *
 * Output examples (INR, unit = Crore):
 *   1500  → "₹1.5K Cr"
 *   500   → "₹500 Cr"
 *
 * Output examples (USD, unit = Million):
 *   1500  → "$1.5B"
 *   50    → "$50M"
 *   0.5   → "$500K"
 */
export function formatAmount(
  amount: string | number | null | undefined,
  currency: Currency
): string {
  const n = parseAmount(amount);
  if (n === 0) return "—";

  if (currency === "INR") {
    if (n >= 1_000) return `₹${(n / 1_000).toFixed(1)}K Cr`;
    return `₹${n.toFixed(0)} Cr`;
  }

  if (currency === "USD") {
    if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}B`;
    if (n >= 1)     return `$${n.toFixed(0)}M`;
    return `$${(n * 1_000).toFixed(0)}K`;
  }

  return `${n}`;
}

/**
 * Compact single-line amount: "₹500 Cr" / "$50M".
 * Zero → "—".
 */
export function formatCompact(
  amount: string | number | null | undefined,
  currency: Currency
): string {
  const n = parseAmount(amount);
  if (n === 0) return "—";
  const sym  = currency === "INR" ? "₹" : "$";
  const unit = currency === "INR" ? " Cr" : "M";
  return `${sym}${n.toFixed(0)}${unit}`;
}

/**
 * Format a percentage value for display.
 *
 * Accepts string | number | null | undefined so callers don't need to guard
 * before passing raisedPct / softCommitsPct etc. from the metrics object.
 * Invalid / missing → "0.0%".
 */
export function formatPercent(pct: string | number | null | undefined): string {
  // Percentages are already plain numbers from calculateMetrics, but we use
  // parseAmount here to safely coerce anything unexpected to a number.
  // (Percentages are never date-serial-shaped, so no false rejections occur.)
  const n = parseAmount(pct);
  return `${n.toFixed(1)}%`;
}

/**
 * Format an ISO timestamp string into a human-readable local time and date.
 * Returns "—" for empty or invalid input instead of showing "Invalid Date".
 */
export function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return (
    d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }) +
    " · " +
    d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  );
}
