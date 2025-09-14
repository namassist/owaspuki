import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const u = await getSessionUser();
  if (!u) notFound();

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="rounded-2xl border bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-full bg-black text-white grid place-items-center font-semibold">
            {u.name?.slice(0,2).toUpperCase() ?? "U"}
          </div>
          <div>
            <div className="text-lg font-semibold">{u.name ?? "User"}</div>
            <div className="text-gray-500">{u.email}</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-6 space-y-3">
        <h2 className="text-lg font-semibold">Account</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-500">Name</label>
            <input className="w-full border rounded px-3 py-2" defaultValue={u.name ?? ""} disabled />
          </div>
          <div>
            <label className="text-sm text-gray-500">Email</label>
            <input className="w-full border rounded px-3 py-2" defaultValue={u.email} disabled />
          </div>
        </div>
      </div>

      <div>
        <a href="/projects" className="inline-flex items-center rounded-xl border px-3 py-2">
          ← Back to Projects
        </a>
      </div>
    </main>
  );
}
