"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CalendarDays } from "lucide-react";
import type { EventModel } from "@/generated/prisma/models";
import type { TaskWorkspace } from "@/generated/prisma/client";

const WORKSPACE_COLOR: Record<TaskWorkspace, string> = {
  dev: "#3b82f6",
  competition: "#ec4899",
  study: "#a855f7",
  exam: "#ef4444",
  appointment: "#f97316",
  exercise: "#22c55e",
  other: "#71717a",
};

const WORKSPACE_LABEL: Record<TaskWorkspace, string> = {
  dev: "개발",
  competition: "대회",
  study: "공부",
  exam: "시험",
  appointment: "약속",
  exercise: "운동",
  other: "기타",
};

export function MonthEventList({
  events,
  currentDate,
}: {
  events: EventModel[];
  currentDate: Date;
}) {
  const monthLabel = format(currentDate, "yyyy년 M월", { locale: ko });

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
          {events.map((event, i) => (
            <div
              key={`${event.id}_${i}`}
              className="flex items-center gap-3 rounded-xl bg-card px-4 py-3 shadow-sm ring-1 ring-border/50"
            >
              <div
                className="size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: WORKSPACE_COLOR[event.workspace] }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-medium">{event.title}</p>
                  {event.recurrence === "weekly" && (
                    <span className="shrink-0 text-xs text-muted-foreground">↻</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {event.allDay
                    ? format(event.startAt, "M.d (E)", { locale: ko }) + " 하루 종일"
                    : format(event.startAt, "M.d (E) HH:mm", { locale: ko })}
                </p>
              </div>
              <span
                className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                style={{ backgroundColor: WORKSPACE_COLOR[event.workspace] }}
              >
                {WORKSPACE_LABEL[event.workspace]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
