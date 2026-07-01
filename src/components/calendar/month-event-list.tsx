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
  return "매주 " + days.map((d) => DAY_NAMES[d]).join("·");
}

// --- types ---

type SeriesGroup = {
  type: "series";
  key: string;
  title: string;
  workspace: TaskWorkspace;
  recurrence: string;
  allEvents: EventModel[];      // 월 전체, startAt asc 정렬
  upcomingEvents: EventModel[]; // allEvents 중 startAt >= todayStart
};

type ListItem =
  | { type: "single"; event: EventModel }
  | SeriesGroup;

// --- grouping ---

function groupEvents(
  events: EventModel[],
  todayStart: Date
): { upcoming: ListItem[]; past: ListItem[] } {
  const seriesMap = new Map<string, EventModel[]>();
  const singles: EventModel[] = [];

  for (const event of events) {
    if (event.recurrence) {
      const key = `${event.title}::${event.recurrence}`;
      const bucket = seriesMap.get(key) ?? [];
      bucket.push(event);
      seriesMap.set(key, bucket);
    } else {
      singles.push(event);
    }
  }

  const upcomingItems: ListItem[] = [];
  const pastItems: ListItem[] = [];

  for (const [key, evs] of seriesMap) {
    const allEvents = [...evs].sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
    );
    const upcomingEvents = allEvents.filter(
      (e) => new Date(e.startAt) >= todayStart
    );
    const group: SeriesGroup = {
      type: "series",
      key,
      title: evs[0].title,
      workspace: evs[0].workspace,
      recurrence: evs[0].recurrence!,
      allEvents,
      upcomingEvents,
    };
    (upcomingEvents.length > 0 ? upcomingItems : pastItems).push(group);
  }

  for (const event of singles) {
    const item: ListItem = { type: "single", event };
    (new Date(event.startAt) >= todayStart ? upcomingItems : pastItems).push(item);
  }

  const nextDate = (item: ListItem): number =>
    item.type === "series"
      ? new Date(item.upcomingEvents[0].startAt).getTime()
      : new Date(item.event.startAt).getTime();

  const lastDate = (item: ListItem): number =>
    item.type === "series"
      ? new Date(item.allEvents[item.allEvents.length - 1].startAt).getTime()
      : new Date(item.event.startAt).getTime();

  upcomingItems.sort((a, b) => nextDate(a) - nextDate(b));
  pastItems.sort((a, b) => lastDate(b) - lastDate(a));

  return { upcoming: upcomingItems, past: pastItems };
}

// --- components ---

function EventCard({ event, past }: { event: EventModel; past?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl px-4 py-3 shadow-sm ring-1 transition-opacity",
        past ? "bg-muted/50 ring-border/30 opacity-50" : "bg-card ring-border/50"
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

function SeriesCard({
  group,
  past,
  todayStart,
}: {
  group: SeriesGroup;
  past?: boolean;
  todayStart: Date;
}) {
  const [expanded, setExpanded] = useState(false);

  const nextEvent = group.upcomingEvents[0] ?? null;
  const lastEvent = group.allEvents[group.allEvents.length - 1];
  const dateLabel = nextEvent
    ? `다음 ${format(nextEvent.startAt, "M.d (E)", { locale: ko })}`
    : `마지막 ${format(lastEvent.startAt, "M.d (E)", { locale: ko })}`;

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left shadow-sm ring-1 transition-opacity",
          past ? "bg-muted/50 ring-border/30 opacity-50" : "bg-card ring-border/50"
        )}
      >
        <div
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: past ? undefined : WORKSPACE_COLOR[group.workspace] }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className={cn("truncate text-sm font-medium", past && "text-muted-foreground line-through")}>
              {group.title}
            </p>
            <span className="shrink-0 text-xs text-muted-foreground">
              ↻ {formatRecurrence(group.recurrence)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {dateLabel} · 이번 달 {group.allEvents.length}회
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {!past && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
              style={{ backgroundColor: WORKSPACE_COLOR[group.workspace] }}
            >
              {WORKSPACE_LABEL[group.workspace]}
            </span>
          )}
          {expanded ? (
            <ChevronUp className="size-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-3.5 text-muted-foreground" />
          )}
        </div>
      </button>
      {expanded && (
        <div className="ml-4 flex flex-col gap-1.5 border-l-2 border-border/40 pl-3">
          {group.allEvents.map((event, i) => (
            <EventCard
              key={`${event.id}_${i}`}
              event={event}
              past={new Date(event.startAt) < todayStart}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ListItemCard({
  item,
  past,
  todayStart,
}: {
  item: ListItem;
  past?: boolean;
  todayStart: Date;
}) {
  if (item.type === "series") {
    return <SeriesCard group={item} past={past} todayStart={todayStart} />;
  }
  return <EventCard event={item.event} past={past} />;
}

// --- main export ---

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

  const { upcoming, past } = groupEvents(events, todayStart);

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

          {upcoming.map((item) => (
            <ListItemCard
              key={item.type === "series" ? item.key : item.event.id}
              item={item}
              todayStart={todayStart}
            />
          ))}

          {past.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setShowPast((v) => !v)}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                {showPast ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                지난 일정 {past.length}건
              </button>
              {showPast &&
                past.map((item) => (
                  <ListItemCard
                    key={item.type === "series" ? `past_${item.key}` : `past_${item.event.id}`}
                    item={item}
                    past
                    todayStart={todayStart}
                  />
                ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
