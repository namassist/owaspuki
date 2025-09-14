"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

export type OwOpt = { id: string; label: string };
const OPTIONS: OwOpt[] = [
  { id: "",    label: "—" },
  { id: "A01", label: "A01: Broken Access Control" },
  { id: "A02", label: "A02: Cryptographic Failures" },
  { id: "A03", label: "A03: Injection" },
  { id: "A04", label: "A04: Insecure Design" },
  { id: "A05", label: "A05: Security Misconfiguration" },
  { id: "A06", label: "A06: Vulnerable and Outdated Components" },
  { id: "A07", label: "A07: Identification and Authentication Failures" },
  { id: "A08", label: "A08: Software and Data Integrity Failures" },
  { id: "A09", label: "A09: Security Logging and Monitoring Failures" },
  { id: "A10", label: "A10: Server-Side Request Forgery" },
];

function classNames(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export default function OwaspSelect({
  value,
  onChange,
  placeholder = "Pilih kategori OWASP",
  disabled,
}: {
  value?: string | null;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const selected = useMemo(
    () => OPTIONS.find(o => o.id === (value ?? "")) ?? OPTIONS[0],
    [value]
  );

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return OPTIONS;
    return OPTIONS.filter(o => o.label.toLowerCase().includes(s) || o.id.toLowerCase().includes(s));
  }, [q]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as any)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 10);
      setActive(0);
      setQ("");
    }
  }, [open]);

  function commit(opt: OwOpt) {
    onChange(opt.id);
    setOpen(false);
  }

  function onKey(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive(a => Math.min(a + 1, Math.max(filtered.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(a => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = filtered[active] ?? filtered[0];
      if (opt) commit(opt);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="relative" ref={wrapRef} onKeyDown={onKey}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={classNames(
          "w-full flex items-center justify-between rounded-xl border px-3 py-2 text-sm bg-white",
          "border-gray-300 hover:bg-gray-50 transition-colors",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={classNames(!selected.id && "text-gray-400")}>
          {selected.id ? selected.label : placeholder}
        </span>
        <svg className="ml-2" width="16" height="16" viewBox="0 0 24 24">
          <path fill="currentColor" d="M7 10l5 5 5-5z" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="p-2">
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari A03 / Injection…"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-gray-200"
            />
          </div>

          <ul
            role="listbox"
            className="max-h-60 overflow-auto py-1"
          >
            {filtered.map((o, i) => (
              <li
                key={o.id + o.label}
                role="option"
                aria-selected={o.id === selected.id}
                onMouseEnter={() => setActive(i)}
                onClick={() => commit(o)}
                className={classNames(
                  "cursor-pointer px-3 py-2 text-sm",
                  i === active ? "bg-gray-100" : "hover:bg-gray-50",
                  o.id === selected.id && "font-medium"
                )}
              >
                <span className={classNames(!o.id && "text-gray-500")}>{o.label}</span>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-gray-500">Tidak ada hasil</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
