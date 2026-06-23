import { getPendingTodos, getTodayEvents } from "@/lib/calendar";
import { getInProgressDocuments, getRecentBlogPosts, getRecentDocuments } from "@/lib/dashboard";
import { getSiteStats } from "@/lib/stats";
import { getUser } from "@/lib/server/auth";
import { TodaySection } from "@/components/dashboard/today-section";
import { RecentDocuments } from "@/components/dashboard/recent-documents";
import { InProgressDocuments } from "@/components/dashboard/in-progress-documents";
import { RecentBlogPosts } from "@/components/dashboard/recent-blog-posts";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { HeroSection } from "@/components/dashboard/hero-section";

export default async function Home() {
  const user = await getUser();
  const [todayEvents, pendingTodos, recentDocuments, inProgressDocuments, recentBlogPosts, stats] =
    await Promise.all([
      getTodayEvents(user),
      getPendingTodos(5, user),
      getRecentDocuments(5, user),
      getInProgressDocuments(10, user),
      getRecentBlogPosts(3, user),
      getSiteStats(user),
    ]);

  return (
    <div className="space-y-10">
      <HeroSection user={user} />
      <StatsCards
        totalDocuments={stats.totalDocuments}
        publishedPosts={stats.publishedPosts}
        pendingTodos={stats.pendingTodos}
        completedThisMonth={stats.completedThisMonth}
      />
      <TodaySection events={todayEvents} todos={pendingTodos} />
      <RecentDocuments documents={recentDocuments} />
      <InProgressDocuments documents={inProgressDocuments} />
      <RecentBlogPosts posts={recentBlogPosts} />
    </div>
  );
}
