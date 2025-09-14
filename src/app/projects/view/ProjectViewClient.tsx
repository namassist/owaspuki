"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import FindingForm from "@/components/FindingForm";
import StatsPanel from "@/components/StatsPanel";
import VulnTable from "@/components/VulnTable";
import ProjectQuickActions from "@/components/ProjectQuickActions";

type Role = "Pentester" | "Developer";
type Me = { id: string; email: string; name?: string | null; role: Role };

export default function ProjectViewClient({
  projectId,
  me: initialMe,
}: {
  projectId: string;
  me: Me;
}) {
  const [me, setMe] = useState<Me>(initialMe);

  // sinkron ulang /api/auth/me untuk jaga-jaga session berubah
  useEffect(() => {
    (async () => {
      const r = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
      if (r.ok) setMe(await r.json());
    })();
  }, []);

  if (!projectId) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          projectId tidak ditemukan di URL.
        </div>
        <div className="mt-4">
          <Link href="/projects" className="inline-flex items-center rounded-xl border px-3 py-2">
            ← Back to Projects
          </Link>
        </div>
      </main>
    );
  }

  const isPentester = me.role === "Pentester";

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold"></h1>
        <div className="flex gap-2">
          <Link
            href={`/api/vulns/export?projectId=${encodeURIComponent(projectId)}`}
            className="rounded-xl px-4 py-2 bg-black text-white"
          >
            Export CSV
          </Link>
          <Link href="/projects" className="rounded-xl px-4 py-2 bg-slate-200">
            Back to Projects
          </Link>
        </div>
      </div>

      {/* Konten utama */}
      {isPentester ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <FindingForm projectId={projectId} />
            </div>
            <div className="lg:col-span-1 space-y-4">
              <StatsPanel projectId={projectId} />
              <ProjectQuickActions projectId={projectId} role={me.role} />
            </div>
          </div>
          <div>
            <VulnTable projectId={projectId} />
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <VulnTable projectId={projectId} />
          </div>
          <div className="lg:col-span-1 space-y-4">
            <StatsPanel projectId={projectId} />
            <ProjectQuickActions projectId={projectId} role={me.role} />
          </div>
        </div>
      )}
    </main>
  );
}
