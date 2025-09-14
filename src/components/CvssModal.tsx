"use client"
import { useMemo, useState } from "react"
import { cvssBaseFromVector } from "../lib/cvss"

type Choice = { k: string; v: string; label: string }

const METRICS: Record<string, Choice[]> = {
  AV: [
    {k:"AV", v:"N", label:"Network (N)"},
    {k:"AV", v:"A", label:"Adjacent (A)"},
    {k:"AV", v:"L", label:"Local (L)"},
    {k:"AV", v:"P", label:"Physical (P)"},
  ],
  AC: [
    {k:"AC", v:"L", label:"Low (L)"},
    {k:"AC", v:"H", label:"High (H)"},
  ],
  PR: [
    {k:"PR", v:"N", label:"None (N)"},
    {k:"PR", v:"L", label:"Low (L)"},
    {k:"PR", v:"H", label:"High (H)"},
  ],
  UI: [
    {k:"UI", v:"N", label:"None (N)"},
    {k:"UI", v:"R", label:"Required (R)"},
  ],
  S: [
    {k:"S", v:"U", label:"Unchanged (U)"},
    {k:"S", v:"C", label:"Changed (C)"},
  ],
  C: [
    {k:"C", v:"N", label:"None (N)"},
    {k:"C", v:"L", label:"Low (L)"},
    {k:"C", v:"H", label:"High (H)"},
  ],
  I: [
    {k:"I", v:"N", label:"None (N)"},
    {k:"I", v:"L", label:"Low (L)"},
    {k:"I", v:"H", label:"High (H)"},
  ],
  A: [
    {k:"A", v:"N", label:"None (N)"},
    {k:"A", v:"L", label:"Low (L)"},
    {k:"A", v:"H", label:"High (H)"},
  ],
}

function pill(active: boolean) {
  return "px-3 py-1 rounded-lg border text-sm " + (active ? "bg-green-600 text-white border-green-700" : "bg-gray-100 hover:bg-gray-200 border-gray-300")
}

export default function CvssModal({ initialVector, onClose, onSelect }: {
  initialVector?: string
  onClose: () => void
  onSelect: (vector: string) => void
}) {
  // parse initial vector if any
  const defaults: Record<string,string> = {
    AV:"N", AC:"L", PR:"L", UI:"R", S:"U", C:"L", I:"L", A:"L"
  }
  if (initialVector?.startsWith("CVSS:3.1/")) {
    initialVector.replace("CVSS:3.1/","").split("/").forEach(p=>{
      const [k,v] = p.split(":"); if(k && v) defaults[k]=v
    })
  }

  const [vals, setVals] = useState<Record<string,string>>(defaults)

  const vector = useMemo(()=>{
    const order = ["AV","AC","PR","UI","S","C","I","A"]
    const body = order.map(k => `${k}:${vals[k]}`).join("/")
    return `CVSS:3.1/${body}`
  }, [vals])

  const { score, severity } = useMemo(()=>cvssBaseFromVector(vector), [vector])

  const set = (k: string, v: string) => setVals(prev => ({...prev, [k]: v}))

  return (
    <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">CVSS v3.1 Calculator</h2>
          <div className="flex items-center gap-3">
            <div className={"px-3 py-1 rounded-lg text-white " + 
              (score>=9? "bg-red-600": score>=7? "bg-orange-500": score>=4? "bg-yellow-500": score>0? "bg-green-600": "bg-gray-500")
            }>
              {score.toFixed(1)} ({severity})
            </div>
            <button onClick={onClose} className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200">Close</button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 p-6">
          <div className="space-y-5">
            <h3 className="font-semibold">Base Metrics (Attack)</h3>
            <div>
              <div className="font-medium mb-2">Attack Vector (AV)</div>
              <div className="flex flex-wrap gap-2">
                {METRICS.AV.map(c => (
                  <button key={c.v} className={pill(vals.AV===c.v)} onClick={()=>set("AV", c.v)}>{c.label}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="font-medium mb-2">Attack Complexity (AC)</div>
              <div className="flex flex-wrap gap-2">
                {METRICS.AC.map(c => (
                  <button key={c.v} className={pill(vals.AC===c.v)} onClick={()=>set("AC", c.v)}>{c.label}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="font-medium mb-2">Privileges Required (PR)</div>
              <div className="flex flex-wrap gap-2">
                {METRICS.PR.map(c => (
                  <button key={c.v} className={pill(vals.PR===c.v)} onClick={()=>set("PR", c.v)}>{c.label}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="font-medium mb-2">User Interaction (UI)</div>
              <div className="flex flex-wrap gap-2">
                {METRICS.UI.map(c => (
                  <button key={c.v} className={pill(vals.UI===c.v)} onClick={()=>set("UI", c.v)}>{c.label}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <h3 className="font-semibold">Base Metrics (Impact)</h3>
            <div>
              <div className="font-medium mb-2">Scope (S)</div>
              <div className="flex flex-wrap gap-2">
                {METRICS.S.map(c => (
                  <button key={c.v} className={pill(vals.S===c.v)} onClick={()=>set("S", c.v)}>{c.label}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="font-medium mb-2">Confidentiality (C)</div>
              <div className="flex flex-wrap gap-2">
                {METRICS.C.map(c => (
                  <button key={c.v} className={pill(vals.C===c.v)} onClick={()=>set("C", c.v)}>{c.label}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="font-medium mb-2">Integrity (I)</div>
              <div className="flex flex-wrap gap-2">
                {METRICS.I.map(c => (
                  <button key={c.v} className={pill(vals.I===c.v)} onClick={()=>set("I", c.v)}>{c.label}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="font-medium mb-2">Availability (A)</div>
              <div className="flex flex-wrap gap-2">
                {METRICS.A.map(c => (
                  <button key={c.v} className={pill(vals.A===c.v)} onClick={()=>set("A", c.v)}>{c.label}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t grid gap-2">
          <div className="text-sm text-gray-500">Vector String</div>
          <div className="font-mono p-3 rounded-lg bg-green-600 text-white break-all">{vector}</div>
          <div className="flex justify-end gap-2">
            <button onClick={()=>onSelect(vector)} className="rounded-lg px-4 py-2 bg-black text-white">Gunakan Vector</button>
          </div>
        </div>
      </div>
    </div>
  )
}
