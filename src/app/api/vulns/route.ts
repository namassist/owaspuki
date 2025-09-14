// // src/app/api/vulns/route.ts
// import { NextResponse } from "next/server"
// import { prisma } from "../../../lib/prisma"
// import { cvssBaseFromVector } from "../../../lib/cvss"

// export async function GET(req: Request) {
//   const { searchParams } = new URL(req.url)
//   const projectId = searchParams.get("projectId") || undefined

//   const rows = await prisma.finding.findMany({
//     where: { projectId },
//     orderBy: { createdAt: "desc" },
//     select: {
//       id: true, title: true, owaspCat: true, cvssScore: true, severity: true,
//       status: true, url: true, method: true, impact: true, params: true, cvssVector: true
//     }
//   })
//   return NextResponse.json(rows)
// }

// export async function POST(req: Request) {
//   const { searchParams } = new URL(req.url)
//   const projectId = searchParams.get("projectId")
//   if (!projectId) {
//     return NextResponse.json({ error: "projectId required" }, { status: 400 })
//   }

//   const body = await req.json()
//   const { score, severity } = cvssBaseFromVector(body.cvssVector)

//   const created = await prisma.finding.create({
//     data: {
//       title: body.title,
//       description: body.description ?? "",
//       owaspCat: body.owaspCat ?? "",
//       cvssVector: body.cvssVector ?? "",
//       cvssScore: score,
//       severity,
//       status: "Open",
//       url: body.url ?? "",
//       method: body.method ?? "GET",
//       impact: body.impact ?? "",
//       params: Array.isArray(body.params) ? body.params : [],
//       projectId,
//       // kalau ada reporterId/session silakan isi di sini
//     },
//   })

//   return NextResponse.json(created, { status: 201 })
// }

// export async function DELETE(req: Request) {
//   const { searchParams } = new URL(req.url)
//   const id = searchParams.get("id")
//   if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

//   try {
//     await prisma.finding.delete({ where: { id } })
//     return NextResponse.json({ ok: true })
//   } catch (err) {
//     console.error(err)
//     return NextResponse.json({ error: "delete failed" }, { status: 500 })
//   }
// }
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cvssBaseFromVector } from "@/lib/cvss";

// helper sederhana: pakai 1 user default supaya reporterId terpenuhi
async function ensureOwnerId(): Promise<string> {
  const u = await prisma.user.findFirst();
  if (u) return u.id;
  const n = await prisma.user.create({
    data: { email: "owner@local", name: "Owner" },
  });
  return n.id;
}

// GET: list per project atau detail by id
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const projectId = searchParams.get("projectId");

  if (id) {
    const finding = await prisma.finding.findUnique({ where: { id } });
    if (!finding) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(finding);
  }

  if (projectId) {
    const rows = await prisma.finding.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(rows);
  }

  return NextResponse.json({ error: "projectId or id required" }, { status: 400 });
}

// POST: tambah finding ke project
export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

  const body = await req.json();
  const { title, owaspCat, url, method, impact, description, cvssVector, params } = body;

  const { score, severity } = cvssBaseFromVector(cvssVector);
  const reporterId = await ensureOwnerId();

  const created = await prisma.finding.create({
    data: {
      title,
      owaspCat,
      url,
      method: method ?? "POST",
      impact,
      description,
      cvssVector,
      cvssScore: score,
      severity,
      params: Array.isArray(params) ? params : [],
      status: "Open",
      reporterId,
      projectId,
    },
  });

  return NextResponse.json(created, { status: 201 });
}

// DELETE: hapus by id
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.finding.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
