"use client";

import { FilterState } from "@/types/fund";
import { FundData } from "@/types/fund";

interface Props {
  filters: FilterState;
  onChange: (f: Partial<FilterState>) => void;
  funds: FundData[];
}

const SELECT_CLASS =
  "text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 min-w-[130px]";

export function Filters({ filters, onChange, funds }: Props) {
  // Collect unique values across all funds
  const allStatuses = [
    ...new Set(funds.flatMap((f) => f.lps.map((lp) => lp.status).filter(Boolean))),
  ].sort();

  const allInterests = [
    ...new Set(funds.flatMap((f) => f.lps.map((lp) => lp.interest).filter(Boolean))),
  ].sort();

  const allOwners = [
    ...new Set(funds.flatMap((f) => f.lps.map((lp) => lp.owner).filter(Boolean))),
  ].sort();

  const allRegions = [
    ...new Set(funds.flatMap((f) => f.lps.map((lp) => lp.region).filter(Boolean))),
  ].sort();

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Search */}
      <input
        type="text"
        placeholder="Search LP, organisation..."
        value={filters.search}
        onChange={(e) => onChange({ search: e.target.value })}
        className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 w-56"
      />

      <select
        value={filters.fund}
        onChange={(e) => onChange({ fund: e.target.value })}
        className={SELECT_CLASS}
      >
        <option value="">All Funds</option>
        {funds.map((f) => (
          <option key={f.config.id} value={f.config.id}>
            {f.config.shortName}
          </option>
        ))}
      </select>

      <select
        value={filters.status}
        onChange={(e) => onChange({ status: e.target.value })}
        className={SELECT_CLASS}
      >
        <option value="">All Statuses</option>
        {allStatuses.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <select
        value={filters.interest}
        onChange={(e) => onChange({ interest: e.target.value })}
        className={SELECT_CLASS}
      >
        <option value="">All Interest Levels</option>
        {allInterests.map((i) => (
          <option key={i} value={i}>
            {i}
          </option>
        ))}
      </select>

      <select
        value={filters.owner}
        onChange={(e) => onChange({ owner: e.target.value })}
        className={SELECT_CLASS}
      >
        <option value="">All Owners</option>
        {allOwners.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>

      {allRegions.length > 0 && (
        <select
          value={filters.region}
          onChange={(e) => onChange({ region: e.target.value })}
          className={SELECT_CLASS}
        >
          <option value="">All Regions</option>
          {allRegions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      )}

      <select
        value={`${filters.sortBy}:${filters.sortDir}`}
        onChange={(e) => {
          const [sortBy, sortDir] = e.target.value.split(":") as [
            FilterState["sortBy"],
            FilterState["sortDir"]
          ];
          onChange({ sortBy, sortDir });
        }}
        className={SELECT_CLASS}
      >
        <option value="amount:desc">Amount: High to Low</option>
        <option value="amount:asc">Amount: Low to High</option>
        <option value="status:asc">Status: A-Z</option>
        <option value="name:asc">Name: A-Z</option>
      </select>

      {/* Clear */}
      {(filters.search || filters.fund || filters.status || filters.interest || filters.owner || filters.region) && (
        <button
          onClick={() =>
            onChange({
              search: "",
              fund: "",
              status: "",
              interest: "",
              owner: "",
              region: "",
            })
          }
          className="text-sm text-slate-500 hover:text-slate-800 underline"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
