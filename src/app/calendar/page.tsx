import { addMonths, subMonths } from "date-fns";
import { getAllTodos, getEventsInRange } from "@/lib/calendar";
import { getUser } from "@/lib/server/auth";
import { CalendarSection } from "@/components/calendar/calendar-section";

export default async function CalendarPage() {
  const now = new Date();
  const currentUser = await getUser();
  const [events, todos] = await Promise.all([
    getEventsInRange(subMonths(now, 2), addMonths(now, 3), currentUser),
    getAllTodos(currentUser),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">일정</h1>
        <p className="text-sm text-muted-foreground">월간 캘린더와 할 일을 관리합니다.</p>
      </div>

      <CalendarSection events={events} todos={todos} currentUser={currentUser} />
    </div>
  );
}
