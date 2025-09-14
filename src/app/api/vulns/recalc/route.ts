import { NextResponse } from "next/server"
import { prisma } from "../../../../lib/prisma"
import { cvssBaseFromVector } from "../../../../lib/cvss"

// Disable static generation for this route
export const dynamic = 'force-dynamic'

export async function GET() {
  const all = await prisma.finding.findMany({
    select: { id: true, cvssVector: true, cvssScore: true, severity: true }
  })

  let updated = 0
  for (const f of all) {
    const v = f.cvssVector ?? ""
    const { score, severity } = v ? cvssBaseFromVector(v) : { score: 0, severity: "None" }
    if (score !== f.cvssScore || severity !== f.severity) {
      await prisma.finding.update({
        where: { id: f.id },
        data: { cvssScore: score, severity }
      })
      updated++
    }
  }
  return NextResponse.json({ ok: true, updated })
}
