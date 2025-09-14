import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import path from "path";
import { unlink } from "fs/promises";

const EVIDENCE_DIR = path.join(process.cwd(), "public", "evidence");
const DOC_DIR = path.join(process.cwd(), "public", "project_docs");

export async function PATCH(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const body = await req.json();
  const project = await prisma.project.update({
    where: { id },
    data: {
      ...(body.name ? { name: body.name } : {}),
      ...(body.description ? { description: body.description } : {}),
      ...(body.status ? { /* jika punya kolom status */ } : {}),
    },
  });
  return NextResponse.json(project);
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    // 1) ambil semua finding di project ini
    const findings = await prisma.finding.findMany({
      where: { projectId: id },
      select: { id: true },
    });
    const findingIds = findings.map(f => f.id);

    // 2) ambil evidences (buat hapus file)
    const evidences = findingIds.length
      ? await prisma.evidence.findMany({
          where: { findingId: { in: findingIds } },
          select: { id: true, filename: true },
        })
      : [];

    // 3) hapus evidences di DB
    if (findingIds.length) {
      await prisma.evidence.deleteMany({ where: { findingId: { in: findingIds } } });
    }

    // 4) hapus file evidence di disk (best effort)
    await Promise.all(
      evidences.map(ev =>
        unlink(path.join(EVIDENCE_DIR, ev.filename)).catch(() => {})
      )
    );

    // 5) hapus dokumen project (kalau fitur upload-doc project sudah ada)
    const docs = await prisma.projectDoc.findMany({
      where: { projectId: id },
      select: { id: true, filename: true },
    }).catch(() => [] as {id:string; filename:string}[]);

    if (docs.length) {
      await prisma.projectDoc.deleteMany({ where: { projectId: id } });
      await Promise.all(
        docs.map(d => unlink(path.join(DOC_DIR, d.filename)).catch(() => {}))
      );
    }

    // 6) hapus semua finding di project
    await prisma.finding.deleteMany({ where: { projectId: id } });

    // 7) hapus project
    await prisma.project.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("DELETE /api/projects/detail error:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
