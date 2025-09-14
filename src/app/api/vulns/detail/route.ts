// src/app/api/vulns/detail/route.ts
import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const DEV_ALLOWED = new Set(["In Progress", "Waiting Retest"]);
const ALL_STATUSES = new Set(["Open", "In Progress", "Waiting Retest", "Close"]);

async function getMe() {
  const uid = cookies().get("uid")?.value;
  if (!uid) return null;
  return prisma.user.findUnique({ where: { id: uid }, select: { id: true, role: true } });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const finding = await prisma.finding.findUnique({ where: { id } });
  if (!finding) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(finding);
}

export async function PATCH(req: Request) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const body = await req.json();
  const data: any = { ...body };

  // Validasi / pembatasan status
  if (typeof body.status === "string") {
    if (!ALL_STATUSES.has(body.status)) {
      return NextResponse.json({ error: "invalid status" }, { status: 400 });
    }
    if (me.role !== "Pentester" && !DEV_ALLOWED.has(body.status)) {
      return NextResponse.json({ error: "forbidden for role" }, { status: 403 });
    }
  }

  // handle pushParam jika dipakai di UI lain
  if (body.pushParam) {
    const current = await prisma.finding.findUnique({ where: { id }, select: { params: true } });
    if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });
    data.params = [...(current.params ?? []), body.pushParam];
    delete data.pushParam;
  }

  const updated = await prisma.finding.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const me = await getMe();
  if (!me) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (me.role !== "Pentester") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.finding.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
