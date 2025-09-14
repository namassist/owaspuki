// src/app/projects/page.tsx  (SERVER COMPONENT)
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import ProjectsClient from "./ProjectsClient";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const u = await getSessionUser();      // baca dari session token (DB)
  if (!u) notFound();

  const initialMe = { id: u.id, email: u.email, role: u.role, name: u.name ?? null };
  return <ProjectsClient initialMe={initialMe} />;
}
