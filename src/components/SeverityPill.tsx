"use client";

const MAP: Record<string, { pill: string; dot: string; label: string }> = {
  Critical: { pill: "bg-red-100 text-red-800 border-red-200", dot: "bg-red-600", label: "Critical" },
  High:     { pill: "bg-orange-100 text-orange-800 border-orange-200", dot: "bg-orange-600", label: "High" },
  Medium:   { pill: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-600", label: "Medium" },
  Low:      { pill: "bg-blue-100 text-blue-800 border-blue-200", dot: "bg-blue-600", label: "Low" },
  None:     { pill: "bg-gray-100 text-gray-800 border-gray-200", dot: "bg-gray-500", label: "None" },
};

function cx(...c: (string | false | null | undefined)[]) { return c.filter(Boolean).join(" "); }

export default function SeverityPill({ value }: { value?: string | null }) {
  const s = MAP[value ?? "None"] ?? MAP.None;
  return (
    <span className={cx("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium", s.pill)}>
      <span className={cx("h-2.5 w-2.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}
