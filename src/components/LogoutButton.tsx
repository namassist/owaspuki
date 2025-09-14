"use client";
import { useState } from "react";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  const doLogout = async () => {
    if (loading) return;
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login"; // arahkan ke halaman login kamu
  };

  return (
    <button
      onClick={doLogout}
      className="inline-flex items-center rounded-xl border px-3 py-2 text-sm font-medium bg-transparent hover:bg-gray-100 border-transparent"
    >
      {loading ? "Logging out..." : "Logout"}
    </button>
  );
}
