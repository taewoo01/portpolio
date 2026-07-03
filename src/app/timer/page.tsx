import { Suspense } from "react";
import { redirect } from "next/navigation";
import { TimerWidget } from "@/components/timer/timer-widget";
import { FloatButton } from "@/components/timer/float-button";
import { TodayActivity } from "@/components/timer/today-activity";
import { StudyChart } from "@/components/timer/study-chart";
import { getUser } from "@/lib/server/auth";
import {
  getActiveSession,
  getTodaySessions,
  getTodayActivity,
  getWeeklyStats,
  getMonthlyStats,
} from "@/lib/timer";

export const metadata = { title: "타이머" };

export default async function TimerPage() {
  const currentUser = await getUser();
  if (!currentUser) redirect("/login");
  const [active, sessions, { documents, blogPosts }, weekly, monthly] = await Promise.all([
    getActiveSession(),
    getTodaySessions(),
    getTodayActivity(currentUser),
    getWeeklyStats(),
    getMonthlyStats(),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">타이머</h1>
        <FloatButton />
      </div>

      <Suspense>
        <TimerWidget active={active} />
      </Suspense>

      <TodayActivity sessions={sessions} documents={documents} blogPosts={blogPosts} />

      <StudyChart weekly={weekly} monthly={monthly} />
    </div>
  );
}
