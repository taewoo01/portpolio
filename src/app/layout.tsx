import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { Navbar } from "@/components/layout/navbar";
import { PageTransition } from "@/components/layout/page-transition";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { SearchProvider } from "@/components/search/search-provider";
import { FloatingTimerProvider } from "@/lib/floating-timer-context";
import { FloatingTimer } from "@/components/timer/floating-timer";
import { getUser } from "@/lib/server/auth";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "portpolio",
    template: "%s | portpolio",
  },
  description: "개인 지식 허브 + 홈페이지",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "portpolio",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isFloat = pathname === "/timer/float";

  // float 창: Navbar/컨테이너 없이 바디만
  if (isFloat) {
    return (
      <html lang="ko" suppressHydrationWarning className={`${geistMono.variable} h-full antialiased`}>
        <head>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
        </head>
        <body className="h-full overflow-hidden bg-transparent">
          {children}
        </body>
      </html>
    );
  }

  const user = await getUser();

  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SearchProvider>
            <FloatingTimerProvider>
              <Navbar user={user} />
              <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-24 md:pb-8">
                <PageTransition>{children}</PageTransition>
              </main>
              <FloatingTimer />
            </FloatingTimerProvider>
          </SearchProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
