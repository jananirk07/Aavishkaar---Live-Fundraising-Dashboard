export type Currency = "INR" | "USD";

export interface FundConfig {
  id: string;
  name: string;
  shortName: string;
  targetSize: number;
  currency: Currency;
  strategy: string;
  csvUrl: string;
  owners: string[];
  color: string;
}

export interface NormalizedLP {
  name: string;
  organization?: string;
  amount: number;
  currency: Currency;
  status: string;
  interest: string;
  owner: string;
  poc: string;
  region: string;
  nextSteps: string;
  notes: string;
  lastUpdated: string;
  fundId: string;
  raw: Record<string, string>;
}

export interface FundMetrics {
  fundId: string;
  raised: number;
  softCommits: number;
  pipeline: number;
  remaining: number;
  targetSize: number;
  currency: Currency;
  raisedPct: number;
  softCommitsPct: number;
  pipelinePct: number;
}

export interface Task {
  lpName: string;
  action: string;
  status: string;
  amount: number;
  currency: Currency;
  fundId: string;
  fundName: string;
  assignee: string;
  interest: string;
}

export interface TasksByPerson {
  [person: string]: Task[];
}

export interface FundData {
  config: FundConfig;
  lps: NormalizedLP[];
  metrics: FundMetrics;
  tasks: TasksByPerson;
  error?: string;
}

export interface ApiResponse {
  funds: FundData[];
  refreshedAt: string;
}

export type FilterState = {
  search: string;
  fund: string;
  status: string;
  interest: string;
  owner: string;
  region: string;
  sortBy: "amount" | "status" | "name";
  sortDir: "asc" | "desc";
};
