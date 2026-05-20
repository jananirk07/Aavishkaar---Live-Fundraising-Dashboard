import { NextResponse } from "next/server";
import { FUND_CONFIGS } from "@/lib/fundConfig";
import { fetchCsv } from "@/lib/fetchCsv";
import { normalizeRows } from "@/lib/normalizeRows";
import { calculateMetrics } from "@/lib/calculations";
import { extractTasks } from "@/lib/taskExtraction";
import { ApiResponse, FundData } from "@/types/fund";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEBUG_DATA = process.env.DEBUG_DATA === "true";

function getEmptyMetrics(config: any) {
  return {
    fundId: config.id,
    raised: 0,
    softCommits: 0,
    pipeline: 0,
    remaining: config.targetSize,
    targetSize: config.targetSize,
    currency: config.currency,
    raisedPct: 0,
    softCommitsPct: 0,
    pipelinePct: 0,
  };
}

export async function GET(): Promise<NextResponse<ApiResponse>> {
  const fundPromises = FUND_CONFIGS.map(async (config): Promise<FundData> => {
    try {
      const fetchResult: any = await fetchCsv(config.csvUrl);

      // Supports both fetchCsv shapes:
      // old: Record<string,string>[]
      // new: { records: Record<string,string>[], debug: {...} }
      const rawRows = Array.isArray(fetchResult)
        ? fetchResult
        : fetchResult.records ?? [];

      const normalizeResult: any = normalizeRows(rawRows);

      // Supports both normalizeRows shapes:
      // old: NormalizedLP[]
      // new: { rows: NormalizedLP[], skipped: [...], headerMap: {...} }
      const normalizedRows = Array.isArray(normalizeResult)
        ? normalizeResult
        : normalizeResult.rows ?? [];

      const lps = normalizedRows.map((lp: any) => ({
        ...lp,
        currency: lp.currency ?? config.currency,
      }));

      const metrics = calculateMetrics(lps, config);
      const tasks = extractTasks(lps, config);

      const fundData: any =
        DEBUG_DATA && config.id !== "jvf2"
          ? { config, lps: lps.slice(0, 20), metrics, tasks }
          : { config, lps, metrics, tasks };

      if (DEBUG_DATA) {
        fundData._debug = {
          fetchCsv: Array.isArray(fetchResult) ? null : fetchResult.debug,
          normalizeRows: Array.isArray(normalizeResult)
            ? null
            : {
                headerMap: normalizeResult.headerMap,
                skippedCount: normalizeResult.skipped?.length ?? 0,
                skippedRowsPreview: normalizeResult.skipped?.slice(0, 20) ?? [],
              },
          rawRowsPreview: rawRows.slice(0, 15),
          normalizedRowsPreview: lps.slice(0, 15),
        };
      }

      return fundData;
    } catch (err) {
      const error = err instanceof Error ? err.message : "Unknown error";
      console.error(`[${config.id}] Error:`, error);

      const fundData: any = {
        config,
        lps: [],
        metrics: getEmptyMetrics(config),
        tasks: {},
        error,
      };

      if (DEBUG_DATA) {
        fundData._debug = { error };
      }

      return fundData;
    }
  });

  const funds = await Promise.all(fundPromises);

  return NextResponse.json(
    { funds, refreshedAt: new Date().toISOString() },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      },
    }
  );
}
