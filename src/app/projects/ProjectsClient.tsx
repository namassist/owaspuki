// src/app/projects/ProjectsClient.tsx  (CLIENT COMPONENT)
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ProfileMenu from "@/components/ProfileMenu"; // ⬅️ TAMBAH: menu profil (avatar, profile, logout)

type Role = "Pentester" | "Developer";
type Me = { id: string; email: string; role: Role; name?: string | null };
type Project = { id: string; name: string; description?: string | null; status: "Active" | "Paused" | "Archived"; updatedAt?: string | null };

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
const baseBtn = "inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm font-medium transition-colors";
const solidBtn = cx(baseBtn, "bg-black text-white hover:opacity-90 border-black");
const ghostBtn = cx(baseBtn, "bg-transparent hover:bg-gray-100 border-transparent");
const outlineBtn = cx(baseBtn, "bg-white hover:bg-gray-50 border-gray-300");
const card = "rounded-2xl border border-gray-200 bg-white";
const inputCls = "w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200";
const muted = "text-gray-500";

export default function ProjectsClient({ initialMe }: { initialMe: Me }) {
  const [me, setMe] = useState<Me>(initialMe);
  const [projects, setProjects] = useState<Project[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | Project["status"]>("All");
  const [view, setView] = useState<"table" | "grid">("table");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const canEdit = me?.role === "Pentester";

  useEffect(() => {
    // sinkron ulang me dari server (cookie HttpOnly harus terkirim)
    (async () => {
      const r = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
      if (r.ok) setMe(await r.json());
    })();

    load();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/") {
        (document.getElementById("project-search") as HTMLInputElement)?.focus();
        e.preventDefault();
      }
      if (e.key.toLowerCase() === "n" && canEdit) setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canEdit]);

  async function load() {
    const res = await fetch("/api/projects", { credentials: "include", cache: "no-store" });
    if (res.ok) setProjects(await res.json());
  }

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchesQ = q ? (p.name + " " + (p.description ?? "")).toLowerCase().includes(q.toLowerCase()) : true;
      const matchesStatus = statusFilter === "All" ? true : p.status === statusFilter;
      return matchesQ && matchesStatus;
    });
  }, [projects, q, statusFilter]);

  async function createProject() {
    if (!canEdit || !name.trim()) return;
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name: name.trim(), description: desc.trim() }),
    });
    if (res.ok) {
      setOpen(false);
      setName("");
      setDesc("");
      load();
    } else {
      alert(await res.text());
    }
  }

  async function archiveProject(id: string) {
    await fetch(`/api/projects/detail?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status: "Archived" }),
    });
    load();
  }

  async function removeProject(id: string) {
    if (!canEdit) return;
    if (!confirm("Delete this project?")) return;
    const res = await fetch(`/api/projects?id=${id}`, { method: "DELETE", credentials: "include" });
    if (!res.ok) alert(await res.text());
    load();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Projects</h1>
          <p className={cx("text-sm", muted)}>
            Create, search, and manage your projects. Press <kbd className="rounded border px-1">/</kbd> to search
            {canEdit && (
              <>
                {" "}
                , <kbd className="rounded border px-1">N</kbd> for new
              </>
            )}
            .
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canEdit && (
            <button className={solidBtn} onClick={() => setOpen(true)}>
              + New Project
            </button>
          )}
          {/* ⬇️ TAMBAH: Profile menu (avatar + profile + logout) */}
          <ProfileMenu name={me?.name} email={me?.email} />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <div className="relative md:w-80">
          <input id="project-search" placeholder="Search projects" className={cx(inputCls)} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex gap-2 items-center text-sm">
          {(["All", "Active", "Paused", "Archived"] as const).map((s) => (
            <button
              key={s}
              className={cx(
                "rounded-xl border px-3 py-1.5",
                statusFilter === s ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-300 hover:bg-gray-50"
              )}
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="md:ml-auto flex items-center gap-2">
          <button className={cx(ghostBtn, view === "grid" && "bg-gray-100")} onClick={() => setView("grid")} aria-label="Grid view">
            Grid
          </button>
          <button className={cx(ghostBtn, view === "table" && "bg-gray-100")} onClick={() => setView("table")} aria-label="Table view">
            Table
          </button>
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Content (table versi singkat) */}
      <div className={cx(card, "overflow-hidden")}>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3 hidden md:table-cell">Description</th>
              <th className="text-left p-3">Status</th>
              <th className="text-right p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3 hidden md:table-cell text-gray-500">{p.description}</td>
                <td className="p-3 text-gray-500">—</td>
                <td className="p-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    <Link href={`/projects/view?projectId=${p.id}`} className={outlineBtn}>
                      Open
                    </Link>
                    {canEdit && (
                      <button className={outlineBtn} onClick={() => archiveProject(p.id)}>
                        Archive
                      </button>
                    )}
                    {canEdit && (
                      <button className={cx(ghostBtn, "text-red-600")} onClick={() => removeProject(p.id)}>
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dialog New Project */}
      {open && canEdit && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal>
          <div className={cx(card, "w-full max-w-lg p-6 space-y-4")}>
            <div>
              <h2 className="text-lg font-semibold">New Project</h2>
              <p className={cx("text-sm", muted)}>Give your project a name and optional description.</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <input className={inputCls} placeholder="e.g. QA-Ecareer" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea className={inputCls} placeholder="Optional" value={desc} onChange={(e) => setDesc(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button className={ghostBtn} onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button className={solidBtn} onClick={createProject}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
