"use client";

interface BadgeProps {
  value: string;
  type: "status" | "interest";
}

function getStatusStyle(status: string): string {
  const s = (status || "").toLowerCase();
  if (s.includes("approved") || s.includes("closed") || s.includes("invested")) {
    return "bg-emerald-50 text-emerald-800 border border-emerald-200";
  }
  if (s.includes("diligence") || s.includes("dd")) {
    return "bg-blue-50 text-blue-800 border border-blue-200";
  }
  if (s.includes("meeting") || s.includes("discussion") || s.includes("engaged")) {
    return "bg-sky-50 text-sky-800 border border-sky-200";
  }
  if (s.includes("interested") || s.includes("warm")) {
    return "bg-amber-50 text-amber-800 border border-amber-200";
  }
  if (s.includes("passed") || s.includes("declined") || s.includes("rejected") || s.includes("no")) {
    return "bg-red-50 text-red-700 border border-red-200";
  }
  if (s.includes("prospect") || s.includes("outreach") || s.includes("cold")) {
    return "bg-slate-100 text-slate-600 border border-slate-200";
  }
  return "bg-slate-50 text-slate-600 border border-slate-200";
}

function getInterestStyle(interest: string): string {
  const i = (interest || "").toLowerCase();
  if (i.includes("high") || i === "h" || i === "1" || i.includes("strong")) {
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  }
  if (i.includes("medium") || i.includes("moderate") || i === "m" || i === "2") {
    return "bg-amber-50 text-amber-700 border border-amber-200";
  }
  if (i.includes("low") || i === "l" || i === "3") {
    return "bg-red-50 text-red-700 border border-red-200";
  }
  return "bg-slate-50 text-slate-500 border border-slate-200";
}

export function StatusBadge({ value, type }: BadgeProps) {
  if (!value || value === "Unknown" || value === "—") {
    return <span className="text-slate-400 text-xs">—</span>;
  }

  const style =
    type === "status" ? getStatusStyle(value) : getInterestStyle(value);

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium tracking-wide ${style}`}
    >
      {value}
    </span>
  );
}
