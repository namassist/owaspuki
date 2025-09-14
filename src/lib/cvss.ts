type M = "AV"|"AC"|"PR"|"UI"|"S"|"C"|"I"|"A"

export function cvssBaseFromVector(vector?: string): { score:number; severity:string } {
  if (!vector || !vector.startsWith("CVSS:3.1/")) return { score: 0, severity: "None" }
  const map = new Map<M,string>()
  vector.replace("CVSS:3.1/","").split("/").forEach(p=>{
    const [k,v] = p.split(":") as [M,string]; if(k&&v) map.set(k,v)
  })
  const AV = { N:0.85, A:0.62, L:0.55, P:0.2 }[map.get("AV") as any] ?? 0.85
  const AC = { L:0.77, H:0.44 }[map.get("AC") as any] ?? 0.77
  const UI = { N:0.85, R:0.62 }[map.get("UI") as any] ?? 0.62
  const S  = map.get("S") === "C" ? "C" : "U"
  const C  = { H:0.56, L:0.22, N:0 }[map.get("C") as any] ?? 0
  const I  = { H:0.56, L:0.22, N:0 }[map.get("I") as any] ?? 0
  const A  = { H:0.56, L:0.22, N:0 }[map.get("A") as any] ?? 0
  let PR: number
  if (S === "U") PR = { N:0.85, L:0.62, H:0.27 }[map.get("PR") as any] ?? 0.62
  else           PR = { N:0.85, L:0.68, H:0.5  }[map.get("PR") as any] ?? 0.68
  const exploitability = 8.22 * AV * AC * PR * UI
  const impactSub = 1 - (1-C)*(1-I)*(1-A)
  const impact = S === "U" ? 6.42 * impactSub : 7.52*(impactSub-0.029) - 3.25*Math.pow(impactSub-0.02, 15)
  let score = 0
  if (impact <= 0) score = 0
  else score = (S === "U")
    ? Math.min(impact + exploitability, 10)
    : Math.min(1.08 * (impact + exploitability), 10)
  const severity =
    score === 0 ? "None" :
    score < 4   ? "Low"  :
    score < 7   ? "Medium" :
    score < 9   ? "High" : "Critical"
  return { score: Math.round(score*10)/10, severity }
}
