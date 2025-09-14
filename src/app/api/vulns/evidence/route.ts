import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import path from "path";
import { mkdir, writeFile, unlink } from "fs/promises";

export const runtime = "nodejs";

const UPLOAD_DIR = path.join(process.cwd(), "public", "evidence");
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIMES = ["image/png", "image/jpeg"];
const isDev = process.env.NODE_ENV !== "production";

function safeName(name: string) {
  return name.replace(/[^\w.-]+/g, "_");
}
function isPng(buf: Buffer) {
  return (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  );
}
function isJpeg(buf: Buffer) {
  return buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8 && buf[buf.length - 2] === 0xff && buf[buf.length - 1] === 0xd9;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const findingId = searchParams.get("findingId");
    if (!findingId) return NextResponse.json({ error: "findingId required" }, { status: 400 });

    const rows = await prisma.evidence.findMany({
      where: { findingId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(rows);
  } catch (e) {
    console.error("GET /evidence error:", e);
    return NextResponse.json({ error: isDev ? String(e) : "Internal error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const findingId = searchParams.get("findingId");
    if (!findingId) return NextResponse.json({ error: "findingId required" }, { status: 400 });

    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "file required" }, { status: 400 });

    const contentType = (file as any).type || "application/octet-stream";
    const size = (file as any).size ?? 0;

    if (!ALLOWED_MIMES.includes(contentType)) {
      return NextResponse.json({ error: "Only PNG/JPG allowed" }, { status: 415 });
    }
    if (size <= 0 || size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (contentType === "image/png" && !isPng(buffer)) {
      return NextResponse.json({ error: "Invalid PNG file" }, { status: 415 });
    }
    if (contentType === "image/jpeg" && !isJpeg(buffer)) {
      return NextResponse.json({ error: "Invalid JPG file" }, { status: 415 });
    }

    const originalName = ((file as any).name as string) || "upload";
    const finalName = `${Date.now()}_${Math.random().toString(36).slice(2)}_${safeName(originalName)}`;

    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, finalName), buffer);

    const record = await prisma.evidence.create({
      data: {
        findingId,
        filename: finalName,
        contentType,            // ← pakai kolom schema kamu
        size: buffer.length,
        url: `/evidence/${finalName}`,
        // uploadedById: <isi kalau mau wajib>,
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (e) {
    console.error("POST /evidence error:", e);
    return NextResponse.json({ error: isDev ? String(e) : "Internal error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const ev = await prisma.evidence.delete({ where: { id } });

    try {
      await unlink(path.join(UPLOAD_DIR, ev.filename));
    } catch { /* ignore */ }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /evidence error:", e);
    return NextResponse.json({ error: isDev ? String(e) : "Internal error" }, { status: 500 });
  }
}
