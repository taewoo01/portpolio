import Link from "next/link";
import { cn } from "@/lib/utils";
import { TASK_WORKSPACE_BADGE_CLASS, TASK_WORKSPACE_LABEL } from "@/lib/workspace";
import type { EventModel, TodoModel } from "@/generated/prisma/models";

export function TodaySection({ events, todos }: { events: EventModel[]; todos: TodoModel[] }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">오늘 일정</h2>
        <Link href="/calendar" className="text-sm text-primary hover:underline">
          캘린더 전체보기 →
        </Link>
      </div>

      {events.length === 0 && todos.length === 0 ? (
        <p className="text-sm text-muted-foreground">오늘 예정된 일정이나 할 일이 없습니다.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">오늘 일정</h3>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">오늘 일정이 없습니다.</p>
            ) : (
              <ul className="space-y-1.5">
                {events.map((event) => (
                  <li key={event.id} className="flex items-center gap-2 text-sm">
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        TASK_WORKSPACE_BADGE_CLASS[event.workspace]
                      )}
                    >
                      {TASK_WORKSPACE_LABEL[event.workspace]}
                    </span>
                    <span className="truncate">{event.title}</span>
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                      {event.allDay
                        ? "종일"
                        : event.startAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">미완료 할 일</h3>
            {todos.length === 0 ? (
              <p className="text-sm text-muted-foreground">미완료 할 일이 없습니다.</p>
            ) : (
              <ul className="space-y-1.5">
                {todos.map((todo) => (
                  <li key={todo.id} className="flex items-center gap-2 text-sm">
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        TASK_WORKSPACE_BADGE_CLASS[todo.workspace]
                      )}
                    >
                      {TASK_WORKSPACE_LABEL[todo.workspace]}
                    </span>
                    <span className="truncate">{todo.title}</span>
                    {todo.dueDate && (
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                        {todo.dueDate.toLocaleDateString("ko-KR")}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
