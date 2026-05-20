"use client";

import { FundData, Task } from "@/types/fund";
import { StatusBadge } from "./StatusBadge";
import { formatCompact } from "@/lib/formatters";
import { useState } from "react";

interface Props {
  funds: FundData[];
}

function TaskCard({ task }: { task: Task }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 hover:border-slate-300 transition-colors shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="font-semibold text-slate-900 text-sm leading-tight">{task.lpName}</div>
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
          style={{
            backgroundColor:
              task.fundId === "jvf2"
                ? "#0f4c8115"
                : task.fundId === "anf"
                ? "#1a6b3c15"
                : "#7c3aed15",
            color:
              task.fundId === "jvf2"
                ? "#0f4c81"
                : task.fundId === "anf"
                ? "#1a6b3c"
                : "#7c3aed",
          }}
        >
          {task.fundName}
        </span>
      </div>

      {task.action && task.action !== "Follow up" && (
        <p className="text-xs text-slate-600 leading-relaxed">{task.action}</p>
      )}

      <div className="flex items-center flex-wrap gap-1.5 pt-1">
        <StatusBadge value={task.status} type="status" />
        <StatusBadge value={task.interest} type="interest" />
        {task.amount > 0 && (
          <span className="text-[11px] font-mono text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
            {formatCompact(task.amount, task.currency)}
          </span>
        )}
      </div>
    </div>
  );
}

export function TaskBoard({ funds }: Props) {
  const [selectedFund, setSelectedFund] = useState<string>("all");

  // Merge tasks across funds
  const allTasksByPerson: Record<string, Task[]> = {};
  for (const fund of funds) {
    if (selectedFund !== "all" && fund.config.id !== selectedFund) continue;
    for (const [person, tasks] of Object.entries(fund.tasks)) {
      if (!allTasksByPerson[person]) allTasksByPerson[person] = [];
      allTasksByPerson[person].push(...tasks);
    }
  }

  const sortedPeople = Object.keys(allTasksByPerson).sort((a, b) => {
    if (a === "Unassigned") return 1;
    if (b === "Unassigned") return -1;
    return a.localeCompare(b);
  });

  const totalTasks = Object.values(allTasksByPerson).reduce((s, t) => s + t.length, 0);

  return (
    <div className="space-y-6">
      {/* Fund filter tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedFund("all")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            selectedFund === "all"
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          All Funds
        </button>
        {funds.map((f) => (
          <button
            key={f.config.id}
            onClick={() => setSelectedFund(f.config.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedFund === f.config.id
                ? "text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            style={
              selectedFund === f.config.id
                ? { backgroundColor: f.config.color }
                : {}
            }
          >
            {f.config.shortName}
          </button>
        ))}
      </div>

      <div className="text-sm text-slate-500">
        {totalTasks} tasks across {sortedPeople.length} team members
      </div>

      {sortedPeople.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-400">
          No tasks found for this selection.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedPeople.map((person) => {
            const tasks = allTasksByPerson[person];
            return (
              <div key={person} className="space-y-3">
                {/* Person header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {person === "Unassigned"
                        ? "?"
                        : person
                            .split(" ")
                            .map((w) => w[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                    </div>
                    <span className="font-semibold text-slate-800">{person}</span>
                  </div>
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                    {tasks.length}
                  </span>
                </div>

                {/* Task cards */}
                <div className="space-y-2">
                  {tasks.map((task, i) => (
                    <TaskCard key={i} task={task} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
