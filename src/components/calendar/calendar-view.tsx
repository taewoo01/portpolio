"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, dateFnsLocalizer, type SlotInfo } from "react-big-calendar";
import { addDays, addWeeks, endOfMonth, format, getDay, isSameDay, parse, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { ko } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventDialog } from "./event-dialog";
import { ALL_USERS, USER_LABEL, USER_INITIAL, hiddenUsersFor } from "@/lib/auth";
import type { TaskWorkspace } from "@/generated/prisma/client";
import type { EventModel } from "@/generated/prisma/models";
import type { User } from "@/lib/auth";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { ko },
});

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

const MESSAGES = {
  next: "다음",
  previous: "이전",
  today: "오늘",
  month: "월",
  week: "주",
  day: "일",
  agenda: "일정",
  date: "날짜",
  time: "시간",
  event: "일정",
  noEventsInRange: "해당 기간에 일정이 없습니다.",
};

type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: EventModel;
};

type FilterUser = "all" | User;

const FILTER_LABELS: Record<FilterUser, string> = {
  all: "전체",
  ...USER_LABEL,
};

function getRecurrenceDays(recurrence: string, startAt: Date): number[] {
  if (recurrence === "weekly") return [getDay(startAt)];
  const match = recurrence.match(/^weekly:(.+)$/);
  return match ? match[1].split(",").map(Number).filter(n => n >= 0 && n <= 6) : [getDay(startAt)];
}

function expandRecurringEvents(events: EventModel[], rangeStart: Date, rangeEnd: Date): CalendarEvent[] {
  const result: CalendarEvent[] = [];

  for (const event of events) {
    const duration = (event.endAt ?? event.startAt).getTime() - event.startAt.getTime();

    if (event.recurrence?.startsWith("weekly")) {
      const targetDays = getRecurrenceDays(event.recurrence, event.startAt);
      const startDay = getDay(event.startAt);

      for (const targetDay of targetDays) {
        const diff = (targetDay - startDay + 7) % 7;
        let cursor = addDays(new Date(event.startAt), diff);
        while (cursor <= rangeEnd) {
          if (cursor >= rangeStart) {
            const occurrenceEnd = new Date(cursor.getTime() + duration);
            result.push({
              id: `${event.id}_${targetDay}_${cursor.getTime()}`,
              title: event.title,
              start: new Date(cursor),
              end: event.allDay ? new Date(occurrenceEnd.getTime() + 86400000) : occurrenceEnd,
              allDay: event.allDay,
              resource: event,
            });
          }
          cursor = addWeeks(cursor, 1);
        }
      }
    } else {
      result.push({
        id: event.id,
        title: event.title,
        start: event.startAt,
        end: event.allDay
          ? new Date((event.endAt ?? event.startAt).getTime() + 86400000)
          : (event.endAt ?? event.startAt),
        allDay: event.allDay,
        resource: event,
      });
    }
  }

  return result;
}

