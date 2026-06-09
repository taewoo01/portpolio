import { getPendingTodos, getTodayEvents } from "@/lib/calendar";
import { getInProgressDocuments, getRecentBlogPosts, getRecentDocuments } from "@/lib/dashboard";
import { getSiteStats } from "@/lib/stats";
import { TodaySection } from "@/components/dashboard/today-section";
import { RecentDocuments } from "@/components/dashboard/recent-documents";
import { InProgressDocuments } from "@/components/dashboard/in-progress-documents";
import { RecentBlogPosts } from "@/components/dashboard/recent-blog-posts";
import { StatsCards } from "@/components/dashboard/stats-cards";

export default async function Home() {
  const [todayEvents, pendingTodos, recentDocuments, inProgressDocuments, recentBlogPosts, stats] =
    await Promise.all([
      getTodayEvents(),
      getPendingTodos(5),
      getRecentDocuments(5),
      getInProgressDocuments(10),
      getRecentBlogPosts(3),
      getSiteStats(),
    ]);

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-semibold">홈</h1>
      <StatsCards
        devDocuments={stats.devDocuments}
        studyDocuments={stats.studyDocuments}
        publishedPosts={stats.publishedPosts}
        pendingTodos={stats.pendingTodos}
      />
      <TodaySection events={todayEvents} todos={pendingTodos} />
      <RecentDocuments dev={recentDocuments.dev} study={recentDocuments.study} />
      <InProgressDocuments documents={inProgressDocuments} />
      <RecentBlogPosts posts={recentBlogPosts} />
    </div>
  );
}
