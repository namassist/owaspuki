"use client";

import { useState } from "react";

export default function LoginClient() {
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password: pwd }),
    });
    setBusy(false);
    if (r.ok) {
      location.href = "/projects";
    } else {
      setErr((await r.json()).error || "Login failed");
    }
  };

  return (
    <main className="min-h-screen grid place-items-center bg-gray-50 p-6">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border bg-white p-6 space-y-4">
        <h1 className="text-xl font-semibold">Sign in</h1>
        {err && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 p-2 text-sm">{err}</div>}
        <input
          className="w-full rounded-xl border px-3 py-2"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full rounded-xl border px-3 py-2"
          placeholder="Password"
          type="password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
        />
        <button
          disabled={busy}
          className={`w-full rounded-xl px-3 py-2 text-white ${busy ? "bg-gray-400" : "bg-black hover:opacity-90"}`}
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
