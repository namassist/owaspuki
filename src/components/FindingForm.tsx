// src/components/FindingForm.tsx
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { cvssBaseFromVector } from "@/lib/cvss";
import OwaspSelect from "@/components/OwaspSelect";

const CvssModal = dynamic(() => import("@/components/CvssModal"), { ssr: false });

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
const card = "rounded-2xl border border-gray-200 bg-white";
const input =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200";
const label = "text-sm font-medium";
const muted = "text-gray-500";

// Sumber label OWASP untuk mapping ID -> label lengkap
const OWASP_LABELS = [
  "A01: Broken Access Control",
  "A02: Cryptographic Failures",
  "A03: Injection",
  "A04: Insecure Design",
  "A05: Security Misconfiguration",
  "A06: Vulnerable and Outdated Components",
  "A07: Identification and Authentication Failures",
  "A08: Software and Data Integrity Failures",
  "A09: Security Logging and Monitoring Failures",
  "A10: Server-Side Request Forgery",
];

export default function FindingForm({ projectId }: { projectId?: string }) {
  // fields
  const [title, setTitle] = useState("");
  const [owaspId, setOwaspId] = useState<string>(""); // <-- dari OwaspSelect ("" | "A01" ... "A10")
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState<"GET" | "POST" | "PUT" | "DELETE">("GET");
  const [impact, setImpact] = useState("");
  const [desc, setDesc] = useState("");
  const [cvssVector, setCvssVector] = useState("");
  const [params, setParams] = useState("");

  // kalkulator cvss
  const [cvssOpen, setCvssOpen] = useState(false);
  const [cvssScore, setCvssScore] = useState<number | null>(null);
  const [cvssSeverity, setCvssSeverity] = useState<string | null>(null);

  // state
  const [submitting, setSubmitting] = useState(false);

  const owaspLabelFromId = (id: string) =>
    OWASP_LABELS.find((s) => s.startsWith(id)) || "";

  const clear = () => {
    setTitle("");
    setOwaspId("");
    setUrl("");
    setMethod("GET");
    setImpact("");
    setDesc("");
    setCvssVector("");
    setParams("");
    setCvssScore(null);
    setCvssSeverity(null);
  };

  const submit = async () => {
    if (!projectId) return alert("projectId tidak ditemukan");
    if (!title.trim()) return alert("Judul wajib diisi");
    if (!cvssVector.trim()) return alert("CVSS Vector wajib diisi (pakai kalkulator kalau perlu)");

    const owaspCatLabel = owaspLabelFromId(owaspId);

    setSubmitting(true);
    try {
      const body = {
        title: title.trim(),
        owaspCat: owaspCatLabel || null, // kirim label lengkap (atau null)
        url: url || null,
        method,
        impact: impact || null,
        description: desc || null,
        cvssVector: cvssVector || null,
        cvssScore: cvssScore ?? undefined,
        severity: cvssSeverity ?? undefined,
        params: params
          ? params
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
      };

      const apiUrl = `/api/vulns?projectId=${encodeURIComponent(projectId)}`;

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());

      clear();
      window.dispatchEvent(new Event("vulns:refresh"));
    } catch (e: any) {
      console.error(e);
      try {
        const parsed = JSON.parse(e?.message || "{}");
        alert(parsed?.error || "Gagal menambahkan temuan");
      } catch {
        alert(e?.message ?? "Gagal menambahkan temuan");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={cx(card, "p-4 md:p-6 space-y-4")}>
      {/* Judul + Kategori (pakai combobox OwaspSelect) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 space-y-2">
          <label className={label}>Judul temuan</label>
          <input
            className={input}
            placeholder="Mis. IDOR"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className={label}>Pilih kategori OWASP</label>
          <OwaspSelect value={owaspId} onChange={setOwaspId} />
          {owaspId && (
            <p className="text-xs text-gray-500 mt-1">
              Dipilih: <b>{owaspLabelFromId(owaspId)}</b>
            </p>
          )}
        </div>
      </div>

      {/* URL + Method */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 space-y-2">
          <label className={label}>URL (target endpoint)</label>
          <input
            className={input}
            placeholder="https://example.com/api/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className={label}>Method</label>
          <select className={input} value={method} onChange={(e) => setMethod(e.target.value as any)}>
            {["GET", "POST", "PUT", "DELETE"].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Impact */}
      <div className="space-y-2">
        <label className={label}>Impact / Risk</label>
        <textarea
          className={input}
          rows={2}
          placeholder="Ringkas impact & risiko"
          value={impact}
          onChange={(e) => setImpact(e.target.value)}
        />
      </div>

      {/* Deskripsi */}
      <div className="space-y-2">
        <label className={label}>Deskripsi (opsional)</label>
        <textarea
          className={input}
          rows={3}
          placeholder="Langkah reproduce, bukti, dll."
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
      </div>

      {/* CVSS Vector + Params + Tombol Kalkulator */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2 space-y-2">
          <label className={label}>CVSS Vector (v3.1)</label>
          <div className="flex gap-2">
            <input
              className={input + " flex-1"}
              placeholder="CVSS:3.1/AV:N/AC:L/PR:..."
              value={cvssVector}
              onChange={(e) => {
                const v = e.target.value;
                setCvssVector(v);
                try {
                  if (v.startsWith("CVSS:3.1/")) {
                    const { score, severity } = cvssBaseFromVector(v);
                    setCvssScore(score);
                    setCvssSeverity(severity);
                  } else {
                    setCvssScore(null);
                    setCvssSeverity(null);
                  }
                } catch {
                  setCvssScore(null);
                  setCvssSeverity(null);
                }
              }}
            />
            <button
              type="button"
              onClick={() => setCvssOpen(true)}
              className="rounded-xl border px-3 py-2 text-sm bg-white hover:bg-gray-50 border-gray-300"
            >
              Kalkulator CVSS
            </button>
          </div>
          <p className={"text-xs " + muted}>Isi manual atau lewat tombol kalkulator.</p>

          {(cvssScore || cvssSeverity) && (
            <div className="mt-2 text-sm text-gray-600">
              {typeof cvssScore === "number" && (
                <span className="mr-3 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs border-gray-300">
                  Score: {cvssScore.toFixed(1)}
                </span>
              )}
              {cvssSeverity && (
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs border-gray-300">
                  Severity: {cvssSeverity}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className={label}>Parameters (satu per baris)</label>
          <textarea
            className={input}
            rows={3}
            placeholder={"id=123\nrole=user"}
            value={params}
            onChange={(e) => setParams(e.target.value)}
          />
        </div>
      </div>

      {cvssOpen && (
        <CvssModal
          initialVector={cvssVector}
          onClose={() => setCvssOpen(false)}
          onSelect={(vector: string) => {
            setCvssVector(vector || "");
            try {
              const { score, severity } = cvssBaseFromVector(vector);
              setCvssScore(score);
              setCvssSeverity(severity);
            } catch {
              setCvssScore(null);
              setCvssSeverity(null);
            }
            setCvssOpen(false);
          }}
        />
      )}

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          onClick={submit}
          disabled={submitting}
          className={cx(
            "rounded-xl border px-4 py-2 text-sm font-medium",
            submitting ? "bg-gray-400 text-white border-gray-400" : "bg-black text-white border-black hover:opacity-90"
          )}
        >
          {submitting ? "Saving..." : "Tambah Temuan"}
        </button>
      </div>
    </div>
  );
}
