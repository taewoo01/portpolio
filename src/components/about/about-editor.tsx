"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveAboutProfileAction } from "@/lib/actions/about";
import type { SiteLink } from "@/config/site";

type Profile = {
  name: string;
  role: string;
  bio: string[];
  skills: string[];
  links: SiteLink[];
};

export function AboutEditor({
  profile,
  canEdit,
}: {
  profile: Profile;
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState<Profile>(profile);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await saveAboutProfileAction(data);
      setEditing(false);
    });
  }

  function handleCancel() {
    setData(profile);
    setEditing(false);
  }

  function updateBio(index: number, value: string) {
    setData((d) => {
      const bio = [...d.bio];
      bio[index] = value;
      return { ...d, bio };
    });
  }

  function addBio() {
    setData((d) => ({ ...d, bio: [...d.bio, ""] }));
  }

  function removeBio(index: number) {
    setData((d) => ({ ...d, bio: d.bio.filter((_, i) => i !== index) }));
  }

  function addSkill(value: string) {
    const trimmed = value.trim();
    if (!trimmed || data.skills.includes(trimmed)) return;
    setData((d) => ({ ...d, skills: [...d.skills, trimmed] }));
  }

  function removeSkill(index: number) {
    setData((d) => ({ ...d, skills: d.skills.filter((_, i) => i !== index) }));
  }

  function updateLink(index: number, field: keyof SiteLink, value: string) {
    setData((d) => {
      const links = [...d.links];
      links[index] = { ...links[index], [field]: value };
      return { ...d, links };
    });
  }

  function addLink() {
    setData((d) => ({ ...d, links: [...d.links, { label: "", href: "" }] }));
  }

  function removeLink(index: number) {
    setData((d) => ({ ...d, links: d.links.filter((_, i) => i !== index) }));
  }

  if (!editing) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <header className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">{data.name}</h1>
            <p className="text-sm font-medium text-primary">{data.role}</p>
          </div>
          {canEdit && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="mr-1.5 size-3.5" />
              편집
            </Button>
          )}
        </header>

        <section className="space-y-2 rounded-lg border bg-card p-5 text-card-foreground">
          <h2 className="text-sm font-semibold text-muted-foreground">소개</h2>
          <div className="space-y-1.5 text-sm leading-relaxed">
            {data.bio.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </section>

        <section className="space-y-2 rounded-lg border bg-card p-5 text-card-foreground">
          <h2 className="text-sm font-semibold text-muted-foreground">스킬</h2>
          <ul className="flex flex-wrap gap-2">
            {data.skills.map((skill) => (
              <li key={skill} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                {skill}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-2 rounded-lg border bg-card p-5 text-card-foreground">
          <h2 className="text-sm font-semibold text-muted-foreground">링크</h2>
          <ul className="flex flex-wrap gap-2">
            {data.links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                  rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                  className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-1 flex-col gap-2">
          <Input
            value={data.name}
            onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
            placeholder="이름"
            className="text-2xl font-semibold h-auto py-1"
          />
          <Input
            value={data.role}
            onChange={(e) => setData((d) => ({ ...d, role: e.target.value }))}
            placeholder="역할"
            className="text-sm"
          />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            <Check className="mr-1.5 size-3.5" />
            저장
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancel}>
            <X className="mr-1.5 size-3.5" />
            취소
          </Button>
        </div>
      </header>

      <section className="space-y-2 rounded-lg border bg-card p-5 text-card-foreground">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">소개</h2>
          <Button type="button" variant="ghost" size="sm" onClick={addBio}>
            <Plus className="size-3.5" />
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          {data.bio.map((p, i) => (
            <div key={i} className="flex gap-2">
              <Textarea
                value={p}
                onChange={(e) => updateBio(i, e.target.value)}
                className="min-h-0 resize-none text-sm"
                rows={2}
              />
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeBio(i)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2 rounded-lg border bg-card p-5 text-card-foreground">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">스킬</h2>
        </div>
        <ul className="flex flex-wrap gap-2">
          {data.skills.map((skill, i) => (
            <li key={i} className="flex items-center gap-1 rounded-full bg-secondary pl-3 pr-1.5 py-1 text-xs font-medium text-secondary-foreground">
              {skill}
              <button type="button" onClick={() => removeSkill(i)} className="rounded-full hover:bg-muted p-0.5">
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const input = e.currentTarget.elements.namedItem("skill") as HTMLInputElement;
            addSkill(input.value);
            input.value = "";
          }}
          className="flex gap-2"
        >
          <Input name="skill" placeholder="스킬 추가" className="h-8 text-sm" />
          <Button type="submit" size="sm" variant="outline">추가</Button>
        </form>
      </section>

      <section className="space-y-2 rounded-lg border bg-card p-5 text-card-foreground">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">링크</h2>
          <Button type="button" variant="ghost" size="sm" onClick={addLink}>
            <Plus className="size-3.5" />
          </Button>
        </div>
        <div className="flex flex-col gap-2">
          {data.links.map((link, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={link.label}
                onChange={(e) => updateLink(i, "label", e.target.value)}
                placeholder="표시 이름"
                className="h-8 w-28 text-sm"
              />
              <Input
                value={link.href}
                onChange={(e) => updateLink(i, "href", e.target.value)}
                placeholder="URL 또는 경로"
                className="h-8 flex-1 text-sm"
              />
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => removeLink(i)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
