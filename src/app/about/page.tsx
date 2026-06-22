import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/server/auth";
import { USER_LABEL } from "@/lib/auth";
import { AboutEditor } from "@/components/about/about-editor";
import type { SiteLink } from "@/config/site";

export const metadata: Metadata = {
  title: "About",
};

const DEFAULTS: Record<string, { name: string; role: string; bio: string[]; skills: string[]; links: SiteLink[] }> = {
  taewoo: {
    name: USER_LABEL.taewoo,
    role: "개발자",
    bio: ["이 문장들은 placeholder입니다.", "편집 버튼을 눌러 직접 수정할 수 있습니다."],
    skills: ["TypeScript", "React", "Next.js", "Tailwind CSS", "PostgreSQL", "Prisma"],
    links: [
      { label: "GitHub", href: "https://github.com/your-id" },
      { label: "Blog", href: "/blog" },
      { label: "Email", href: "mailto:you@example.com" },
    ],
  },
  yujin: {
    name: USER_LABEL.yujin,
    role: "시스템 설계자",
    bio: ["이 문장들은 placeholder입니다.", "편집 버튼을 눌러 직접 수정할 수 있습니다."],
    skills: ["시스템 설계", "기획", "UX", "문서화"],
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Email", href: "mailto:you@example.com" },
    ],
  },
  hoyoung: {
    name: USER_LABEL.hoyoung,
    role: "팀원",
    bio: ["이 문장들은 placeholder입니다.", "편집 버튼을 눌러 직접 수정할 수 있습니다."],
    skills: [],
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Email", href: "mailto:you@example.com" },
    ],
  },
  donghyun: {
    name: USER_LABEL.donghyun,
    role: "팀원",
    bio: ["이 문장들은 placeholder입니다.", "편집 버튼을 눌러 직접 수정할 수 있습니다."],
    skills: [],
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Email", href: "mailto:you@example.com" },
    ],
  },
};

export default async function AboutPage() {
  const currentUser = await getUser();
  const owner = currentUser ?? "taewoo";

  const saved = await prisma.aboutProfile.findUnique({ where: { owner } });

  const profile = saved
    ? {
        name: saved.name,
        role: saved.role,
        bio: saved.bio,
        skills: saved.skills,
        links: saved.links as SiteLink[],
      }
    : DEFAULTS[owner];

  return <AboutEditor profile={profile} canEdit={!!currentUser} />;
}
