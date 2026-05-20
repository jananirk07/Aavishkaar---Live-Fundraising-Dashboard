# Fundraising Command Center

A production-quality live fundraising tracker for fund managers. Pulls data from Google Sheets CSV exports, processes it server-side, and displays executive-grade dashboards.

## Features

- **Overview Dashboard** — Fund progress with stacked bars, raised/soft commits/pipeline/gap metrics
- **LP Pipeline Table** — Full LP list with search, filters (fund, status, interest, owner, region), and sorting
- **Tasks by Person** — Task board grouped by team member with fund-specific owner assignment
- **Auto-refresh** every 10 minutes + manual Refresh button
- **Graceful error handling** — if one fund fails, others still load
- **Robust data normalization** — handles varying column headers across sheets

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` if your Google Sheet CSV URLs have changed. The defaults already point to the correct sheets — only update if you re-publish to a new URL.

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Architecture

```
Frontend (browser)
    ↓  GET /api/funds
Next.js API Route (server)
    ↓  fetch CSV
Google Sheets Published CSV
    ↓  PapaParse
Normalized LP data + metrics
    ↑  JSON response
Frontend renders dashboards
```

**No direct frontend-to-Google-Sheets calls.** All CSV fetching happens server-side via the `/api/funds` route, keeping credentials/URLs off the client and bypassing CORS issues.

---

## Project Structure

```
fundraising-command-center/
├── app/
│   ├── page.tsx              # Main UI with tabs
│   ├── layout.tsx
│   ├── globals.css
│   └── api/
│       └── funds/
│           └── route.ts      # Server route — fetches & processes all CSV data
│
├── components/
│   ├── FundOverviewCard.tsx  # Per-fund metric card
│   ├── FundProgressBar.tsx   # Stacked progress bar
│   ├── PipelineTable.tsx     # Full LP table with filters
│   ├── TaskBoard.tsx         # Tasks grouped by person
│   ├── Filters.tsx           # Reusable filter bar
│   └── StatusBadge.tsx       # Coloured status/interest badges
│
├── lib/
│   ├── fundConfig.ts         # Fund definitions (name, target, color, owners, CSV URL)
│   ├── fetchCsv.ts           # Fetch + PapaParse CSV
│   ├── normalizeRows.ts      # Map arbitrary column headers → standard fields
│   ├── calculations.ts       # Raised / soft commits / pipeline / gap logic
│   ├── taskExtraction.ts     # Assign LP rows to team members
│   └── formatters.ts         # Currency + percent + timestamp formatting
│
├── types/
│   └── fund.ts               # TypeScript interfaces
│
├── .env.local.example
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## Deploy to Vercel

### One-click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=YOUR_REPO_URL)

### Manual deploy

1. Push code to GitHub/GitLab
2. Import project in [vercel.com/new](https://vercel.com/new)
3. Add environment variables (see below)
4. Deploy

### Environment variables on Vercel

In your Vercel project → Settings → Environment Variables, add:

| Key | Value |
|-----|-------|
| `JVF2_CSV_URL` | JVF II Google Sheets CSV URL |
| `ANF_CSV_URL` | ANF Google Sheets CSV URL |
| `GSCSF_CSV_URL` | GSCSF Google Sheets CSV URL |

---

## Updating Sheet URLs

If you re-publish a Google Sheet to a new URL:

1. Update the relevant variable in `.env.local` (local) or Vercel environment variables (production)
2. No code changes needed — `lib/fundConfig.ts` reads from env vars with fallback defaults

---

## Adding a New Fund

1. In `lib/fundConfig.ts`, add a new entry to `FUND_CONFIGS`:

```ts
{
  id: "newfund",
  name: "New Fund Name",
  shortName: "NFN",
  targetSize: 100,
  currency: "USD",
  strategy: "Your strategy here",
  csvUrl: process.env.NEW_FUND_CSV_URL || "https://...",
  owners: ["Person A", "Person B"],
  color: "#c026d3",
}
```

2. Add the env var `NEW_FUND_CSV_URL` to `.env.local` and Vercel

---

## Upgrading to Google Sheets API

When ready to move beyond CSV exports:

1. Replace `lib/fetchCsv.ts` with a Google Sheets API v4 call using a service account
2. The rest of the pipeline (normalizeRows, calculations, taskExtraction) stays unchanged
3. Only `app/api/funds/route.ts` and `lib/fetchCsv.ts` need updating

---

## Calculation Logic

| Metric | Logic |
|--------|-------|
| **Raised** | Sum of `amount` where `status` contains "approved" (case-insensitive) |
| **Soft Commits** | Sum of `amount` where `interest` is "High" OR `status` contains "diligence" — excluding already approved rows |
| **Pipeline** | Sum of `amount` where `interest` is "Medium" — excluding approved and diligence rows |
| **Remaining Gap** | `target − raised − softCommits − pipeline` (floor 0) |

---

## Tech Stack

- **Next.js 15** — App Router, server components, API routes
- **TypeScript** — strict mode
- **Tailwind CSS v4** — utility-first styling
- **PapaParse** — CSV parsing
- **Vercel** — deployment platform
