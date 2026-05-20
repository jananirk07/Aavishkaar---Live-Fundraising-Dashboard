import { NormalizedLP, Task, TasksByPerson } from "@/types/fund";
import { FundConfig } from "@/types/fund";
import { parseAmount } from "./parseAmount";

// ---------------------------------------------------------------------------
// Assignee resolution
// ---------------------------------------------------------------------------

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Try to extract an explicit owner from an action/nextSteps string.
 *
 * Matches patterns like:
 *   "Somnil to complete onboarding"
 *   "somnil: send deck"
 *   "Action - Navneet"
 *   "@Navneet follow up"
 *
 * Returns the matched owner name, or null if none found.
 */
function extractExplicitOwnerFromText(
  text: string,
  owners: string[]
): string | null {
  if (!text) return null;
  const lower = text.toLowerCase().trim();

  for (const owner of owners) {
    const escaped = escapeRegExp(owner.toLowerCase());

    // Pattern 1: "Name to ..." — name appears at or near the start, followed by "to"
    // e.g. "Somnil to complete onboarding"
    const toPattern = new RegExp(`^\\s*${escaped}\\s+to\\b`, "i");
    if (toPattern.test(lower)) return owner;

    // Pattern 2: "Name: ..." — name at start followed by colon
    const colonPattern = new RegExp(`^\\s*${escaped}\\s*:`, "i");
    if (colonPattern.test(lower)) return owner;

    // Pattern 3: "@Name ..." — @-mention
    const atPattern = new RegExp(`@${escaped}\\b`, "i");
    if (atPattern.test(lower)) return owner;

    // Pattern 4: "... - Name" or "... (Name)" at end
    const endPattern = new RegExp(`[-–(]\\s*${escaped}\\s*[)\\s]*$`, "i");
    if (endPattern.test(lower)) return owner;

    // Pattern 5: "action for Name" / "assigned to Name" / "Name's action"
    const forPattern = new RegExp(
      `\\b(?:for|assigned to|attn:|attention:)\\s+${escaped}\\b`,
      "i"
    );
    if (forPattern.test(lower)) return owner;

    const possessivePattern = new RegExp(`\\b${escaped}'s\\b`, "i");
    if (possessivePattern.test(lower)) return owner;
  }

  return null;
}

/**
 * Search a field string for any known internal owner name (simple word boundary match).
 * Returns the first match or null.
 */
function findOwnerInText(text: string, owners: string[]): string | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  for (const owner of owners) {
    const re = new RegExp(`\\b${escapeRegExp(owner.toLowerCase())}\\b`);
    if (re.test(lower)) return owner;
  }
  return null;
}

/**
 * Determine the assignee for a task, with the following priority:
 *
 * 1. Explicit action ownership extracted from nextSteps text
 *    (e.g. "Somnil to complete onboarding")
 * 2. nextSteps field — any owner name mention (non-explicit)
 * 3. Owner field (internal owners only)
 * 4. Notes field
 * 5. Lead field (internal owners only)
 * 6. POC field — only if it matches a known internal owner
 * 7. extra / raw fields
 * 8. "Unassigned"
 *
 * We NEVER assign to arbitrary strings from these fields; only names that
 * appear in config.owners are valid assignees.
 */
function findAssignee(lp: NormalizedLP, owners: string[]): string {
  if (!owners || owners.length === 0) return "Unassigned";

  // 1. Explicit "Name to ..." pattern in nextSteps
  const nextStepsExplicit = extractExplicitOwnerFromText(
    lp.nextSteps ?? "",
    owners
  );
  if (nextStepsExplicit) return nextStepsExplicit;

  // Also check the action field if it differs from nextSteps
  const actionExplicit = extractExplicitOwnerFromText(
    (lp as any).action ?? "",
    owners
  );
  if (actionExplicit) return actionExplicit;

  // 2. nextSteps — any owner mention
  const nextStepsAny = findOwnerInText(lp.nextSteps ?? "", owners);
  if (nextStepsAny) return nextStepsAny;

  // 3. Owner field
  const ownerMatch = findOwnerInText(lp.owner ?? "", owners);
  if (ownerMatch) return ownerMatch;

  // 4. Notes
  const notesMatch = findOwnerInText(lp.notes ?? "", owners);
  if (notesMatch) return notesMatch;

  // 5. Lead field
  const leadMatch = findOwnerInText((lp as any).lead ?? "", owners);
  if (leadMatch) return leadMatch;

  // 6. POC — only if it exactly matches (or contains) a known internal owner.
  //    External emails and LP contact names are NOT valid assignees.
  const pocValue = ((lp as any).poc ?? "").trim();
  if (pocValue && !pocValue.includes("@")) {
    // Not an email — check if it matches an internal owner
    const pocMatch = findOwnerInText(pocValue, owners);
    if (pocMatch) return pocMatch;
  }

  // 7. extra / raw fields
  const extraText = [
  Object.values((lp as any).extra ?? {}).join(" "),
  Object.values((lp as any).raw ?? {}).join(" "),
].join(" ");
  const extraMatch = findOwnerInText(extraText, owners);
  if (extraMatch) return extraMatch;

  return "Unassigned";
}

// ---------------------------------------------------------------------------
// Task extraction
// ---------------------------------------------------------------------------

/**
 * Extract actionable tasks from normalised LP rows and group them under the
 * fund's known internal owners (plus "Unassigned").
 *
 * Guarantees:
 *  - task.amount is always a number (parseAmount converts the raw string).
 *  - Result keys are exactly config.owners ∪ { "Unassigned" }.
 *  - External emails, LP names, and arbitrary strings never become group keys.
 */
export function extractTasks(
  lps: NormalizedLP[],
  config: FundConfig
): TasksByPerson {
  // Pre-seed so the UI always gets the full owner list, even with 0 tasks.
  const result: TasksByPerson = {};
  for (const owner of config.owners ?? []) {
    result[owner] = [];
  }
  result["Unassigned"] = [];

  for (const lp of lps) {
    if (lp == null) continue;

    const numericAmount = parseAmount(lp.amount);

    // Skip rows with no actionable content at all.
    if (!lp.nextSteps && !lp.status && numericAmount === 0) continue;

    const assignee = findAssignee(lp, config.owners ?? []);

    const task: Task = {
      lpName: lp.name ?? "Unknown",
      action: lp.nextSteps || lp.notes || "Follow up",
      status: lp.status || "Unknown",
      amount: numericAmount,
      currency: lp.currency ?? config.currency,
      fundId: config.id,
      fundName: config.shortName,
      assignee,
      interest: lp.interest ?? "",
    };

    result[assignee].push(task);
  }

  return result;
}
