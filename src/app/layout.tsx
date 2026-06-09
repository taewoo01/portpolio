import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/layout/navbar";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { SearchProvider } from "@/components/search/search-provider";
import { getUser } from "@/lib/server/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

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
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUser();

  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SearchProvider>
            <Navbar user={user} />
            <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
              {children}
            </main>
          </SearchProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
