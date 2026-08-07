"use client";

import InfoOutlined from "@mui/icons-material/InfoOutlined";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

/**
 * Lightweight, dependency-free tooltip. Shows on hover for pointer users, on
 * focus for keyboard users, and dismisses on Escape. Positioned above the
 * trigger by default — pass `placement="bottom"` for the info-tip use case
 * where the trigger sits at the top of a field.
 */
export type AdminTooltipProps = {
  content: ReactNode;
  children: ReactNode;
  placement?: "top" | "bottom";
  className?: string;
};

export function AdminTooltip({
  content,
  children,
  placement = "top",
  className = "",
}: AdminTooltipProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <span
      ref={wrapperRef}
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className={`pointer-events-none absolute left-1/2 z-50 w-max max-w-xs -translate-x-1/2 whitespace-normal bg-[#1e2939] px-3 py-2 text-left text-xs leading-snug text-white shadow-md ${
            placement === "top" ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          {content}
        </span>
      )}
    </span>
  );
}

/**
 * Field-level info tip: a small "i" icon that reveals guidance on hover or
 * focus. Use it next to a form label when the field's purpose isn't obvious
 * from the label alone (slug rules, hero-image use, publish behavior).
 */
export function AdminInfoTip({
  content,
  ariaLabel = "More info",
  className = "",
}: {
  content: ReactNode;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <AdminTooltip content={content} className={className}>
      <button
        type="button"
        aria-label={ariaLabel}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-border bg-surface-alt text-muted-soft transition-colors hover:border-burgundy hover:text-burgundy focus:outline-none focus:ring-2 focus:ring-burgundy/30"
      >
        <InfoOutlined sx={{ fontSize: 12 }} />
      </button>
    </AdminTooltip>
  );
}
