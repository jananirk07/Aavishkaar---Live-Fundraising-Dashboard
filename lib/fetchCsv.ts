import Papa from "papaparse";

export type FetchCsvDebug = {
  url: string;
  detectedHeaderRowIndex: number;
  headers: string[];
  rowCount: number;
  firstRows: Record<string, string>[];
  rawPreview: string;
  errors: string[];
};

export type FetchCsvResult = {
  records: Record<string, string>[];
  debug: FetchCsvDebug;
};

function normalizeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function normalizeHeader(value: unknown, index: number): string {
  const header = normalizeCell(value)
    .replace(/\uFEFF/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return header || `_${index}`;
}

function scoreHeaderRow(row: unknown[]): number {
  const cells = row.map((cell) => normalizeCell(cell).toLowerCase());
  const joined = cells.join(" | ");

  let score = 0;

  // Strong fundraising / investor tracker signals
  const strongSignals = [
    "investor name",
    "lp name",
    "investor",
    "borrower company name",
    "company name",
    "status",
    "interest",
    "amount",
    "deal size",
    "next steps",
    "notes",
    "lead",
    "poc",
  ];

  for (const signal of strongSignals) {
    if (joined.includes(signal)) score += 4;
  }

  // Useful generic table signals
  const usefulSignals = [
    "geography",
    "priority",
    "currency",
    "description",
    "domicile",
    "first draw",
    "commodity",
  ];

  for (const signal of usefulSignals) {
    if (joined.includes(signal)) score += 2;
  }

  // Reward rows with many non-empty cells
  const nonEmptyCount = cells.filter(Boolean).length;
  score += Math.min(nonEmptyCount, 12);

  // Penalize metadata / merged-title rows
  if (nonEmptyCount <= 2) score -= 10;
  if (joined.includes("minutes of meeting") && nonEmptyCount <= 4) score -= 6;

  return score;
}

function detectHeaderRow(rows: unknown[][]): number {
  let bestIndex = 0;
  let bestScore = Number.NEGATIVE_INFINITY;

  const maxRowsToInspect = Math.min(rows.length, 15);

  for (let i = 0; i < maxRowsToInspect; i++) {
    const score = scoreHeaderRow(rows[i] ?? []);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return bestIndex;
}

function dedupeHeaders(headers: string[]): string[] {
  const seen = new Map<string, number>();

  return headers.map((header, index) => {
    const cleaned = normalizeHeader(header, index);
    const count = seen.get(cleaned) ?? 0;
    seen.set(cleaned, count + 1);
    return count === 0 ? cleaned : `${cleaned}_${count}`;
  });
}

function rowsToRecords(rows: unknown[][], headerRowIndex: number): Record<string, string>[] {
  const headerRow = rows[headerRowIndex] ?? [];
  const headers = dedupeHeaders(headerRow.map((cell, index) => normalizeHeader(cell, index)));
  const dataRows = rows.slice(headerRowIndex + 1);

  return dataRows
    .map((row) => {
      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        record[header] = normalizeCell(row[index]);
      });
      return record;
    })
    .filter((record) => Object.values(record).some((value) => normalizeCell(value) !== ""));
}

export async function fetchCsv(url: string): Promise<FetchCsvResult> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
  }

  const csvText = await response.text();

  const parsed = Papa.parse<unknown[]>(csvText, {
    skipEmptyLines: false,
  });

  const rawRows = (parsed.data ?? []).filter((row): row is unknown[] => Array.isArray(row));
  const detectedHeaderRowIndex = detectHeaderRow(rawRows);
  const records = rowsToRecords(rawRows, detectedHeaderRowIndex);
  const headers = rawRows[detectedHeaderRowIndex]
    ? dedupeHeaders(rawRows[detectedHeaderRowIndex].map((cell, index) => normalizeHeader(cell, index)))
    : [];

  const debug: FetchCsvDebug = {
    url,
    detectedHeaderRowIndex,
    headers,
    rowCount: records.length,
    firstRows: records.slice(0, 5),
    rawPreview: csvText.slice(0, 2000),
    errors: (parsed.errors ?? []).map((error) => error.message),
  };

  // Targeted logs only. These help debug without changing returned API shape.
  if (url.includes("Q0rC5V7")) {
    console.log("========== ANF RAW ==========");
    console.log({
      detectedHeaderRowIndex,
      headers,
      rowCount: records.length,
      first20Records: records.slice(0, 20),
      rawPreview: csvText.slice(0, 2000),
      errors: debug.errors,
    });
    console.log("========== END ANF ==========");
  }

  if (url.includes("1vR0RFVa")) {
    console.log("[fetchCsv debug:gscsf]", debug);
  }

  return { records, debug };
}
