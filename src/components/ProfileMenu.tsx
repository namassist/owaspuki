"use client";

import { useState } from "react";
import Link from "next/link";

export default function ProfileMenu({ name, email }: { name?: string | null; email?: string | null }) {
  const [open, setOpen] = useState(false);
  const initials =
    (name?.trim() || email || "U")
      .split(" ")
      .map(s => s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/login";
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="size-10 rounded-full bg-black text-white grid place-items-center font-semibold"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {initials}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-52 rounded-xl border bg-white shadow-lg p-1 z-50"
          onMouseLeave={() => setOpen(false)}
        >
          <div className="px-3 py-2">
            <div className="text-sm font-medium">{name ?? "User"}</div>
            <div className="text-xs text-gray-500 truncate">{email}</div>
          </div>
          <Link
            href="/profile"
            className="block w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 text-sm"
            onClick={() => setOpen(false)}
          >
            Profile
          </Link>
          <button
            className="block w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 text-sm text-red-600"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
