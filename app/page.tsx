"use client";

import { useEffect, useState, useCallback } from "react";
import { ApiResponse, FundData } from "@/types/fund";
import { FundOverviewCard } from "@/components/FundOverviewCard";
import { PipelineTable } from "@/components/PipelineTable";
import { TaskBoard } from "@/components/TaskBoard";
import { formatTimestamp } from "@/lib/formatters";

type Tab = "overview" | "pipeline" | "tasks";

const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="h-1 bg-slate-200 animate-pulse" />
          <div className="p-6 space-y-4">
            <div className="h-5 w-1/3 bg-slate-100 rounded animate-pulse" />
            <div className="h-7 w-2/3 bg-slate-100 rounded animate-pulse" />
            <div className="grid grid-cols-4 gap-3">
              {[0, 1, 2, 3].map((j) => (
                <div key={j} className="h-16 bg-slate-50 rounded-lg animate-pulse" />
              ))}
            </div>
            <div className="h-3 bg-slate-100 rounded-full animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("/api/funds", { cache: "no-store" });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json: ApiResponse = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load fundraising data."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  const funds: FundData[] = data?.funds || [];
  const hasErrors = funds.some((f) => f.error);

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "overview", label: "Overview" },
    {
      id: "pipeline",
      label: "LP Pipeline",
      count: funds.reduce((s, f) => s + f.lps.length, 0),
    },
    {
      id: "tasks",
      label: "Tasks",
      count: funds.reduce(
        (s, f) => s + Object.values(f.tasks).reduce((ts, t) => ts + t.length, 0),
        0
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Fundraising Command Center
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Live investor pipeline dashboard
            </p>
          </div>

          <div className="flex items-center gap-4">
            {data?.refreshedAt && (
              <span className="hidden sm:block text-xs text-slate-400">
                Last refreshed {formatTimestamp(data.refreshedAt)}
              </span>
            )}
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              {refreshing ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-[1600px] mx-auto px-6 flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded-full font-semibold ${
                    activeTab === tab.id
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Global error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <span className="font-semibold">Error loading data: </span>
            {error}
          </div>
        )}

        {hasErrors && !error && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            One or more funds encountered errors loading data. Other funds are displayed normally.
          </div>
        )}

        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {funds.map((fund) => (
                    <FundOverviewCard key={fund.config.id} fund={fund} />
                  ))}
                </div>

                {/* Aggregate stats */}
                {funds.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
                      Portfolio Summary
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                      <div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                          Total LPs Tracked
                        </div>
                        <div className="text-2xl font-bold text-slate-900">
                          {funds.reduce((s, f) => s + f.lps.length, 0)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                          Active Funds
                        </div>
                        <div className="text-2xl font-bold text-slate-900">
                          {funds.length}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                          Team Members
                        </div>
                        <div className="text-2xl font-bold text-slate-900">
                          {
                            new Set(funds.flatMap((f) => f.config.owners)).size
                          }
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                          Open Tasks
                        </div>
                        <div className="text-2xl font-bold text-slate-900">
                          {funds.reduce(
                            (s, f) =>
                              s +
                              Object.values(f.tasks).reduce(
                                (ts, t) => ts + t.length,
                                0
                              ),
                            0
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "pipeline" && (
              <PipelineTable funds={funds} />
            )}

            {activeTab === "tasks" && (
              <TaskBoard funds={funds} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
