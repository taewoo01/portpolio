import { prisma } from "@/lib/db";
import { visibilityWhere } from "@/lib/auth";
import type { User } from "@/lib/auth";

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export async function getTodaySessions() {
  const { start, end } = todayRange();
  return prisma.studySession.findMany({
    where: { startAt: { gte: start, lte: end }, endAt: { not: null } },
    orderBy: { startAt: "desc" },
  });
}

export async function getActiveSession() {
  return prisma.studySession.findFirst({
    where: { endAt: null },
    orderBy: { startAt: "desc" },
  });
}

export async function getStudySubjects() {
  return prisma.studySubject.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function getTodayActivity(currentUser: User | null = null) {
  const { start, end } = todayRange();
  const visibility = visibilityWhere(currentUser);
  const [documents, blogPosts] = await Promise.all([
    prisma.document.findMany({
      where: { updatedAt: { gte: start, lte: end }, ...visibility },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        workspaceCategory: { select: { id: true, name: true, color: true } },
      },
    }),
    prisma.blogPost.findMany({
      where: { published: true, publishedAt: { gte: start, lte: end }, ...visibility },
      orderBy: { publishedAt: "desc" },
      select: { id: true, title: true, slug: true, publishedAt: true },
    }),
  ]);
  return { documents, blogPosts };
}

export async function getWeeklyStats() {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  const sessions = await prisma.studySession.findMany({
    where: { startAt: { gte: start, lte: end }, duration: { not: null } },
    select: { startAt: true, duration: true },
  });

  return buildDailyStats(sessions, start, 7);
}

export async function getMonthlyStats() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const end = new Date(now.getFullYear(), now.getMonth(), daysInMonth, 23, 59, 59, 999);

  const sessions = await prisma.studySession.findMany({
    where: { startAt: { gte: start, lte: end }, duration: { not: null } },
    select: { startAt: true, duration: true },
  });

  return buildDailyStats(sessions, start, daysInMonth);
}

export type SubjectBreakdownItem = {
  subjectId: string | null;
  name: string;
  color: string;
  seconds: number;
  previousSeconds: number;
  changePercent: number | null; // null = 지난 기간 기록 없음(비교 불가/신규)
};

function sumBySubject(sessions: { subjectId: string | null; duration: number | null }[]) {
  const map = new Map<string, number>();
  for (const s of sessions) {
    const key = s.subjectId ?? "__none__";
    map.set(key, (map.get(key) ?? 0) + (s.duration ?? 0));
  }
  return map;
}

export async function getSubjectBreakdown(range: "week" | "month" = "week"): Promise<SubjectBreakdownItem[]> {
  const now = new Date();
  let currentStart: Date;
  let currentEnd: Date;
  let previousStart: Date;
  let previousEnd: Date;

  if (range === "week") {
    currentEnd = new Date(now);
    currentEnd.setHours(23, 59, 59, 999);
    currentStart = new Date(currentEnd);
    currentStart.setDate(currentStart.getDate() - 6);
    currentStart.setHours(0, 0, 0, 0);

    previousEnd = new Date(currentStart);
    previousEnd.setDate(previousEnd.getDate() - 1);
    previousEnd.setHours(23, 59, 59, 999);
    previousStart = new Date(previousEnd);
    previousStart.setDate(previousStart.getDate() - 6);
    previousStart.setHours(0, 0, 0, 0);
  } else {
    currentStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    currentEnd = new Date(now.getFullYear(), now.getMonth(), daysInMonth, 23, 59, 59, 999);

    previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    previousEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  }

  const [subjects, currentSessions, previousSessions] = await Promise.all([
    prisma.studySubject.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.studySession.findMany({
      where: { startAt: { gte: currentStart, lte: currentEnd }, duration: { not: null } },
      select: { subjectId: true, duration: true },
    }),
    prisma.studySession.findMany({
      where: { startAt: { gte: previousStart, lte: previousEnd }, duration: { not: null } },
      select: { subjectId: true, duration: true },
    }),
  ]);

  const currentMap = sumBySubject(currentSessions);
  const previousMap = sumBySubject(previousSessions);

  function toItem(subjectId: string | null, name: string, color: string): SubjectBreakdownItem {
    const key = subjectId ?? "__none__";
    const seconds = currentMap.get(key) ?? 0;
    const previousSeconds = previousMap.get(key) ?? 0;
    const changePercent =
      previousSeconds > 0 ? Math.round(((seconds - previousSeconds) / previousSeconds) * 100) : null;
    return { subjectId, name, color, seconds, previousSeconds, changePercent };
  }

  const items = subjects
    .map((s) => toItem(s.id, s.name, s.color))
    .filter((item) => item.seconds > 0 || item.previousSeconds > 0);

  const unassigned = toItem(null, "미분류", "#a1a1aa");
  if (unassigned.seconds > 0 || unassigned.previousSeconds > 0) items.push(unassigned);

  items.sort((a, b) => b.seconds - a.seconds);
  return items;
}

function buildDailyStats(
  sessions: { startAt: Date; duration: number | null }[],
  start: Date,
  days: number
) {
  const map = new Map<string, number>();
  for (const s of sessions) {
    const key = s.startAt.toISOString().slice(0, 10);
    map.set(key, (map.get(key) ?? 0) + (s.duration ?? 0));
  }

  return Array.from({ length: days }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    return { date: key, seconds: map.get(key) ?? 0 };
  });
}
