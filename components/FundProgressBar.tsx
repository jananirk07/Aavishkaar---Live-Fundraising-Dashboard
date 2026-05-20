"use client";

import { FundMetrics } from "@/types/fund";
import { formatCompact, formatPercent } from "@/lib/formatters";

interface Props {
  metrics: FundMetrics;
  color: string;
}

export function FundProgressBar({ metrics, color }: Props) {
  const { raised, softCommits, pipeline, remaining, targetSize, currency, raisedPct, softCommitsPct, pipelinePct } = metrics;
  const coveredPct = raisedPct + softCommitsPct + pipelinePct;

  return (
    <div className="space-y-3">
      {/* Stacked Bar */}
      <div className="h-3 rounded-full bg-slate-100 overflow-hidden flex">
        {raisedPct > 0 && (
          <div
            className="h-full transition-all duration-700"
            style={{ width: `${raisedPct}%`, backgroundColor: color }}
            title={`Raised: ${formatCompact(raised, currency)}`}
          />
        )}
        {softCommitsPct > 0 && (
          <div
            className="h-full transition-all duration-700"
            style={{ width: `${softCommitsPct}%`, backgroundColor: color, opacity: 0.55 }}
            title={`Soft Commits: ${formatCompact(softCommits, currency)}`}
          />
        )}
        {pipelinePct > 0 && (
          <div
            className="h-full transition-all duration-700"
            style={{ width: `${pipelinePct}%`, backgroundColor: color, opacity: 0.25 }}
            title={`Pipeline: ${formatCompact(pipeline, currency)}`}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: color }} />
          Raised {formatCompact(raised, currency)} ({formatPercent(raisedPct)})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: color, opacity: 0.55 }} />
          Soft Commits {formatCompact(softCommits, currency)} ({formatPercent(softCommitsPct)})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: color, opacity: 0.25 }} />
          Pipeline {formatCompact(pipeline, currency)} ({formatPercent(pipelinePct)})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm inline-block bg-slate-200" />
          Gap {formatCompact(remaining, currency)}
        </span>
      </div>

      <div className="text-xs font-medium text-slate-500">
        {formatPercent(coveredPct)} of {formatCompact(targetSize, currency)} target covered
      </div>
    </div>
  );
}
