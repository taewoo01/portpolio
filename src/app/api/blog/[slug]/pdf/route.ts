import { NextRequest, NextResponse } from "next/server";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { getPostBySlug } from "@/lib/blog";
import { getUser } from "@/lib/server/auth";

export const maxDuration = 60;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const currentUser = await getUser();
  const post = await getPostBySlug(decodeURIComponent(slug), currentUser);
  if (!post || !post.published) {
    return NextResponse.json({ error: "글을 찾을 수 없습니다." }, { status: 404 });
  }

  const cookie = request.headers.get("cookie") ?? "";
  const isLocal = !process.env.VERCEL;

  const browser = await puppeteer.launch({
    args: puppeteer.defaultArgs({ args: chromium.args, headless: "shell" }),
    executablePath: isLocal
      ? process.env.CHROME_EXECUTABLE_PATH
      : await chromium.executablePath(),
    headless: "shell",
  });

  try {
    const page = await browser.newPage();
    if (cookie) await page.setExtraHTTPHeaders({ cookie });
    await page.goto(`${request.nextUrl.origin}/blog/${encodeURIComponent(slug)}`, {
      waitUntil: "networkidle0",
    });
    await page.emulateMediaType("print");
    const pdf = await page.pdf({ format: "a4", printBackground: true });

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(post.title)}.pdf"`,
      },
    });
  } finally {
    await browser.close();
  }
}
