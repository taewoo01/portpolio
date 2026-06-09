import { Suspense } from "react";
import { TimerWidget } from "@/components/timer/timer-widget";
import { TodayActivity } from "@/components/timer/today-activity";
import { StudyChart } from "@/components/timer/study-chart";
import {
  getActiveSession,
  getTodaySessions,
  getTodayActivity,
  getWeeklyStats,
  getMonthlyStats,
} from "@/lib/timer";

export const metadata = { title: "타이머" };

export default async function TimerPage() {
  const [active, sessions, { documents, blogPosts }, weekly, monthly] = await Promise.all([
    getActiveSession(),
    getTodaySessions(),
    getTodayActivity(),
    getWeeklyStats(),
    getMonthlyStats(),
  ]);

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-bold">타이머</h1>

      <Suspense>
        <TimerWidget active={active} />
      </Suspense>

      <TodayActivity sessions={sessions} documents={documents} blogPosts={blogPosts} />

      <StudyChart weekly={weekly} monthly={monthly} />
    </main>
  );
}
