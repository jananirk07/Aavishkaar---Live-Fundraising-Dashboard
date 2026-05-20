/**
 * normalizeRows.ts
 *
 * Maps raw CSV row objects (string→string) to typed NormalizedRow objects.
 *
 * Design rules for the FIELD_MAP
 * ───────────────────────────────
 * 1. More-specific patterns come BEFORE general ones so the first match wins.
 * 2. Amount columns are matched by explicit money-intent words:
 *      "amount", "commitment", "ticket", "potential commitment", "size"
 * 3. The following header words must NEVER resolve to "amount":
 *      date / follow.?up / next / notes / status / stage / date
 *    These are excluded via a blocklist check in resolveAmountField().
 * 4. A row is dropped ONLY if no LP/investor/org name can be found.
 *    Missing amount, status, interest, etc. keep the row alive.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NormalizedRow {
  /** LP / investor / org name — required; rows without it are dropped. */
  name: string;
  status?: string;
  interest?: string;
  /** Raw string exactly as it appeared in the sheet. parseAmount() converts it. */
  amount?: string;
  commitment?: string;
  nextSteps?: string;
  owner?: string;
  lead?: string;
  poc?: string;
  notes?: string;
  /** Any column that didn't map to a known field is preserved here. */
  extra: Record<string, string>;
}

type KnownField = keyof Omit<NormalizedRow, "extra">;

// ---------------------------------------------------------------------------
// Amount-column allow / block lists
// ---------------------------------------------------------------------------

/**
 * A header must contain at least one of these substrings to be considered
 * an amount column.  Checked after lower-casing and trimming.
 */
const AMOUNT_ALLOW = ["amount", "commitment", "ticket", "potential commitment", "size"];

/**
 * Even if an amount-allow word is present, these substrings veto it.
 * Examples that should NOT map to amount:
 *   "Date of last follow-up"   (contains nothing in allow, but guard anyway)
 *   "Next follow-up date"
 *   "Status date"
 *   "Ticket status"            ← "ticket" is in allow but "status" blocks it
 *   "Deal size notes"          ← "size" is in allow but "notes" blocks it
 */
const AMOUNT_BLOCK = [
  "date",
  "follow",
  "next",
  "note",
  "status",
  "stage",
  "last",
  "update",
  "comment",
  "remark",
];

/** Returns true when a lowercased header should map to the "amount" field. */
function isAmountHeader(lower: string): boolean {
  const hasAllow = AMOUNT_ALLOW.some((w) => lower.includes(w));
  if (!hasAllow) return false;
  const hasBlock = AMOUNT_BLOCK.some((w) => lower.includes(w));
  return !hasBlock;
}

// ---------------------------------------------------------------------------
// General FIELD_MAP (everything except amount, which needs special handling)
// ---------------------------------------------------------------------------

/**
 * Each entry maps header substrings → canonical field.
 * First match wins, so put more-specific patterns first.
 * "amount" is intentionally absent — it is resolved via isAmountHeader().
 */
const FIELD_MAP: Array<{ patterns: string[]; field: KnownField }> = [
  // ── Identity ──────────────────────────────────────────────────────────────
  // "lp name", "investor name", "organization" all resolve to "name".
  // Plain "name" is listed last in the patterns array so "fund name" matches
  // "fund name" first (it contains "name") — but since we do includes() on
  // the whole lower-cased header, "lp name" and "investor name" also hit this
  // entry.  Priority over other entries is controlled by position in FIELD_MAP.
  {
    patterns: ["investor", "lp name", "lp", "organization", "org", "entity", "fund name", "name"],
    field: "name",
  },

  // ── Status ────────────────────────────────────────────────────────────────
  // Must come BEFORE "interest" because some sheets have "Investment Status".
  { patterns: ["investment status", "deal status", "status"], field: "status" },

  // ── Interest ──────────────────────────────────────────────────────────────
  { patterns: ["interest level", "level of interest", "interest"], field: "interest" },

  // ── Next steps / actions ──────────────────────────────────────────────────
  { patterns: ["next step", "next_step", "action item", "action"], field: "nextSteps" },

  // ── Notes ─────────────────────────────────────────────────────────────────
  { patterns: ["note", "comment", "remark"], field: "notes" },

  // ── People ────────────────────────────────────────────────────────────────
  { patterns: ["point of contact", "poc"], field: "poc" },
  { patterns: ["owner", "relationship owner", "coverage"], field: "owner" },
  { patterns: ["lead"], field: "lead" },
];

// ---------------------------------------------------------------------------
// Header resolution
// ---------------------------------------------------------------------------

function resolveField(rawHeader: string): KnownField | null {
  const lower = rawHeader.toLowerCase().trim();

  // Amount has its own logic to avoid date/status columns.
  if (isAmountHeader(lower)) return "amount";

  for (const { patterns, field } of FIELD_MAP) {
    if (patterns.some((p) => lower.includes(p))) return field;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Normalize raw CSV rows into typed NormalizedRow objects.
 *
 * Drop rules:
 *  - Row is dropped ONLY if no name/investor/LP cell can be identified.
 *  - Missing amount, status, interest, etc. keep the row alive.
 */
export function normalizeRows(raw: Record<string, string>[]): NormalizedRow[] {
  if (raw.length === 0) return [];

  // Build the header→field map once from the first row's keys so we don't
  // re-resolve on every row.  Rows with unexpected extra keys fall back to
  // lazy resolution below.
  const keyToField = new Map<string, KnownField | null>();
  for (const key of Object.keys(raw[0])) {
    keyToField.set(key, resolveField(key));
  }

  const normalized: NormalizedRow[] = [];

  for (const row of raw) {
    const mapped: Partial<Record<KnownField, string>> = {};
    const extra: Record<string, string> = {};

    for (const [key, value] of Object.entries(row)) {
      const trimmedValue = (value ?? "").trim();
      if (!trimmedValue) continue; // skip empty cells

      // Lazy-resolve keys that weren't in the first row (rare but possible).
      const field = keyToField.has(key)
        ? keyToField.get(key)!
        : resolveField(key);

      if (field != null) {
        // First non-empty value wins for each canonical field.
        if (!mapped[field]) mapped[field] = trimmedValue;
      } else {
        extra[key] = trimmedValue;
      }
    }

    // Drop rows with no identifiable LP/investor name.
    if (!mapped.name) continue;

    normalized.push({
      name:       mapped.name,
      status:     mapped.status,
      interest:   mapped.interest,
      amount:     mapped.amount,
      commitment: mapped.commitment,
      nextSteps:  mapped.nextSteps,
      owner:      mapped.owner,
      lead:       mapped.lead,
      poc:        mapped.poc,
      notes:      mapped.notes,
      extra,
    });
  }

  return normalized;
}
