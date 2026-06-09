"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

type DayStat = { date: string; seconds: number };

function formatMinutes(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function shortDate(dateStr: string, mode: "week" | "month") {
  const d = new Date(dateStr + "T00:00:00");
  if (mode === "week") return `${d.getMonth() + 1}/${d.getDate()}`;
  return String(d.getDate());
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { value: number }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      {formatMinutes(payload[0].value)}
    </div>
  );
}

export function StudyChart({
  weekly,
  monthly,
}: {
  weekly: DayStat[];
  monthly: DayStat[];
}) {
  const [tab, setTab] = useState<"week" | "month">("week");
  const data = tab === "week" ? weekly : monthly;

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">공부 통계</h2>
        <div className="flex gap-1 rounded-md border p-0.5 text-sm">
          {(["week", "month"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded px-3 py-1 transition-colors ${
                tab === t
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "week" ? "주간" : "월간"}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tickFormatter={(v) => shortDate(v, tab)}
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => (v === 0 ? "0" : formatMinutes(v))}
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
          <Bar dataKey="seconds" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.date}
                fill={entry.seconds > 0 ? "hsl(var(--primary))" : "hsl(var(--muted))"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
