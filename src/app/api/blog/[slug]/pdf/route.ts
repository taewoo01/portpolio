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

    const fontDebug = await page.evaluate(() => ({
      pretendardLoaded: document.fonts.check("16px Pretendard"),
      pretendardBold: document.fonts.check("bold 16px Pretendard"),
      loadedFamilies: Array.from(document.fonts).map((f) => `${f.family} ${f.weight} ${f.status}`),
    }));
    console.log("[pdf-debug] fonts:", JSON.stringify(fontDebug));

    // 페이지 경계에 안 맞는 이미지는 남은 공간에 맞춰 줄이거나(충분히 쓸 만하면)
    // 다음 페이지로 넘긴다(너무 좁으면). 그래야 빈 페이지가 큰 공백으로 남지 않는다.
    const resizeDebug = await page.evaluate((pageHeight) => {
      // getBoundingClientRect() 측정 시점과 실제 PDF 페이지네이션 엔진이 쓰는 값 사이에
      // 서브픽셀 단위 오차가 있어서, 줄인 높이가 남은 공간에 딱 맞으면 그 미세한 오차만으로도
      // 다음 페이지로 밀려버린다(실측 확인됨). 충분히 여유를 둔다.
      const SAFETY_BUFFER_PX = 40;
      // 비율(예: 원본의 50%) 기준은 실제 남은 공간이 그 경계선에 거의 딱 걸쳐있을 때
      // 서브픽셀 오차로 판정이 뒤집히는 문제가 있었다(실측 확인됨). "줄였을 때 결과가
      // 최소 이 정도는 돼야 의미있다"는 절대 픽셀 기준으로 바꿔서 경계 근처 흔들림을 없앤다.
      const MIN_USEFUL_HEIGHT_PX = 150;
      const images = Array.from(document.querySelectorAll<HTMLImageElement>("#print-area img"));
      const log: Record<string, unknown>[] = [];
      for (const img of images) {
        const rect = img.getBoundingClientRect();
        const naturalHeight = rect.height;
        const relativeTop = rect.top % pageHeight;
        const remaining = pageHeight - relativeTop;
        const entry: Record<string, unknown> = {
          src: img.src.slice(-60),
          intrinsicWidth: img.naturalWidth,
          intrinsicHeight: img.naturalHeight,
          renderedWidth: rect.width,
          renderedHeight: naturalHeight,
          top: rect.top,
          relativeTop,
          remaining,
          pageHeight,
        };
        if (naturalHeight <= remaining) {
          entry.action = "fits-already";
          log.push(entry);
          continue;
        }

        const shrunkHeight = remaining - SAFETY_BUFFER_PX;
        if (shrunkHeight >= MIN_USEFUL_HEIGHT_PX) {
          // 줄였을 때 결과가 충분히 쓸 만하면, 한 페이지보다 큰 사진이라도 그 자리에서 줄여서 보여준다.
          img.style.maxHeight = `${Math.floor(shrunkHeight)}px`;
          img.style.width = "auto";
          entry.action = "shrink";
          entry.appliedMaxHeight = img.style.maxHeight;
        } else if (naturalHeight <= pageHeight) {
          // 한 페이지 안에는 들어갈 수 있는 크기인데 남은 공간이 너무 적다 -> 다음 페이지로 깨끗이 넘긴다.
          img.style.breakBefore = "page";
          entry.action = "breakBefore";
        } else {
          // 사진이 한 페이지보다 크고 공간도 거의 없다 -> 손대지 않고 브라우저 기본 흐름에 맡긴다
          // (강제로 넘기면 빈 페이지가 하나 더 생기는 버그가 있었다, 실측 확인됨).
          entry.action = "leave-alone";
        }
        log.push(entry);
      }
      return log;
    }, PAGE_HEIGHT_PX);
    console.log("[pdf-debug] resize:", JSON.stringify(resizeDebug));

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
