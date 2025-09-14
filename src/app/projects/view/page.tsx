import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import ProjectViewClient from "./ProjectViewClient";

export const dynamic = "force-dynamic";

export default async function ProjectViewPage({
  searchParams,
}: {
  searchParams: { projectId?: string };
}) {
  const u = await getSessionUser();
  if (!u) notFound();

  const projectId = searchParams?.projectId || "";
  if (!projectId) notFound();

  const me = { id: u.id, email: u.email, role: u.role as "Pentester" | "Developer", name: u.name ?? null };
  return <ProjectViewClient projectId={projectId} me={me} />;
}
