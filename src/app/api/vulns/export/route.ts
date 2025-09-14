import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cvssBaseFromVector } from "@/lib/cvss";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId") || undefined;

  const rows = await prisma.finding.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      owaspCat: true,
      cvssScore: true,
      severity: true,
      status: true,
      url: true,
      method: true,
      impact: true,
      params: true,
      cvssVector: true,
    },
  });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  const body = await req.json();
  const { score, severity } = cvssBaseFromVector(body.cvssVector);

  // First, ensure the default reporter exists
  const reporter = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: { email: "admin@example.com", password: "dummy" },
  });

  const created = await prisma.finding.create({
    data: {
      title: body.title,
      description: body.description ?? "",
      owaspCat: body.owaspCat ?? "",
      cvssVector: body.cvssVector ?? "",
      cvssScore: score,
      severity,
      status: "Open",
      url: body.url ?? "",
      method: body.method ?? "GET",
      impact: body.impact ?? "",
      params: Array.isArray(body.params) ? body.params : [],
      projectId,
      reporterId: reporter.id,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
