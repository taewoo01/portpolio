"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import type { SubjectBreakdownItem } from "@/lib/timer";

function formatMinutes(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}시간 ${m}분`;
  if (h > 0) return `${h}시간`;
  if (m > 0) return `${m}분`;
  return "0분";
}

function ChangeBadge({ percent }: { percent: number | null }) {
  if (percent === null) {
    return <span className="text-xs font-medium text-primary">신규</span>;
  }
  if (percent === 0) {
    return (
      <span className="flex items-center gap-0.5 text-xs font-medium text-muted-foreground">
        <Minus className="size-3" />
        0%
      </span>
    );
  }
  const up = percent > 0;
  return (
    <span
      className={`flex items-center gap-0.5 text-xs font-medium ${
        up ? "text-green-600 dark:text-green-400" : "text-red-500"
      }`}
    >
      {up ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
      {Math.abs(percent)}%
    </span>
  );
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: SubjectBreakdownItem }[];
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{item.name}</p>
      <p className="text-muted-foreground">{formatMinutes(item.seconds)}</p>
    </div>
  );
}

export function SubjectBreakdown({
  weekly,
  monthly,
}: {
  weekly: SubjectBreakdownItem[];
  monthly: SubjectBreakdownItem[];
}) {
  const [tab, setTab] = useState<"week" | "month">("week");
  const items = tab === "week" ? weekly : monthly;
  const total = items.reduce((sum, i) => sum + i.seconds, 0);
  const max = Math.max(...items.map((i) => i.seconds), 1);

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium">과목별 분석</h2>
        <div className="flex gap-1 rounded-md border p-0.5 text-sm">
          {(["week", "month"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`focus-ring rounded px-3 py-1 transition-colors ${
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

      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {tab === "week" ? "이번 주" : "이번 달"} 과목별로 기록된 공부 시간이 없습니다.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={items}
                  dataKey="seconds"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {items.map((item) => (
                    <Cell key={item.subjectId ?? "none"} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute flex flex-col items-center">
              <span className="text-xs text-muted-foreground">총 공부 시간</span>
              <span className="font-mono text-lg font-semibold">{formatMinutes(total)}</span>
            </div>
          </div>

          <ul className="flex flex-col justify-center gap-3">
            {items.map((item) => (
              <li key={item.subjectId ?? "none"} className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="flex min-w-0 items-center gap-1.5 truncate">
                    <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="truncate font-medium">{item.name}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-muted-foreground">{formatMinutes(item.seconds)}</span>
                    <ChangeBadge percent={item.changePercent} />
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(item.seconds / max) * 100}%`, backgroundColor: item.color }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
