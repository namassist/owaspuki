// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
// import { deleteServerSession } from "@/lib/auth"; // kalau kamu simpan sesi di DB

export async function POST() {
  // await deleteServerSession(); // optional: hapus record sesi di server
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: "session",
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",       // ← HARUS sama dengan saat set cookie
    maxAge: 0,       // ← hapus
  });
  return res;
}
