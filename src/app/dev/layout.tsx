import { WorkspaceLayout } from "@/components/wiki/workspace-layout";

export default function DevLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceLayout workspace="dev">{children}</WorkspaceLayout>;
}
