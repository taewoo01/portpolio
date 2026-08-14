"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ImagePlus, Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveAboutProfileAction } from "@/lib/actions/about";
import { useToast } from "@/components/ui/toast";
import type { SiteLink } from "@/config/site";

type Profile = {
  name: string;
  role: string;
  bio: string[];
  skills: string[];
  links: SiteLink[];
  avatarUrl: string | null;
};

export function AboutEditor({
  profile,
  canEdit,
  isUnedited = false,
}: {
  profile: Profile;
  canEdit: boolean;
  isUnedited?: boolean;
}) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [data, setData] = useState<Profile>(profile);
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleAvatarUpload(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      setData((d) => ({ ...d, avatarUrl: url }));
    } catch {
      toast.add({ title: "이미지 업로드에 실패했습니다.", type: "error" });
    } finally {
      setUploading(false);
    }
  }

  function handleSave() {
    startTransition(async () => {
      await saveAboutProfileAction(data);
      setEditing(false);
      toast.add({ title: "프로필을 저장했습니다.", type: "success" });
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
      <div className="mx-auto flex max-w-2xl flex-col gap-10">
        <header className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {data.avatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.avatarUrl}
                alt={data.name}
                className="size-16 shrink-0 rounded-2xl object-cover shadow-sm"
              />
            )}
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">{data.name}</h1>
              <p className="text-sm font-medium text-primary">{data.role}</p>
            </div>
          </div>
          {canEdit && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="mr-1.5 size-3.5" />
              편집
            </Button>
          )}
        </header>

        <section className="space-y-3 border-t pt-8">
          <h2 className="text-sm font-semibold text-muted-foreground">소개</h2>
          {isUnedited ? (
            <div className="flex flex-col items-start gap-2 py-2">
              <p className="text-sm text-muted-foreground">아직 작성된 소개가 없습니다.</p>
              {canEdit && (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="mr-1.5 size-3.5" />
                  지금 작성하기
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-1.5 text-sm leading-relaxed">
              {data.bio.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          )}
        </section>

        <section className="space-y-3 border-t pt-8">
          <h2 className="text-sm font-semibold text-muted-foreground">스킬</h2>
          <ul className="flex flex-wrap gap-2">
            {data.skills.map((skill) => (
              <li key={skill} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                {skill}
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3 border-t pt-8">
          <h2 className="text-sm font-semibold text-muted-foreground">링크</h2>
          <ul className="flex flex-wrap gap-2">
            {data.links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                  rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                  className="focus-ring inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
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
    <div className="mx-auto flex max-w-2xl flex-col gap-10">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-1 gap-4">
          <div className="flex flex-col items-center gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="focus-ring group relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-muted shadow-sm transition-shadow hover:shadow-md"
            >
              {data.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.avatarUrl} alt="" className="size-full object-cover" />
              ) : (
                <ImagePlus className="size-5 text-muted-foreground" />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                {uploading ? "업로드 중" : "변경"}
              </div>
            </button>
            {data.avatarUrl && (
              <button
                type="button"
                onClick={() => setData((d) => ({ ...d, avatarUrl: null }))}
                className="focus-ring rounded text-[11px] text-muted-foreground hover:text-destructive"
              >
                제거
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAvatarUpload(file);
                e.target.value = "";
              }}
            />
          </div>
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

      <section className="space-y-3 border-t pt-8">
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

      <section className="space-y-3 border-t pt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">스킬</h2>
        </div>
        <ul className="flex flex-wrap gap-2">
          {data.skills.map((skill, i) => (
            <li key={i} className="flex items-center gap-1 rounded-full bg-secondary pl-3 pr-1.5 py-1 text-xs font-medium text-secondary-foreground">
              {skill}
              <button type="button" onClick={() => removeSkill(i)} className="focus-ring rounded-full p-0.5 hover:bg-muted">
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

      <section className="space-y-3 border-t pt-8">
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
