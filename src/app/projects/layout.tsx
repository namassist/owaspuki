import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProjectsLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) notFound();
  return <>{children}</>;
}
