"use client";

import { useState } from "react";
import { format, startOfDay } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarDays, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EventModel } from "@/generated/prisma/models";
import type { TaskWorkspace } from "@/generated/prisma/client";

const WORKSPACE_COLOR: Record<TaskWorkspace, string> = {
  dev: "#3b82f6",
  competition: "#ec4899",
  study: "#a855f7",
  exam: "#ef4444",
  appointment: "#f97316",
  exercise: "#22c55e",
  alba: "#eab308",
  other: "#71717a",
};

const WORKSPACE_LABEL: Record<TaskWorkspace, string> = {
  dev: "개발",
  competition: "대회",
  study: "공부",
  exam: "시험",
  appointment: "약속",
  exercise: "운동",
  alba: "알바",
  other: "기타",
};

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

function formatRecurrence(recurrence: string): string {
  if (recurrence === "weekly") return "매주";
  const match = recurrence.match(/^weekly:(.+)$/);
  if (!match) return "매주";
  const days = match[1].split(",").map(Number).sort((a, b) => a - b);
  if (days.length === 7) return "매일";
  return "매주 " + days.map(d => DAY_NAMES[d]).join("·");
}

function EventCard({ event, past }: { event: EventModel; past?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl px-4 py-3 shadow-sm ring-1 transition-opacity",
        past
          ? "bg-muted/50 ring-border/30 opacity-50"
          : "bg-card ring-border/50"
      )}
    >
      <div
        className="size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: past ? undefined : WORKSPACE_COLOR[event.workspace] }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className={cn("truncate text-sm font-medium", past && "text-muted-foreground line-through")}>
            {event.title}
          </p>
          {event.recurrence?.startsWith("weekly") && (
            <span className="shrink-0 text-xs text-muted-foreground">
              ↻ {formatRecurrence(event.recurrence)}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {event.allDay
            ? format(event.startAt, "M.d (E)", { locale: ko }) + " 하루 종일"
            : format(event.startAt, "M.d (E) HH:mm", { locale: ko })}
        </p>
      </div>
      {!past && (
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
          style={{ backgroundColor: WORKSPACE_COLOR[event.workspace] }}
        >
          {WORKSPACE_LABEL[event.workspace]}
        </span>
      )}
    </div>
  );
}

export function MonthEventList({
  events,
  currentDate,
}: {
  events: EventModel[];
  currentDate: Date;
}) {
  const [showPast, setShowPast] = useState(false);
  const monthLabel = format(currentDate, "yyyy년 M월", { locale: ko });
  const todayStart = startOfDay(new Date());

  const upcoming = events
    .filter((e) => new Date(e.startAt) >= todayStart)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  const past = events
    .filter((e) => new Date(e.startAt) < todayStart)
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());

  return (
    <div className="mt-2">
      <div className="mb-3 flex items-center gap-2">
        <CalendarDays className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">{monthLabel} 일정</h3>
        <span className="ml-auto text-xs text-muted-foreground">{events.length}개</span>
      </div>

      {events.length === 0 ? (
        <div className="flex h-20 items-center justify-center rounded-xl bg-muted/40 text-sm text-muted-foreground">
          이번 달 일정이 없습니다
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {upcoming.length === 0 && past.length > 0 && (
            <div className="flex h-16 items-center justify-center rounded-xl bg-muted/40 text-sm text-muted-foreground">
              남은 일정이 없습니다
            </div>
          )}

          {upcoming.map((event, i) => (
            <EventCard key={`${event.id}_${i}`} event={event} />
          ))}

          {past.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setShowPast((v) => !v)}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                {showPast ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                지난 일정 {past.length}개
              </button>
              {showPast && past.map((event, i) => (
                <EventCard key={`past_${event.id}_${i}`} event={event} past />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
