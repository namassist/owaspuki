"use client";
import React, {useEffect, useMemo, useRef, useState} from "react";

type Props = {
  value: string;
  options: string[];
  disabled?: boolean;
  onChange: (val: string) => void;
  /** "auto" (default) | "up" | "down" */
  direction?: "auto" | "up" | "down";
};

const dot = (s: string) => {
  // warna titik kecil biar enak dilihat
  const m = s.toLowerCase();
  if (m.includes("open")) return "bg-gray-500";
  if (m.includes("progress")) return "bg-blue-600";
  if (m.includes("retest")) return "bg-amber-600";
  if (m.includes("close")) return "bg-emerald-600";
  return "bg-gray-400";
};

export default function StatusDropdown({
  value,
  options,
  disabled,
  onChange,
  direction = "auto",
}: Props) {
  const [open, setOpen] = useState(false);
  const [dir, setDir] = useState<"up"|"down">("down");
  const [alignRight, setAlignRight] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const label = useMemo(() => value, [value]);

  // tutup saat klik di luar
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!open) return;
      if (!btnRef.current || !menuRef.current) return;
      if (
        !btnRef.current.contains(e.target as Node) &&
        !menuRef.current.contains(e.target as Node)
      ) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // pilih arah (auto) + perataan horizontal biar gak mentok kanan
  useEffect(() => {
    if (!open || !btnRef.current) return;
    const pick = () => {
      const b = btnRef.current!.getBoundingClientRect();
      const need = menuRef.current?.offsetHeight ?? 200;
      const spaceBelow = window.innerHeight - b.bottom;
      const spaceAbove = b.top;

      if (direction === "up") setDir("up");
      else if (direction === "down") setDir("down");
      else setDir(spaceBelow >= need ? "down" : spaceAbove >= need ? "up" : (spaceBelow >= spaceAbove ? "down" : "up"));

      // align kanan kalau mepet sisi kanan
      const menuW = menuRef.current?.offsetWidth ?? 240;
      const spaceRight = window.innerWidth - b.left;
      setAlignRight(spaceRight < menuW + 16); // 16px buffer
    };

    pick();
    const r = () => pick();
    window.addEventListener("resize", r);
    window.addEventListener("scroll", r, true);
    return () => {
      window.removeEventListener("resize", r);
      window.removeEventListener("scroll", r, true);
    };
  }, [open, direction]);

  return (
    <div className="relative inline-block text-sm">
      <button
        ref={btnRef}
        type="button"
        disabled={!!disabled}
        onClick={() => setOpen(v => !v)}
        className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 bg-white hover:bg-gray-50 border-gray-300 disabled:opacity-50`}
      >
        <span className={`h-2 w-2 rounded-full ${dot(value)}`} />
        {label}
        <svg width="16" height="16" viewBox="0 0 20 20" className="ml-1 opacity-70">
          <path d="M5 8l5 5 5-5" fill="currentColor" />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          className={[
            "absolute z-50 min-w-[12rem] overflow-hidden rounded-xl border bg-white shadow-lg",
            dir === "down" ? "top-full mt-2" : "bottom-full mb-2",
            alignRight ? "right-0" : "left-0",
          ].join(" ")}
        >
          <ul className="py-1">
            {options.map(opt => {
              const active = opt === value;
              return (
                <li key={opt}>
                  <button
                    onClick={() => { onChange(opt); setOpen(false); }}
                    className={[
                      "w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50",
                      active ? "bg-gray-50" : ""
                    ].join(" ")}
                  >
                    <span className={`h-2 w-2 rounded-full ${dot(opt)}`} />
                    <span className="flex-1">{opt}</span>
                    {active && (
                      <svg width="16" height="16" viewBox="0 0 24 24" className="text-emerald-600">
                        <path fill="currentColor" d="M9 16.2l-3.5-3.5L4 14.2l5 5 12-12-1.5-1.5z"/>
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
