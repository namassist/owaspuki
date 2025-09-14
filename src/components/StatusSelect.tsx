"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type Status = "Open" | "In Progress" | "Waiting Retest" | "Close";

const STYLES: Record<Status, { pill: string; dot: string; label: string }> = {
  Open: { pill: "bg-gray-100 text-gray-800 border-gray-200", dot: "bg-gray-500", label: "Open" },
  "In Progress": { pill: "bg-blue-100 text-blue-800 border-blue-200", dot: "bg-blue-600", label: "In Progress" },
  "Waiting Retest": { pill: "bg-amber-100 text-amber-800 border-amber-200", dot: "bg-amber-600", label: "Waiting Retest" },
  Close: { pill: "bg-emerald-100 text-emerald-800 border-emerald-200", dot: "bg-emerald-600", label: "Close" },
};

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

export default function StatusSelect({
  value,
  options,
  disabled,
  onChange,
}: {
  value: Status;
  options: Status[];
  disabled?: boolean;
  onChange: (next: Status) => void;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  // posisi menu (pakai fixed + portal)
  const [pos, setPos] = useState<{ top: number; left: number; width: number; place: "bottom" | "top" }>({
    top: 0,
    left: 0,
    width: 0,
    place: "bottom",
  });

  const recalc = () => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const gutter = 8; // jarak sedikit dari edges
    const menuW = 192; // ~w-48
    const menuH = 200; // perkiraan max sebelum scroll

    // default di bawah
    let place: "bottom" | "top" = "bottom";
    let top = r.bottom + 6;

    // kalau tidak muat di bawah, taruh di atas
    if (r.bottom + 6 + menuH > vh && r.top - 6 - menuH >= 0) {
      place = "top";
      top = r.top - 6 - Math.min(menuH, r.top - gutter);
    }

    // kalkulasi kiri, prefer sejajar kiri tombol
    let left = r.left;
    // kalau mepet kanan, geser supaya full terlihat
    if (left + menuW + gutter > vw) left = Math.max(gutter, vw - menuW - gutter);
    // jangan kurang dari gutter
    if (left < gutter) left = gutter;

    setPos({ top, left, width: r.width, place });
  };

  // hitung posisi saat open, dan close saat scroll/resize
  useLayoutEffect(() => {
    if (!open) return;
    recalc();

    const close = () => setOpen(false);
    const onScroll = () => setOpen(false);
    const onResize = () => setOpen(false);

    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", close);

    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", close);
    };
  }, [open]);

  // click luar / Esc → tutup
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!btnRef.current) return;
      const menu = document.getElementById("__status_menu_portal");
      const target = e.target as Node;
      if (!btnRef.current.contains(target) && (!menu || !menu.contains(target))) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const s = STYLES[value] ?? STYLES.Open;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cx(
          "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition",
          s.pill,
          disabled && "opacity-60 cursor-not-allowed"
        )}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className={cx("h-2.5 w-2.5 rounded-full", s.dot)} />
        {s.label}
        <svg className="ml-1" width="14" height="14" viewBox="0 0 24 24">
          <path fill="currentColor" d="M7 10l5 5 5-5z" />
        </svg>
      </button>

      {open &&
        createPortal(
          <div
            id="__status_menu_portal"
            role="menu"
            className="fixed z-[1000] w-48 max-h-64 overflow-auto rounded-2xl border border-gray-200 bg-white shadow-xl p-1"
            style={{ top: pos.top, left: pos.left }}
          >
            {options.map((opt) => {
              const st = STYLES[opt];
              const active = opt === value;
              return (
                <button
                  key={opt}
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    if (opt !== value) onChange(opt);
                  }}
                  className={cx(
                    "w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-sm",
                    active ? "bg-gray-100" : "hover:bg-gray-50"
                  )}
                >
                  <span className={cx("h-2.5 w-2.5 rounded-full", st.dot)} />
                  <span className="flex-1">{st.label}</span>
                  {active && (
                    <svg width="16" height="16" viewBox="0 0 24 24" className="text-gray-600">
                      <path fill="currentColor" d="M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.5-1.5z" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </>
  );
}
