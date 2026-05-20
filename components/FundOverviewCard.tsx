"use client";

import { FundData } from "@/types/fund";
import { FundProgressBar } from "./FundProgressBar";
import { formatCompact, formatPercent } from "@/lib/formatters";

interface Props {
  fund: FundData;
}

function MetricTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
      <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-1 font-medium">
        {label}
      </div>
      <div
        className="text-lg font-semibold tabular-nums"
        style={{ color: accent || "#1e293b" }}
      >
        {value}
      </div>
    </div>
  );
}

export function FundOverviewCard({ fund }: Props) {
  const { config, metrics, lps, error } = fund;

  const lpCount = lps.length;
  const approvedCount = lps.filter((lp) => {
  const status = (lp.status || "").toLowerCase();
  return status.includes("approved") || status.includes("investment approved");
}).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className="px-6 py-5 flex items-start justify-between"
        style={{
          background: `linear-gradient(135deg, ${config.color}12 0%, ${config.color}06 100%)`,
          borderBottom: `3px solid ${config.color}`,
        }}
      >
        <div>
          <div
            className="text-xs font-bold uppercase tracking-widest mb-1"
            style={{ color: config.color }}
          >
            {config.shortName}
          </div>
          <h2 className="text-xl font-bold text-slate-900">{config.name}</h2>
          <p className="text-sm text-slate-500 mt-1">{config.strategy}</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400 uppercase tracking-wider">Target</div>
          <div className="text-2xl font-bold tabular-nums text-slate-900">
            {formatCompact(config.targetSize, config.currency)}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <span className="font-medium">Data unavailable: </span>
          {error}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="px-6 py-5 space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MetricTile
            label="Raised"
            value={formatCompact(metrics.raised, config.currency)}
            accent={config.color}
          />
          <MetricTile
            label="Soft Commits"
            value={formatCompact(metrics.softCommits, config.currency)}
            accent="#0369a1"
          />
          <MetricTile
            label="Pipeline"
            value={formatCompact(metrics.pipeline, config.currency)}
            accent="#92400e"
          />
          <MetricTile
            label="Remaining Gap"
            value={formatCompact(metrics.remaining, config.currency)}
            accent="#64748b"
          />
        </div>

        {/* Progress */}
        <FundProgressBar metrics={metrics} color={config.color} />

        {/* Footer stats */}
        <div className="flex items-center gap-4 pt-1 text-xs text-slate-500 border-t border-slate-100">
          <span>{lpCount} LPs tracked</span>
          <span>·</span>
          <span>{approvedCount} approved</span>
          <span>·</span>
          <span>{config.owners.length} team members</span>
        </div>
      </div>
    </div>
  );
}
