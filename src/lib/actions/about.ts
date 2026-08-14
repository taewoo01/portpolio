"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getUser } from "@/lib/server/auth";
import { USER_LABEL } from "@/lib/auth";
import type { SiteLink } from "@/config/site";

const EMAIL_PATTERN = /^[^\s@:/]+@[^\s@]+\.[^\s@]+$/;

function normalizeLinks(links: SiteLink[]): SiteLink[] {
  return links.map((link) =>
    EMAIL_PATTERN.test(link.href) ? { ...link, href: `mailto:${link.href}` } : link
  );
}

export async function saveAboutProfileAction(data: {
  name: string;
  role: string;
  bio: string[];
  skills: string[];
  links: SiteLink[];
  avatarUrl: string | null;
}) {
  const owner = await getUser();
  if (!owner) return;

  const links = normalizeLinks(data.links);

  await prisma.aboutProfile.upsert({
    where: { owner },
    create: { owner, ...data, links },
    update: { ...data, links },
  });

  revalidatePath("/about");
}

export async function saveTimerCharacterAction(data: { url?: string | null; enabled?: boolean }) {
  const owner = await getUser();
  if (!owner) return;

  await prisma.aboutProfile.upsert({
    where: { owner },
    create: {
      owner,
      name: USER_LABEL[owner],
      role: "",
      timerCharacterUrl: data.url ?? null,
      timerCharacterEnabled: data.enabled ?? true,
    },
    update: {
      ...(data.url !== undefined ? { timerCharacterUrl: data.url } : {}),
      ...(data.enabled !== undefined ? { timerCharacterEnabled: data.enabled } : {}),
    },
  });

  revalidatePath("/timer");
}
