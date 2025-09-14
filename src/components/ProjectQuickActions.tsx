// src/components/ProjectQuickActions.tsx
"use client";

import { useEffect, useRef, useState } from "react";

type ProjectDoc = {
  id: string;
  originalName: string;
  filename: string;
  mime: string;
  size: number;
  url: string;
  createdAt: string;
};

function humanBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export default function ProjectQuickActions({
  projectId,
  role,
}: {
  projectId: string;
  role?: "Pentester" | "Developer";
}) {
  const [docs, setDocs] = useState<ProjectDoc[]>([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const canEdit = role === "Pentester";

  const loadDocs = async () => {
    const r = await fetch(`/api/project-docs?projectId=${projectId}`, {
      credentials: "include",
      cache: "no-store",
    });
    if (r.ok) setDocs(await r.json());
  };

  useEffect(() => { loadDocs(); }, [projectId]);

  const upload = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const f = files[0];
    const okType = ["application/pdf", "application/zip", "application/x-zip-compressed"].includes(f.type);
    const okSize = f.size > 0 && f.size <= 25 * 1024 * 1024;
    if (!okType || !okSize) {
      alert("Only PDF/ZIP, max 25MB");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", f, f.name);
      const r = await fetch(`/api/project-docs?projectId=${encodeURIComponent(projectId)}`, {
        method: "POST", body: fd, credentials: "include",
      });
      if (!r.ok) alert(await r.text());
      await loadDocs();
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="font-medium mb-2">Quick Actions</div>

      {canEdit && (
        <div className="mb-3">
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.zip"
            className="hidden"
            onChange={(e) => upload(e.target.files)}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className={`rounded-xl border px-3 py-2 text-sm ${busy ? "bg-gray-200 text-gray-500" : "bg-white hover:bg-gray-50 border-gray-300"}`}
          >
            {busy ? "Uploading…" : "Upload Doc"}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {docs.length === 0 ? (
          <div className="text-sm text-gray-500">Belum ada dokumen.</div>
        ) : (
          <ul className="space-y-2">
            {docs.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 text-sm">
                <a href={d.url} target="_blank" rel="noreferrer" className="underline truncate">
                  {d.originalName}
                </a>
                <span className="text-gray-500">{humanBytes(d.size)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <a
          href={`/api/export/csv?projectId=${projectId}`}
          className="rounded-xl border px-3 py-2 text-sm bg-white hover:bg-gray-50 border-gray-300"
        >
          Export CSV
        </a>
        <button
          onClick={() => history.back()}
          className="rounded-xl border px-3 py-2 text-sm bg-white hover:bg-gray-50 border-gray-300"
        >
          Back
        </button>
      </div>
    </div>
  );
}
