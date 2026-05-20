"use client";

import { NormalizedLP, FilterState, FundData } from "@/types/fund";
import { StatusBadge } from "./StatusBadge";
import { Filters } from "./Filters";
import { formatCompact } from "@/lib/formatters";
import { useState } from "react";

interface Props {
  funds: FundData[];
}

function applyFilters(lps: NormalizedLP[], filters: FilterState): NormalizedLP[] {
  let out = [...lps];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    out = out.filter(
      (lp) =>
        lp.name.toLowerCase().includes(q) ||
        (lp.organization || "").toLowerCase().includes(q) ||
        lp.region.toLowerCase().includes(q) ||
        lp.owner.toLowerCase().includes(q)
    );
  }

  if (filters.fund) {
    out = out.filter((lp) => lp.fundId === filters.fund);
  }

  if (filters.status) {
    out = out.filter((lp) => lp.status === filters.status);
  }

  if (filters.interest) {
    out = out.filter((lp) => lp.interest === filters.interest);
  }

  if (filters.owner) {
    out = out.filter((lp) => lp.owner === filters.owner);
  }

  if (filters.region) {
    out = out.filter((lp) => lp.region === filters.region);
  }

  out.sort((a, b) => {
    const dir = filters.sortDir === "asc" ? 1 : -1;
    if (filters.sortBy === "amount") return (a.amount - b.amount) * dir;
    if (filters.sortBy === "status") return a.status.localeCompare(b.status) * dir;
    if (filters.sortBy === "name") return a.name.localeCompare(b.name) * dir;
    return 0;
  });

  return out;
}

export function PipelineTable({ funds }: Props) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    fund: "",
    status: "",
    interest: "",
    owner: "",
    region: "",
    sortBy: "amount",
    sortDir: "desc",
  });

  const allLps: NormalizedLP[] = funds.flatMap((f) => f.lps);
  const filtered = applyFilters(allLps, filters);

  const fundMap = Object.fromEntries(funds.map((f) => [f.config.id, f.config]));

  return (
    <div className="space-y-5">
      <Filters
        filters={filters}
        onChange={(p) => setFilters((prev) => ({ ...prev, ...p }))}
        funds={funds}
      />

      <div className="text-sm text-slate-500">
        Showing {filtered.length} of {allLps.length} LPs
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-semibold">LP / Investor</th>
                <th className="text-left px-4 py-3 font-semibold">Fund</th>
                <th className="text-right px-4 py-3 font-semibold">Amount</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Interest</th>
                <th className="text-left px-4 py-3 font-semibold">Owner</th>
                <th className="text-left px-4 py-3 font-semibold">Region</th>
                <th className="text-left px-4 py-3 font-semibold">Next Steps</th>
                <th className="text-left px-4 py-3 font-semibold">Updated</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-slate-400">
                    No records match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((lp, i) => {
                  const fc = fundMap[lp.fundId];
                  return (
                    <tr
                      key={`${lp.fundId}-${i}`}
                      className="border-t border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{lp.name}</div>
                        {lp.organization && lp.organization !== lp.name && (
                          <div className="text-xs text-slate-400">{lp.organization}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {fc && (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold"
                            style={{
                              backgroundColor: fc.color + "15",
                              color: fc.color,
                              border: `1px solid ${fc.color}30`,
                            }}
                          >
                            {fc.shortName}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700">
                        {formatCompact(lp.amount, lp.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge value={lp.status} type="status" />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge value={lp.interest} type="interest" />
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{lp.owner || "—"}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{lp.region || "—"}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs max-w-[200px] truncate" title={lp.nextSteps}>
                        {lp.nextSteps || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                        {lp.lastUpdated || "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
