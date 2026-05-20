import { FundConfig, FundMetrics, NormalizedLP } from "@/types/fund";
import { parseAmount } from "./parseAmount";

function clean(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function isDeclined(status: string): boolean {
  return (
    status.includes("declined") ||
    status.includes("rejected") ||
    status.includes("not interested") ||
    status.includes("no response/mia") ||
    status.includes("mia")
  );
}

function isApproved(status: string, fundId?: string): boolean {
  if (
    status.includes("investment approved") ||
    status === "approved" ||
    status.includes("committed") ||
    status.includes("closed")
  ) {
    return true;
  }

  // GSCSF uses company/deal pipeline statuses rather than LP fundraising statuses.
  // In that sheet, IC means the deal is approved / at investment committee stage.
  if (fundId === "gscsf" && (status === "ic" || status.includes("investment committee"))) {
    return true;
  }

  return false;
}

function isDiligence(status: string, fundId?: string): boolean {
  if (
    status.includes("diligence") ||
    status.includes("dd") ||
    status.includes("due diligence")
  ) {
    return true;
  }

  // GSCSF does not currently use an explicit diligence status in the rows seen.
  // Keep this separate from Screening/Initial research so those stay in pipeline.
  return false;
}

function isHighInterest(interest: string): boolean {
  return interest === "high" || interest.includes("high");
}

function isMediumInterest(interest: string): boolean {
  return interest === "medium" || interest.includes("medium") || interest.includes("warm");
}

function isPipelineStatus(status: string, fundId?: string): boolean {
  if (
    status.includes("meeting scheduled") ||
    status.includes("initial meeting") ||
    status.includes("deck shared") ||
    status.includes("awaiting feedback") ||
    status.includes("follow up") ||
    status.includes("to be reached out") ||
    status.includes("on hold")
  ) {
    return true;
  }

  // GSCSF deal statuses observed in the sheet.
  if (
    fundId === "gscsf" &&
    (status.includes("screening") ||
      status.includes("initial research") ||
      status.includes("research") ||
      status.includes("pipeline"))
  ) {
    return true;
  }

  return false;
}

function pct(value: number, target: number): number {
  if (!target || target <= 0) return 0;
  return Math.max(0, Math.min(100, (value / target) * 100));
}

export function calculateMetrics(lps: NormalizedLP[], config: FundConfig): FundMetrics {
  let raised = 0;
  let softCommits = 0;
  let pipeline = 0;

  for (const lp of lps || []) {
    const amount = parseAmount((lp as any).amount);
    if (!Number.isFinite(amount) || amount <= 0) continue;

    const status = clean((lp as any).status);
    const interest = clean((lp as any).interest);

    const declinedRow = isDeclined(status);
    if (declinedRow) continue;

    const approvedRow = isApproved(status, config.id);
    const diligenceRow = isDiligence(status, config.id);
    const highInterestRow = isHighInterest(interest);
    const mediumInterestRow = isMediumInterest(interest);
    const pipelineStatusRow = isPipelineStatus(status, config.id);

    // Raised = approved / investment approved / IC for GSCSF.
    if (approvedRow) {
      raised += amount;
      continue;
    }

    // Soft commits = High interest OR diligence, excluding approved/declined.
    // This preserves your original Jamwant / ANF rule.
    if (highInterestRow || diligenceRow) {
      softCommits += amount;
      continue;
    }

    // Pipeline = Medium interest OR pipeline-like status.
    // For GSCSF, Screening / Initial research are pipeline.
    if (mediumInterestRow || pipelineStatusRow) {
      pipeline += amount;
      continue;
    }
  }

  const targetSize = Number(config.targetSize) || 0;
  const remaining = Math.max(targetSize - raised - softCommits - pipeline, 0);

  return {
    fundId: config.id,
    raised,
    softCommits,
    pipeline,
    remaining,
    targetSize,
    currency: config.currency,
    raisedPct: pct(raised, targetSize),
    softCommitsPct: pct(softCommits, targetSize),
    pipelinePct: pct(pipeline, targetSize),
  };
}
