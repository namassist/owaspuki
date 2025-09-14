import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { randomUUID } from "crypto";

// Akun demo lokal (ganti sesuai kebutuhan)
const DEMO: Record<string, { pw: string; role: Role; name: string }> = {
  "admin@example.com": { pw: "admin123", role: Role.Pentester, name: "Admin" },
  "dev@example.com":   { pw: "dev123",   role: Role.Developer, name: "Dev User" },
};

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const e = String(email).toLowerCase();

    // 1) kalau user sudah ada di DB → terima (dev mode). Production: cek password hash.
    let user = await prisma.user.findUnique({ where: { email: e } });
    if (!user) {
      // 2) belum ada → cek akun demo, lalu create
      const demo = DEMO[e];
      if (!demo || demo.pw !== password) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }
      user = await prisma.user.create({ data: { email: e, role: demo.role, name: demo.name } });
    }

    // Buat session token HttpOnly
    const token = randomUUID();
    await prisma.session.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 hari
      },
    });

    cookies().set("session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
}

// Hindari GET nyasar
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
