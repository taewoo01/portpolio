import { Suspense } from "react";
import { redirect } from "next/navigation";
import { TimerWidget } from "@/components/timer/timer-widget";
import { Skeleton } from "@/components/ui/skeleton";
import { FloatButton } from "@/components/timer/float-button";
import { CharacterPicker } from "@/components/timer/character-picker";
import { TodayActivity } from "@/components/timer/today-activity";
import { StudyChart } from "@/components/timer/study-chart";
import { SubjectBreakdown } from "@/components/timer/subject-breakdown";
import { getUser } from "@/lib/server/auth";
import { prisma } from "@/lib/db";
import {
  getActiveSession,
  getTodaySessions,
  getTodayActivity,
  getWeeklyStats,
  getMonthlyStats,
  getStudySubjects,
  getSubjectBreakdown,
} from "@/lib/timer";

export const metadata = { title: "타이머" };

export default async function TimerPage() {
  const currentUser = await getUser();
  if (!currentUser) redirect("/login");
  const [active, sessions, { documents, blogPosts }, weekly, monthly, subjects, subjectWeekly, subjectMonthly, profile] =
    await Promise.all([
      getActiveSession(),
      getTodaySessions(),
      getTodayActivity(currentUser),
      getWeeklyStats(),
      getMonthlyStats(),
      getStudySubjects(),
      getSubjectBreakdown("week"),
      getSubjectBreakdown("month"),
      prisma.aboutProfile.findUnique({
        where: { owner: currentUser },
        select: { timerCharacterUrl: true, timerCharacterEnabled: true },
      }),
    ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">타이머</h1>
          <CharacterPicker
            initialUrl={profile?.timerCharacterUrl ?? null}
            initialEnabled={profile?.timerCharacterEnabled ?? true}
          />
        </div>
        <FloatButton />
      </div>

      <Suspense
        fallback={
          <div className="rounded-xl border bg-card p-6">
            <div className="mb-6 flex flex-col items-center gap-2">
              <Skeleton className="h-14 w-64" />
            </div>
            <Skeleton className="h-9 w-full" />
          </div>
        }
      >
        <TimerWidget active={active} subjects={subjects} />
      </Suspense>

      <TodayActivity sessions={sessions} documents={documents} blogPosts={blogPosts} />

      <StudyChart weekly={weekly} monthly={monthly} />

      <SubjectBreakdown weekly={subjectWeekly} monthly={subjectMonthly} />
    </div>
  );
}