export function CalendarView({
  events,
  currentUser,
  onDateChange,
}: {
  events: EventModel[];
  currentUser: User | null;
  onDateChange?: (date: Date, monthEvents: EventModel[]) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventModel | null>(null);
  const [slotDate, setSlotDate] = useState<Date | null>(null);
  const [filter, setFilter] = useState<FilterUser>("all");
  const [isMobile, setIsMobile] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const dayPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const chipScrollRef = useRef<HTMLDivElement>(null);
  const [fade, setFade] = useState({ left: false, right: false });

  const updateFade = useCallback(() => {
    const el = chipScrollRef.current;
    if (!el) return;
    setFade({
      left: el.scrollLeft > 2,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 2,
    });
  }, []);

  useEffect(() => {
    updateFade();
    const el = chipScrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver(updateFade);
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateFade]);

  const filterOptions = useMemo<FilterUser[]>(() => {
    const hidden = hiddenUsersFor(currentUser);
    return ["all", ...ALL_USERS.filter((u) => !hidden.includes(u))];
  }, [currentUser]);

  const filteredEvents = useMemo(
    () => filter === "all" ? events : events.filter((e) => e.createdBy === filter),
    [events, filter]
  );

  const calendarEvents = useMemo<CalendarEvent[]>(() => {
    const rangeStart = startOfMonth(currentDate);
    rangeStart.setMonth(rangeStart.getMonth() - 3);
    const rangeEnd = endOfMonth(currentDate);
    rangeEnd.setMonth(rangeEnd.getMonth() + 3);
    return expandRecurringEvents(filteredEvents, rangeStart, rangeEnd);
  }, [filteredEvents, currentDate]);

  const monthEvents = useMemo(() => {
    const ms = startOfMonth(currentDate);
    const me = endOfMonth(currentDate);
    return filteredEvents
      .flatMap((event) => {
        if (event.recurrence?.startsWith("weekly")) {
          const targetDays = getRecurrenceDays(event.recurrence, event.startAt);
          const startDay = getDay(event.startAt);
          const occurrences: EventModel[] = [];
          for (const targetDay of targetDays) {
            const diff = (targetDay - startDay + 7) % 7;
            let cursor = addDays(new Date(event.startAt), diff);
            while (cursor <= me) {
              if (cursor >= ms) occurrences.push({ ...event, startAt: new Date(cursor) });
              cursor = addWeeks(cursor, 1);
            }
          }
          return occurrences;
        }
        const s = event.startAt;
        return s >= ms && s <= me ? [event] : [];
      })
      .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  }, [filteredEvents, currentDate]);

  const dayEvents = useMemo(() => {
    if (!isMobile) return [];
    const dayStart = startOfDay(selectedDate);
    const dayEnd = addDays(dayStart, 1);
    return calendarEvents
      .filter((e) => e.start < dayEnd && e.end > dayStart)
      .sort((a, b) =>
        a.allDay === b.allDay ? a.start.getTime() - b.start.getTime() : a.allDay ? -1 : 1
      );
  }, [calendarEvents, selectedDate, isMobile]);

  useEffect(() => {
    onDateChange?.(currentDate, monthEvents);
  }, [currentDate, monthEvents]);

  function openCreateDialog(date: Date) {
    setSelectedEvent(null);
    setSlotDate(date);
    setDialogOpen(true);
  }

  function openEditDialog(event: EventModel) {
    setSelectedEvent(event);
    setSlotDate(null);
    setDialogOpen(true);
  }

  function selectDay(date: Date) {
    setSelectedDate(date);
    requestAnimationFrame(() => {
      dayPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-medium">캘린더</h2>
        <Button type="button" size="sm" className="shrink-0" onClick={() => openCreateDialog(new Date())}>
          일정 추가
        </Button>
      </div>

      <div className="relative w-fit max-w-full">
        <div
          ref={chipScrollRef}
          onScroll={updateFade}
          className="scrollbar-hide flex gap-0 overflow-x-auto rounded-lg border p-0.5 text-sm"
        >
          {filterOptions.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="relative shrink-0 whitespace-nowrap rounded-md px-2.5 py-1 transition-colors duration-150"
            >
              {filter === f && (
                <motion.div
                  layoutId="filter-indicator"
                  className="absolute inset-0 rounded-md bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span className={`relative z-10 ${filter === f ? "font-semibold text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {FILTER_LABELS[f]}
              </span>
            </button>
          ))}
        </div>
        {fade.left && (
          <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-8 rounded-l-lg bg-gradient-to-r from-background to-transparent" />
        )}
        {fade.right && (
          <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-8 rounded-r-lg bg-gradient-to-l from-background to-transparent" />
        )}
      </div>

      <div className="h-[480px] md:h-[640px] rounded-md border p-2">
        <Calendar
          localizer={localizer}
          culture="ko"
          events={calendarEvents}
          date={currentDate}
          onNavigate={setCurrentDate}
          startAccessor="start"
          endAccessor="end"
          views={isMobile ? ["month", "agenda"] : ["month", "week"]}
          defaultView="month"
          selectable
          longPressThreshold={50}
          popup
          onSelectEvent={(event) => {
            if (isMobile) selectDay(event.start);
            else openEditDialog(event.resource);
          }}
          onSelectSlot={(slotInfo: SlotInfo) => {
            if (isMobile) selectDay(slotInfo.start);
            else openCreateDialog(slotInfo.start);
          }}
          onDrillDown={isMobile ? (date: Date) => selectDay(date) : undefined}
          dayPropGetter={(date) =>
            isMobile && isSameDay(date, selectedDate) ? { className: "rbc-selected-day" } : {}
          }
          eventPropGetter={(event) => ({
            style: {
              backgroundColor: WORKSPACE_COLOR[event.resource.workspace],
              borderColor: "transparent",
            },
          })}
          components={{
            event: ({ event }) => (
              <div className="flex items-center gap-1 overflow-hidden">
                <span className="truncate">{event.title}</span>
                {event.resource.recurrence?.startsWith("weekly") && (
                  <span className="shrink-0 opacity-60 text-[10px]">↻</span>
                )}
                {event.resource.createdBy && (
                  <span className="shrink-0 opacity-70">
                    {USER_INITIAL[event.resource.createdBy as User]}
                  </span>
                )}
              </div>
            ),
          }}
          messages={MESSAGES}
        />
      </div>

      {isMobile && (
        <div ref={dayPanelRef} className="scroll-mb-20 rounded-xl border p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium">
              {format(selectedDate, "M월 d일 (E)", { locale: ko })}
            </h3>
            <button
              type="button"
              onClick={() => openCreateDialog(selectedDate)}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-accent"
            >
              <Plus className="size-3.5" />
              추가
            </button>
          </div>
          {dayEvents.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">일정이 없습니다</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {dayEvents.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => openEditDialog(e.resource)}
                    className="flex w-full items-center gap-2.5 rounded-lg bg-card px-3 py-2.5 text-left shadow-sm ring-1 ring-border/50 transition-colors hover:bg-accent"
                  >
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: WORKSPACE_COLOR[e.resource.workspace] }}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{e.title}</span>
                    {e.resource.createdBy && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {USER_LABEL[e.resource.createdBy as User]}
                      </span>
                    )}
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {e.allDay ? "하루 종일" : format(e.start, "HH:mm")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <EventDialog open={dialogOpen} onOpenChange={setDialogOpen} event={selectedEvent} defaultStart={slotDate} currentUser={currentUser} />
    </div>
  );
}
