/**
 * parseAmount.ts
 *
 * Converts a raw amount string from a Google Sheet into a plain number.
 * The number is always in the same unit as the sheet (Cr for INR funds,
 * M for USD funds) — callers must not apply unit conversion here.
 *
 * Conservative strategy: when a range is given we take the LOWER bound.
 * This intentionally understates the pipeline rather than overstating it.
 *
 * Examples
 * --------
 *   "5"           → 5
 *   "25-50"       → 25      (lower bound of range)
 *   "25 - 50"     → 25
 *   "3 to 5"      → 3       (lower bound of range)
 *   "25+"         → 25      (ignore the +)
 *   "~100"        → 100     (ignore the ~)
 *   "₹100 Cr"     → 100     (strip currency symbols / unit words)
 *   "$5M"         → 5
 *   "USD 10M"     → 10
 *   "1,000"       → 1000    (strip commas)
 *   "Not sure"    → 0
 *   ""            → 0
 *   "NA" / "TBD"  → 0
 *   "46091"       → 0       (bare date serial, rejected)
 *   "01/06/2026"  → 0       (date string, rejected)
 *   "$46091"      → 46091   (currency-tagged → kept; probably a real dollar amount)
 */

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

/** Phrases that signal "we have no idea" → treat as 0. */
const UNKNOWN_RE =
  /^\s*(n\/a|na|tbd|tbc|not\s+sure|unknown|unclear|nil|none|-+)\s*$/i;

/**
 * Excel / Google Sheets date serials run from ~30 000 (early 1980s) to
 * ~60 000 (mid-2060s).  A bare integer in that range with no currency tag
 * almost certainly came from a date column exported as a serial.
 */
const DATE_SERIAL_MIN = 30_000;
const DATE_SERIAL_MAX = 60_000;

/**
 * Matches a string that is ONLY digits (5–6 of them) — the shape a bare
 * Google Sheets date serial takes in a CSV export.
 */
const BARE_SERIAL_RE = /^\d{5,6}$/;

/**
 * Common date string patterns to reject outright before any numeric parsing:
 *   dd/mm/yyyy   mm-dd-yyyy   yyyy-mm-dd   dd-Mon-yyyy  etc.
 */
const DATE_STRING_RE =
  /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$|^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * True when the raw string contains an explicit currency symbol or ISO code.
 */
function hasCurrencyTag(raw: string): boolean {
  return /[₹$€£]/.test(raw) || /\b(usd|inr|eur|gbp)\b/i.test(raw);
}

/**
 * Strip characters that annotate but are not part of the number:
 *  - currency symbols & ISO codes  (₹ $ € £  USD INR EUR GBP)
 *  - unit words                    (Cr Crore M Mn Lac Lakh K)
 *  - approximation prefixes        (~ ≈)
 *  - thousands separators          (,)
 */
function stripNoise(raw: string): string {
  return raw
    .replace(/[₹$€£]/g, "")
    .replace(/\b(usd|inr|eur|gbp)\b/gi, "")
    .replace(/\b(crore|cr|million|mn|m|lac|lakh|k)\b/gi, "")
    .replace(/[~≈]/g, "")
    .replace(/,/g, "")
    .trim();
}

/** Parse a clean string; returns NaN if empty or non-numeric. */
function parseNumeric(s: string): number {
  const cleaned = s.replace(/\+$/, "").trim();
  return cleaned === "" ? NaN : Number(cleaned);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Convert a raw cell value to a number ≥ 0.
 * Returns 0 for absent, unparseable, or date-like values.
 */
export function parseAmount(
  value: string | number | null | undefined
): number {
  // ── Numeric fast path ────────────────────────────────────────────────────
  if (typeof value === "number") {
    if (!isFinite(value)) return 0;
    const n = Math.max(0, value);
    if (Number.isInteger(n) && n >= DATE_SERIAL_MIN && n <= DATE_SERIAL_MAX)
      return 0;
    return n;
  }

  if (value == null) return 0;

  const raw = String(value).trim();
  if (raw === "" || UNKNOWN_RE.test(raw)) return 0;

  // ── Date guards ──────────────────────────────────────────────────────────
  if (DATE_STRING_RE.test(raw)) return 0;

  if (BARE_SERIAL_RE.test(raw)) {
    const n = Number(raw);
    if (n >= DATE_SERIAL_MIN && n <= DATE_SERIAL_MAX && !hasCurrencyTag(raw))
      return 0;
  }

  // ── Noise stripping ──────────────────────────────────────────────────────
  const clean = stripNoise(raw);

  // ── Range: "25-50", "25 - 50", "3 to 5" ─────────────────────────────────
  const rangeMatch = clean.match(
    /^(-?\d+(?:\.\d+)?)\s*(?:-|to)\s*(-?\d+(?:\.\d+)?)$/i
  );
  if (rangeMatch) {
    const lo = Number(rangeMatch[1]);
    const hi = Number(rangeMatch[2]);
    if (isFinite(lo) && isFinite(hi)) {
      return Math.max(0, Math.min(lo, hi));
    }
  }

  // ── Single value: "25+", "~100", "5" ────────────────────────────────────
  const n = parseNumeric(clean);
  if (isFinite(n)) return Math.max(0, n);

  return 0;
}

/**
 * Safe replacement for `someValue.toFixed(digits)`.
 */
export function safeToFixed(
  value: unknown,
  digits = 1
): string {
  return parseAmount(
    value as string | number | null | undefined
  ).toFixed(digits);
}
