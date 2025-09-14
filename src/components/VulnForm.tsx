"use client"
import { useState } from "react"
import CvssModal from "./CvssModal"

const owaspCategories = [
  "A01: Broken Access Control",
  "A02: Cryptographic Failures",
  "A03: Injection",
  "A04: Insecure Design",
  "A05: Security Misconfiguration",
  "A06: Vulnerable and Outdated Components",
  "A07: Identification and Authentication Failures",
  "A08: Software and Data Integrity Failures",
  "A09: Security Logging and Monitoring Failures",
  "A10: Server-Side Request Forgery (SSRF)",
]

export default function VulnForm({ projectId }: { projectId: string }) {
  const [title, setTitle] = useState("")
  const [owaspCat, setOwaspCat] = useState("")
  const [url, setUrl] = useState("")
  const [method, setMethod] = useState("GET")
  const [impact, setImpact] = useState("")
  const [description, setDescription] = useState("")
  const [cvssVector, setVector] = useState("")
  const [params, setParams] = useState("")
  const [openCvss, setOpenCvss] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = {
      title, owaspCat, url, method, impact, description, cvssVector,
      params: params.split("\\n").map(p=>p.trim()).filter(Boolean),
    }
    const res = await fetch(`/api/vulns?projectId=${projectId}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      setTitle(""); setOwaspCat(""); setUrl(""); setImpact(""); setDescription(""); setVector(""); setParams("")
      window.dispatchEvent(new Event("vulns:refresh"))
    } else {
      alert("Gagal tambah finding")
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-3 bg-white p-4 rounded-xl shadow">
        <div className="flex gap-2">
          <input className="flex-1 border rounded-lg p-2" placeholder="Judul temuan"
            value={title} onChange={e=>setTitle(e.target.value)} />
          <select className="flex-1 border rounded-lg p-2" value={owaspCat} onChange={e=>setOwaspCat(e.target.value)}>
            <option value="">Pilih kategori OWASP</option>
            {owaspCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        <div className="flex gap-2">
          <input className="flex-1 border rounded-lg p-2" placeholder="URL (target endpoint)"
            value={url} onChange={e=>setUrl(e.target.value)} />
          <select className="w-32 border rounded-lg p-2" value={method} onChange={e=>setMethod(e.target.value)}>
            <option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option>
          </select>
        </div>

        <textarea className="w-full border rounded-lg p-2" placeholder="Impact / Risk"
          value={impact} onChange={e=>setImpact(e.target.value)} />
        <textarea className="w-full border rounded-lg p-2" placeholder="Deskripsi (opsional)"
          value={description} onChange={e=>setDescription(e.target.value)} />

        <div className="flex gap-2">
          <input className="flex-1 border rounded-lg p-2 font-mono" placeholder="CVSS Vector (v3.1)"
            value={cvssVector} onChange={e=>setVector(e.target.value)} />
          <button type="button" onClick={()=>setOpenCvss(true)}
            className="rounded-lg px-4 py-2 bg-gray-900 text-white">Kalkulator CVSS</button>
        </div>

        <textarea className="w-full border rounded-lg p-2" placeholder="Parameters (satu per baris)"
          value={params} onChange={e=>setParams(e.target.value)} />

        <button type="submit" className="w-full rounded-lg p-3 bg-gray-900 text-white">Tambah Temuan</button>
      </form>

      {openCvss && (
        <CvssModal initialVector={cvssVector}
          onClose={()=>setOpenCvss(false)}
          onSelect={(v)=>{ setVector(v); setOpenCvss(false) }} />
      )}
    </>
  )
}
