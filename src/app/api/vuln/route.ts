import { prisma } from "@/lib/prisma";
import { cvssBaseFromVector } from "@/lib/cvss";

export async function GET() {
  const vulns = await prisma.finding.findMany({
    orderBy: { createdAt: "desc" },
  });
  return Response.json(vulns);
}

export async function POST(req: Request) {
  try {
    const { title, description, owaspCat, cvssVector } = await req.json();

    const { score, severity } = cvssBaseFromVector(cvssVector);

    const created = await prisma.finding.create({
      data: {
        title,
        description,
        owaspCat,
        cvssVector,
        cvssScore: score,
        severity,
        status: "Open",
        // reporterId opsional; kalau belum ada auth, isi dummy
        reporter: {
          connectOrCreate: {
            where: { email: "admin@example.com" },
            create: { email: "admin@example.com", password: "dummy" },
          },
        },
        // projectId required; create default project if none exists
        project: {
          connectOrCreate: {
            where: { id: "default-project" },
            create: {
              id: "default-project",
              name: "Default Project",
              description: "Default project for vulnerabilities",
            },
          },
        },
      },
    });
    return Response.json(created, { status: 201 });
  } catch (e: any) {
    console.error(e);
    return new Response("Bad Request", { status: 400 });
  }
}
