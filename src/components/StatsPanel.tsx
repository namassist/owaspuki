"use client";

import { useEffect, useState } from "react";

type Row = {
  id: string;
  cvssScore?: number | null;
  status: "Open" | "In Progress" | "Waiting Retest" | "Close" | string;
};

const card = "rounded-2xl border border-gray-200 bg-white";

export default function StatsPanel({ projectId }: { projectId?: string }) {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);

  const load = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/vulns?projectId=${encodeURIComponent(projectId)}`, {
        cache: "no-store",
        credentials: "include",
      });
      if (r.ok) setRows(await r.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const onRefresh = () => load();
    window.addEventListener("vulns:refresh", onRefresh);
    return () => window.removeEventListener("vulns:refresh", onRefresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // --- compute KPI locally ---
  const total = rows.length;
  const scores = rows.map((r) => r.cvssScore ?? 0);
  const avgCvss = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

  const count = (s: string) => rows.filter((r) => (r.status || "").toLowerCase() === s.toLowerCase()).length;
  const open = count("Open");
  const inProgress = count("In Progress");
  const waitingRetest = count("Waiting Retest");
  const close = count("Close");

  return (
    <aside className="space-y-3">
      <div className={card + " p-4"}>
        <div className="flex items-center gap-3 mb-3">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-white font-medium">PR</div>
          <div>
            <div className="font-medium">Project Overview</div>
            <div className="text-sm text-gray-500">Quick summary</div>
          </div>
        </div>

        {/* skeleton tipis */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl border border-gray-200 bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Kpi label="Total" value={total} />
            <Kpi label="Avg CVSS" value={avgCvss.toFixed(1)} badge />

            <Kpi label="Open" value={open} dot="bg-gray-500" />
            <Kpi label="In Progress" value={inProgress} dot="bg-blue-500" />
            <Kpi label="Waiting Retest" value={waitingRetest} dot="bg-amber-500" />
            <Kpi label="Close" value={close} dot="bg-emerald-500" />
          </div>
        )}
      </div>
      {/* Quick Actions yang versi lama sudah DIHAPUS */}
    </aside>
  );
}

function Kpi({
  label,
  value,
  badge,
  dot,
}: {
  label: string;
  value: string | number;
  badge?: boolean;
  dot?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 p-3">
      <div className="text-sm text-gray-500 flex items-center gap-2">
        {dot && <span className={`h-2 w-2 rounded-full ${dot}`} />}
        {label}
      </div>
      <div className={`mt-1 font-semibold ${badge ? "text-indigo-600" : ""}`}>{value}</div>
    </div>
  );
}
