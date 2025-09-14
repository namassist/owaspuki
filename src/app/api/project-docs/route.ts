// src/app/api/project-docs/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import path from "path";
import { mkdir, writeFile, unlink } from "fs/promises";

export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "public", "project-docs");
const MAX_BYTES = 25 * 1024 * 1024; // 25MB
const ALLOWED = [
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
];

const safe = (n: string) => n.replace(/[^\w.\-]+/g, "_");

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

  const rows = await prisma.projectDoc.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId required" }, { status: 400 });

  const form = await req.formData();
  const file = form.get("file") as unknown as File | null;
  if (!file) return NextResponse.json({ error: "file required" }, { status: 400 });

  const mime = (file as any).type || "application/octet-stream";
  const size = (file as any).size ?? 0;
  const original = ((file as any).name as string) || "upload";

  if (!ALLOWED.includes(mime)) {
    return NextResponse.json({ error: "Only PDF/ZIP allowed" }, { status: 415 });
  }
  if (size <= 0 || size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 25MB)" }, { status: 413 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}_${safe(original)}`;
  await writeFile(path.join(UPLOAD_DIR, filename), buf);

  const rec = await prisma.projectDoc.create({
    data: {
      projectId,
      filename,
      originalName: original,
      mime,
      size: buf.length,
      url: `/project-docs/${filename}`,
    },
  });

  return NextResponse.json(rec, { status: 201 });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const doc = await prisma.projectDoc.delete({ where: { id } });
  try { await unlink(path.join(UPLOAD_DIR, doc.filename)); } catch {}
  return NextResponse.json({ ok: true });
}
