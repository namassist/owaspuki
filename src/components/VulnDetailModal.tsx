// src/components/VulnDetailModal.tsx
"use client";

import { useEffect, useRef, useState } from "react";

type Finding = {
  id: string;
  title: string;
  owaspCat?: string | null;
  url?: string | null;
  method: string;
  impact?: string | null;
  description?: string | null;
  cvssVector?: string | null;
  cvssScore: number;
  severity: string;
  status: string;
  params: string[];
};

type Evidence = {
  id: string;
  url: string;
  filename: string;
  mime: string;
  size: number;
  createdAt: string;
};

type Me = {
  id: string;
  email: string;
  name?: string | null;
  role: "Pentester" | "Developer";
};

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export default function VulnDetailModal({
  open,
  onClose,
  findingId,
}: {
  open: boolean;
  onClose: () => void;
  findingId: string | null;
}) {
  // auth/role
  const [me, setMe] = useState<Me | null>(null);
  const canEdit = me?.role === "Pentester";

  // finding
  const [data, setData] = useState<Finding | null>(null);
  const [loading, setLoading] = useState(false);

  // params
  const [newParam, setNewParam] = useState("");

  // evidences
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [upLoading, setUpLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [viewer, setViewer] = useState<Evidence | null>(null);

  // toast (no alert)
  const [toast, setToast] = useState<{ type: "info" | "error"; msg: string } | null>(null);
  const showToast = (msg: string, type: "info" | "error" = "error") => {
    setToast({ type, msg });
    // auto hide
    setTimeout(() => setToast(null), 3500);
  };

  // --- LOADERS ---
  const loadMe = async () => {
    const r = await fetch("/api/auth/me", { cache: "no-store", credentials: "include" });
    if (r.ok) setMe(await r.json());
    else setMe(null);
  };

  const loadFinding = async () => {
    if (!findingId) return;
    setLoading(true);
    const r = await fetch(`/api/vulns/detail?id=${findingId}`, { cache: "no-store", credentials: "include" });
    if (r.ok) setData(await r.json());
    setLoading(false);
  };

  const loadEvidences = async () => {
    if (!findingId) return;
    const r = await fetch(`/api/vulns/evidence?findingId=${findingId}`, {
      cache: "no-store",
      credentials: "include",
    });
    if (r.ok) setEvidences(await r.json());
  };

  useEffect(() => {
    loadMe();
  }, []);

  useEffect(() => {
    if (!open || !findingId) return;
    loadFinding();
    loadEvidences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, findingId]);

  // --- ACTIONS ---
  const addParam = async () => {
    if (!findingId || !newParam.trim() || !canEdit) return;
    const res = await fetch(`/api/vulns/detail?id=${findingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ pushParam: newParam.trim() }),
    });
    if (res.ok) {
      await loadFinding();
      setNewParam("");
      window.dispatchEvent(new Event("vulns:refresh"));
      showToast("Parameter ditambahkan.", "info");
    } else {
      showToast("Gagal menambahkan parameter.");
    }
  };

  const handlePick = () => fileInputRef.current?.click();

  const uploadEvidence = async (files: FileList | null) => {
    if (!canEdit || !findingId || !files || files.length === 0) return;

    // Client-side pre-check
    const MAX_BYTES = 10 * 1024 * 1024;
    const ALLOWED = ["image/png", "image/jpeg"];

    const invalids: string[] = [];
    const toUpload = Array.from(files).filter((f) => {
      const ok = ALLOWED.includes(f.type) && f.size > 0 && f.size <= MAX_BYTES;
      if (!ok) invalids.push(`${f.name} (${f.type || "?"}, ${(f.size / 1024 / 1024).toFixed(2)}MB)`);
      return ok;
    });

    if (invalids.length) {
      showToast(
        "File ditolak (hanya png & jpg)",
        "error"
      );
    }
    if (toUpload.length === 0) return;

    setUpLoading(true);
    try {
      for (const file of toUpload) {
        const fd = new FormData();
        fd.append("file", file, file.name);
        const r = await fetch(`/api/vulns/evidence?findingId=${encodeURIComponent(findingId)}`, {
          method: "POST",
          body: fd,
          credentials: "include",
        });
        if (!r.ok) {
          // tampilkan error dari server jika ada
          let msg = "Upload gagal.";
          try {
            const t = await r.json();
            if (t?.error) msg = t.error;
          } catch {
            // ignore
          }
          showToast(msg, "error");
        }
      }
      await loadEvidences();
      showToast("Evidence ter-upload.", "info");
    } finally {
      setUpLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const deleteEvidence = async (id: string) => {
    if (!canEdit) return;
    if (!confirm("Hapus evidence ini?")) return;
    const r = await fetch(`/api/vulns/evidence?id=${id}`, { method: "DELETE", credentials: "include" });
    if (r.ok) {
      setEvidences((prev) => prev.filter((e) => e.id !== id));
      showToast("Evidence dihapus.", "info");
    } else {
      showToast("Gagal menghapus evidence.");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center px-4">
      {/* WRAPPER: tinggi max & body scroll */}
      <div className="w-full max-w-5xl rounded-2xl bg-white shadow relative">
        {/* Toast – di dalam modal, bukan window alert */}
        {toast && (
          <div
            className={cx(
              "absolute left-1/2 -translate-x-1/2 top-3 z-10 rounded-xl px-3 py-2 text-sm shadow",
              toast.type === "error"
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-gray-900 text-white"
            )}
          >
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="text-lg font-semibold">Detail Finding</h2>
          <button onClick={onClose} className="px-3 py-1 rounded-lg border hover:bg-gray-50">
            Close
          </button>
        </div>

        {/* Body yang bisa di-scroll */}
        <div className="px-5 pb-5 max-h-[78vh] overflow-y-auto">
          {loading || !data ? (
            <div className="py-10 text-center text-neutral-500">Loading...</div>
          ) : (
            <div className="space-y-6">
              {/* -------- Meta -------- */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-neutral-500">Judul</div>
                  <div className="font-medium">{data.title}</div>
                </div>
                <div>
                  <div className="text-sm text-neutral-500">OWASP</div>
                  <div className="font-medium">{data.owaspCat || "-"}</div>
                </div>

                <div className="col-span-2">
                  <div className="text-sm text-neutral-500">URL</div>
                  <div className="font-mono text-sm break-all">
                    {data.url || "-"}
                    {data.method ? `  (${data.method})` : ""}
                  </div>
                </div>

                <div className="col-span-2">
                  <div className="text-sm text-neutral-500">Impact / Risk</div>
                  <div>{data.impact || "-"}</div>
                </div>

                <div>
                  <div className="text-sm text-neutral-500">CVSS Vector</div>
                  <div className="font-mono text-xs">{data.cvssVector || "-"}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-neutral-500">Score</div>
                    <div className="font-semibold">{data.cvssScore.toFixed(1)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-neutral-500">Severity</div>
                    <div className="font-semibold">{data.severity}</div>
                  </div>
                </div>
              </div>

              {/* -------- Parameters -------- */}
              <div className="space-y-2">
                <div className="text-sm text-neutral-500">Parameters</div>
                <ul className="list-disc pl-5 space-y-1">
                  {data.params?.length ? (
                    data.params.map((p, i) => (
                      <li key={i} className="font-mono text-sm">
                        {p}
                      </li>
                    ))
                  ) : (
                    <li className="text-neutral-500">-</li>
                  )}
                </ul>
                <div className="flex gap-2">
                  <input
                    value={newParam}
                    onChange={(e) => setNewParam(e.target.value)}
                    placeholder="Tambah parameter (mis. no_ktp)"
                    className="flex-1 rounded-lg border px-3 py-2"
                    disabled={!canEdit}
                    title={!canEdit ? "Hanya Pentester yang dapat menambah parameter" : ""}
                  />
                  <button
                    onClick={addParam}
                    disabled={!canEdit}
                    className={cx(
                      "px-4 py-2 rounded-lg",
                      canEdit ? "bg-indigo-600 text-white hover:opacity-90" : "bg-gray-300 text-white cursor-not-allowed"
                    )}
                  >
                    Tambah
                  </button>
                </div>
                {!canEdit && (
                  <div className="text-xs text-gray-500">
                    Role <b>Developer</b> tidak memiliki izin untuk menambah parameter.
                  </div>
                )}
              </div>

              {/* -------- Evidence -------- */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-neutral-500">Evidence</div>
                  {canEdit && (
                    <div className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg"
                        className="hidden"
                        onChange={(e) => uploadEvidence(e.target.files)}
                        multiple
                      />
                      <button
                        onClick={handlePick}
                        disabled={upLoading}
                        className={cx(
                          "px-3 py-1.5 rounded-lg border",
                          upLoading ? "bg-gray-200 text-gray-500" : "bg-white hover:bg-gray-50"
                        )}
                      >
                        {upLoading ? "Uploading…" : "Upload Evidence"}
                      </button>
                    </div>
                  )}
                </div>

                {evidences.length === 0 ? (
                  <div className="text-sm text-neutral-500">Belum ada evidence.</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {evidences.map((ev) => (
                      <div key={ev.id} className="group relative rounded-xl border overflow-hidden bg-gray-100">
                        <div className="relative w-full aspect-[4/3]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={ev.url}
                            alt={ev.filename}
                            loading="lazy"
                            className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-[1.03] cursor-zoom-in"
                            onClick={() => setViewer(ev)}
                          />
                        </div>
                        <div className="p-2 text-xs truncate">{ev.filename}</div>
                        {canEdit && (
                          <button
                            onClick={() => deleteEvidence(ev.id)}
                            className="absolute top-2 right-2 hidden group-hover:flex items-center justify-center w-7 h-7 rounded-full bg-black/70 text-white"
                            title="Delete"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {!canEdit && (
                  <div className="text-xs text-gray-500">Role <b>Developer</b> hanya dapat melihat evidence.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LIGHTBOX VIEWER */}
      {viewer && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
          <button
            onClick={() => setViewer(null)}
            className="absolute top-4 right-4 px-3 py-1 rounded-lg bg-white/90 hover:bg-white shadow"
          >
            Close
          </button>
          <div className="w-full max-w-5xl max-h-[88vh]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={viewer.url} alt={viewer.filename} className="w-full h-full object-contain" />
            <div className="mt-2 text-center text-xs text-white/80 truncate">{viewer.filename}</div>
          </div>
        </div>
      )}
    </div>
  );
}
