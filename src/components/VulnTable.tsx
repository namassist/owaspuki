"use client";

import { useEffect, useMemo, useState } from "react";
import VulnDetailModal from "@/components/VulnDetailModal";
import StatusDropdown from "@/components/StatusDropdown";

type Status = "Open" | "In Progress" | "Waiting Retest" | "Close";

type Row = {
  id: string;
  title: string;
  owaspCat?: string | null;
  cvssScore?: number | null;
  severity: string; // "None" | "Low" | "Medium" | "High" | "Critical"
  status: Status;
};

type Me = {
  id: string;
  email: string;
  name?: string | null;
  role: "Pentester" | "Developer";
};

const card = "rounded-2xl border border-gray-200 bg-white";
const th = "text-left p-3";
const td = "p-3";

const STATUS_ALL = ["Open", "In Progress", "Waiting Retest", "Close"] as const;
const DEV_ALLOWED = ["In Progress", "Waiting Retest"] as const;
const SEVERITIES = [
  "All",
  "None",
  "Low",
  "Medium",
  "High",
  "Critical",
] as const;
const SORTS = [
  "Score ↑",
  "Score ↓",
  "Severity A→Z",
  "Severity Z→A",
  "Title A→Z",
  "Title Z→A",
] as const;

export default function VulnTable({ projectId }: { projectId?: string }) {
  const [me, setMe] = useState<Me | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [viewId, setViewId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  // filter bar state
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "All" | (typeof STATUS_ALL)[number]
  >("All");
  const [sevFilter, setSevFilter] =
    useState<(typeof SEVERITIES)[number]>("All");
  const [sortBy, setSortBy] = useState<(typeof SORTS)[number]>("Score ↓");

  const loadRows = async () => {
    const qs = projectId ? `?projectId=${projectId}` : "";
    const res = await fetch(`/api/vulns${qs}`, {
      cache: "no-store",
      credentials: "include",
    });
    if (res.ok) setRows(await res.json());
  };

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });
      if (r.ok) setMe(await r.json());
    })();
    loadRows();

    const onRefresh = () => loadRows();
    window.addEventListener("vulns:refresh", onRefresh);
    return () => window.removeEventListener("vulns:refresh", onRefresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const optsFor = (role?: Me["role"]) =>
    (role === "Pentester" ? [...STATUS_ALL] : [...DEV_ALLOWED]) as Status[];

  const updateStatus = async (id: string, newStatus: Status) => {
    try {
      setSavingId(id);
      const res = await fetch(`/api/vulns/detail?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error(await res.text());
      setRows((prev) =>
        prev.map((r) =>
          r.id === id ? ({ ...r, status: newStatus } as Row) : r
        )
      );
    } catch (e) {
      alert("Gagal update status");
      console.error(e);
      loadRows();
    } finally {
      setSavingId(null);
    }
  };

  const doDelete = async (id: string) => {
    if (!confirm("Hapus finding ini?")) return;
    const res = await fetch(`/api/vulns/detail?id=${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) setRows((prev) => prev.filter((r) => r.id !== id));
    else {
      alert("Gagal hapus finding");
      console.error(await res.text());
    }
  };

  // client filtering + sorting
  const filtered = useMemo(() => {
    let data = [...rows];

    if (q.trim()) {
      const s = q.trim().toLowerCase();
      data = data.filter((r) =>
        `${r.title} ${r.owaspCat ?? ""} ${r.severity} ${r.status}`
          .toLowerCase()
          .includes(s)
      );
    }

    if (statusFilter !== "All") {
      data = data.filter((r) => r.status === statusFilter);
    }

    if (sevFilter !== "All") {
      data = data.filter(
        (r) => (r.severity || "").toLowerCase() === sevFilter.toLowerCase()
      );
    }

    const sevRank = (s?: string) => {
      const order = ["none", "low", "medium", "high", "critical"];
      const idx = order.indexOf((s || "").toLowerCase());
      return idx === -1 ? 0 : idx;
    };

    switch (sortBy) {
      case "Score ↑":
        data.sort((a, b) => (a.cvssScore ?? 0) - (b.cvssScore ?? 0));
        break;
      case "Score ↓":
        data.sort((a, b) => (b.cvssScore ?? 0) - (a.cvssScore ?? 0));
        break;
      case "Severity A→Z":
        data.sort((a, b) => sevRank(a.severity) - sevRank(b.severity));
        break;
      case "Severity Z→A":
        data.sort((a, b) => sevRank(b.severity) - sevRank(a.severity));
        break;
      case "Title A→Z":
        data.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "Title Z→A":
        data.sort((a, b) => b.title.localeCompare(a.title));
        break;
    }

    return data;
  }, [rows, q, statusFilter, sevFilter, sortBy]);

  return (
    <div className="space-y-3">
      {/* FILTER BAR – tanpa KPI */}
      <div
        className={
          card +
          " p-3 grid grid-cols-1 md:grid-cols-[1fr_160px_160px_160px] gap-2"
        }
      >
        <div className="relative">
          <input
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
            placeholder="Search findings…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
        >
          {["All", ...STATUS_ALL].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
          value={sevFilter}
          onChange={(e) => setSevFilter(e.target.value as any)}
        >
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
        >
          {SORTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* TABLE */}
      <div className={card + " overflow-visible"}>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className={th}>Judul</th>
              <th className={th}>OWASP</th>
              <th className={th}>Score</th>
              <th className={th}>Severity</th>
              <th className={th}>Status</th>
              <th className="text-right p-5">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const opts = optsFor(me?.role);
              const value: Status = (opts as readonly Status[]).includes(
                r.status
              )
                ? r.status
                : opts[0];

              return (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className={td}>{r.title}</td>
                  <td className={td}>{r.owaspCat ?? "-"}</td>
                  <td className={td}>
                    {typeof r.cvssScore === "number"
                      ? r.cvssScore.toFixed(1)
                      : "-"}
                  </td>
                  <td className={td}>{r.severity}</td>
                  <td className={td}>
                    <StatusDropdown
                      value={value}
                      options={opts}
                      disabled={savingId === r.id}
                      onChange={(next) => updateStatus(r.id, next as Status)}
                    />
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => setViewId(r.id)}
                      className="inline-flex items-center rounded-xl border px-3 py-2 bg-white hover:bg-gray-50 border-gray-300"
                    >
                      View
                    </button>
                    {me?.role === "Pentester" && (
                      <button
                        onClick={() => doDelete(r.id)}
                        className="ml-2 inline-flex items-center rounded-xl border px-3 py-2 bg-red-600 text-white hover:opacity-90 border-red-600"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td className="p-6 text-neutral-500" colSpan={6}>
                  Tidak ada data yang cocok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <VulnDetailModal
        open={!!viewId}
        findingId={viewId}
        onClose={() => setViewId(null)}
      />
    </div>
  );
}
