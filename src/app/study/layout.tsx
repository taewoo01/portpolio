import { WorkspaceLayout } from "@/components/wiki/workspace-layout";

export default function StudyLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceLayout workspace="study">{children}</WorkspaceLayout>;
}
