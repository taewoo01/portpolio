import { NextRequest, NextResponse } from "next/server";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";
import { getPostBySlug } from "@/lib/blog";
import { getUser } from "@/lib/server/auth";

export const maxDuration = 60;

// A4 @ 96dpi
const PAGE_WIDTH_PX = Math.round((210 / 25.4) * 96);
const PAGE_HEIGHT_PX = (297 / 25.4) * 96;

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
    await page.setViewport({ width: PAGE_WIDTH_PX, height: 1000 });
    if (cookie) await page.setExtraHTTPHeaders({ cookie });
    await page.goto(`${request.nextUrl.origin}/blog/${encodeURIComponent(slug)}`, {
      waitUntil: "networkidle0",
    });
    await page.emulateMediaType("print");
    await page.evaluate(() => document.fonts.ready);

    // 페이지 경계보다 큰 이미지는, 그 시작 지점에 남은 공간에 맞춰 줄이거나
    // (충분한 공간이 있을 때) 다음 페이지로 넘긴다(공간이 너무 부족할 때).
    // 그래야 빈 페이지가 큰 공백으로 남는 일이 없다.
    //
    // 단, break-before를 "한 페이지보다 큰" 이미지에 걸면 크롬이 페이지를 하나 더
    // 낭비하는 버그가 있어서(실측 확인됨), 그 경우는 강제 break 대신 남은 공간에
    // 맞춰 줄이거나(가능하면) 그대로 둬서 브라우저의 기본 흐름에 맡긴다.
    await page.evaluate((pageHeight) => {
      // getBoundingClientRect() 측정 시점과 실제 PDF 페이지네이션 엔진이 쓰는 값 사이에
      // 서브픽셀 단위 오차가 있어서, 줄인 높이가 남은 공간에 딱 맞으면(8px 정도 여유로는)
      // 그 미세한 오차만으로도 다음 페이지로 밀려버린다(실측 확인됨). 충분히 여유를 둔다.
      const SAFETY_BUFFER_PX = 40;
      const images = Array.from(document.querySelectorAll<HTMLImageElement>("#print-area img"));
      for (const img of images) {
        const rect = img.getBoundingClientRect();
        const naturalHeight = rect.height;
        const relativeTop = rect.top % pageHeight;
        const remaining = pageHeight - relativeTop;
        if (naturalHeight <= remaining) continue; // 이미 한 페이지에 들어감

        if (naturalHeight <= pageHeight) {
          if (remaining >= naturalHeight * 0.5) {
            img.style.maxHeight = `${Math.floor(remaining - SAFETY_BUFFER_PX)}px`;
            img.style.width = "auto";
          } else {
            img.style.breakBefore = "page";
          }
          continue;
        }

        // 한 페이지보다 큰 이미지: 남은 공간이 쓸 만하면 그 자리에서 줄여서 보여주고,
        // 너무 작으면 손대지 않아 브라우저가 자연스럽게 다음 페이지로 넘기게 둔다.
        if (remaining >= pageHeight * 0.3) {
          img.style.maxHeight = `${Math.floor(remaining - SAFETY_BUFFER_PX)}px`;
          img.style.width = "auto";
        }
      }
    }, PAGE_HEIGHT_PX);

    const pdf = await page.pdf({
      width: `${PAGE_WIDTH_PX}px`,
      height: `${PAGE_HEIGHT_PX}px`,
      margin: { top: 0, bottom: 0, left: 0, right: 0 },
      printBackground: true,
    });

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
