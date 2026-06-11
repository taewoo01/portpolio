"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, dateFnsLocalizer, type SlotInfo } from "react-big-calendar";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { ko } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Button } from "@/components/ui/button";
import { EventDialog } from "./event-dialog";
import { USER_LABEL } from "@/lib/auth";
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
  taewoo: USER_LABEL.taewoo,
  yujin: USER_LABEL.yujin,
};

export function CalendarView({ events, currentUser }: { events: EventModel[]; currentUser: User | null }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventModel | null>(null);
  const [slotDate, setSlotDate] = useState<Date | null>(null);
  const [filter, setFilter] = useState<FilterUser>("all");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const filteredEvents = useMemo(
    () => filter === "all" ? events : events.filter((e) => e.createdBy === filter),
    [events, filter]
  );

  const calendarEvents = useMemo<CalendarEvent[]>(
    () =>
      filteredEvents.map((event) => ({
        id: event.id,
        title: event.title,
        start: event.startAt,
        end: event.allDay
          ? new Date((event.endAt ?? event.startAt).getTime() + 86400000)
          : (event.endAt ?? event.startAt),
        allDay: event.allDay,
        resource: event,
      })),
    [filteredEvents]
  );

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

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-medium">캘린더</h2>
          <div className="flex gap-0 rounded-lg border p-0.5 text-sm">
            {(["all", "taewoo", "yujin"] as FilterUser[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="relative rounded-md px-2.5 py-1 transition-colors duration-150"
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
        </div>
        <Button type="button" size="sm" onClick={() => openCreateDialog(new Date())}>
          일정 추가
        </Button>
      </div>

      <div className="h-[480px] md:h-[640px] rounded-md border p-2">
        <Calendar
          localizer={localizer}
          culture="ko"
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          views={isMobile ? ["month", "agenda"] : ["month", "week"]}
          defaultView="month"
          selectable
          popup
          onSelectEvent={(event) => openEditDialog(event.resource)}
          onSelectSlot={(slotInfo: SlotInfo) => openCreateDialog(slotInfo.start)}
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
                {event.resource.createdBy && (
                  <span className="shrink-0 opacity-70">
                    {event.resource.createdBy === "taewoo" ? "T" : "Y"}
                  </span>
                )}
              </div>
            ),
          }}
          messages={MESSAGES}
        />
      </div>

      <EventDialog open={dialogOpen} onOpenChange={setDialogOpen} event={selectedEvent} defaultStart={slotDate} currentUser={currentUser} />
    </div>
  );
}
