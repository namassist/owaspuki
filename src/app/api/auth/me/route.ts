// src/app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const u = await getSessionUser();
  if (!u) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ id: u.id, email: u.email, role: u.role, name: u.name ?? null });
}
