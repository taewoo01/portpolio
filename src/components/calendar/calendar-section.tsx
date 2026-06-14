"use client";

import { useCallback, useState } from "react";
import { CalendarView } from "./calendar-view";
import { TodoList } from "./todo-list";
import { MonthEventList } from "./month-event-list";
import type { EventModel } from "@/generated/prisma/models";
import type { TodoModel } from "@/generated/prisma/models";
import type { User } from "@/lib/auth";

export function CalendarSection({
  events,
  todos,
  currentUser,
}: {
  events: EventModel[];
  todos: TodoModel[];
  currentUser: User | null;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthEvents, setMonthEvents] = useState<EventModel[]>([]);

  const handleDateChange = useCallback((date: Date, events: EventModel[]) => {
    setCurrentDate(date);
    setMonthEvents(events);
  }, []);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <CalendarView events={events} currentUser={currentUser} onDateChange={handleDateChange} />
      <div className="flex flex-col gap-6">
        <TodoList todos={todos} currentUser={currentUser} />
        <MonthEventList events={monthEvents} currentDate={currentDate} />
      </div>
    </div>
  );
}
