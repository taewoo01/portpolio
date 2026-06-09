import { addMonths, subMonths } from "date-fns";
import { getAllTodos, getEventsInRange } from "@/lib/calendar";
import { getUser } from "@/lib/server/auth";
import { CalendarView } from "@/components/calendar/calendar-view";
import { TodoList } from "@/components/calendar/todo-list";

export default async function CalendarPage() {
  const now = new Date();
  const [events, todos, currentUser] = await Promise.all([
    getEventsInRange(subMonths(now, 2), addMonths(now, 3)),
    getAllTodos(),
    getUser(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">일정</h1>
        <p className="text-sm text-muted-foreground">월간 캘린더와 할 일을 관리합니다.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <CalendarView events={events} currentUser={currentUser} />
        <TodoList todos={todos} currentUser={currentUser} />
      </div>
    </div>
  );
}
