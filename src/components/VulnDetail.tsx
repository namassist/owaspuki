"use client"
import { useEffect, useState } from "react"

type Vuln = {
  id: string
  title: string
  description?: string
  owaspCat?: string
  url?: string
  method?: string
  impact?: string
  params: string[]
  cvssVector?: string
  cvssScore?: number
  severity: string
  status: string
}

export default function VulnDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const [row, setRow] = useState<Vuln | null>(null)
  const [newParam, setNewParam] = useState("")
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const res = await fetch(`/api/vulns/detail?id=${encodeURIComponent(id)}`)
    if (res.ok) setRow(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  const addParam = async () => {
    const p = newParam.trim()
    if (!p) return
    const res = await fetch(`/api/vulns/detail?id=${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pushParam: p }),
    })
    if (res.ok) {
      setNewParam("")
      await load()
      window.dispatchEvent(new Event("vulns:refresh"))
    } else {
      alert("Gagal menambah parameter")
      console.error(await res.text())
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4">
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow p-6">Loading...</div>
      </div>
    )
  }
  if (!row) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Detail Finding</h2>
          <button onClick={onClose} className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200">Close</button>
        </div>

        <div className="p-4 grid gap-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <div className="text-sm text-gray-500">Judul</div>
              <div className="font-medium">{row.title}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">OWASP</div>
              <div>{row.owaspCat || "-"}</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <div className="text-sm text-gray-500">URL</div>
              <div className="font-mono break-all">{row.url || "-"}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Method</div>
              <div>{row.method || "-"}</div>
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-500">Impact / Risk</div>
            <pre className="whitespace-pre-wrap">{row.impact || "-"}</pre>
          </div>

          {row.description ? (
            <div>
              <div className="text-sm text-gray-500">Deskripsi</div>
              <pre className="whitespace-pre-wrap">{row.description}</pre>
            </div>
          ) : null}

          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <div className="text-sm text-gray-500">CVSS Vector</div>
              <div className="font-mono break-all">{row.cvssVector || "-"}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Score</div>
              <div className="font-mono">{row.cvssScore?.toFixed(1) ?? "0.0"}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Severity</div>
              <div>{row.severity}</div>
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-500 mb-1">Parameters</div>
            <ul className="list-disc pl-6 space-y-1">
              {(row.params || []).map((p, idx) => (<li key={idx} className="font-mono">{p}</li>))}
              {(!row.params || row.params.length === 0) && <li className="text-gray-500">-</li>}
            </ul>

            <div className="mt-3 flex gap-2">
              <input
                className="border rounded-lg p-2 flex-1"
                placeholder="Tambah parameter (mis. no_ktp)"
                value={newParam}
                onChange={(e) => setNewParam(e.target.value)}
              />
              <button onClick={addParam} className="rounded-lg px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700">
                Tambah
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
