"use client";

import CheckRounded from "@mui/icons-material/CheckRounded";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Searchable, keyboard-navigable single-select. Drop-in replacement for a
 * plain `<select>` where the option list is long enough that scrolling by
 * name is painful (Editor's Picks, author picker, category picker).
 *
 * Keeps the raw list in a controlled `options` prop so the caller owns
 * fetching/caching; input filtering is client-side and case-insensitive.
 * Keyboard controls: Enter/Space opens, ↑/↓ navigate, Enter selects,
 * Escape closes.
 *
 * Renders with the same visual language as `AdminSelect` — sharp corners,
 * burgundy focus ring, mustard hover accent — so it drops into any admin
 * form without additional styling.
 */
export type AdminSearchableOption = {
  value: string;
  label: string;
  /** Optional secondary line rendered under the label (e.g. slug, byline). */
  hint?: string;
  /** Non-selectable rows (e.g. archived items) render greyed and skip keyboard cursor. */
  disabled?: boolean;
};

export type AdminSearchableSelectProps = {
  value: string;
  onChange: (next: string) => void;
  options: AdminSearchableOption[];
  placeholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
  /** No results text when filter matches nothing. */
  noResultsLabel?: string;
  /** Show search bar in dropdown (defaults to true if options > 3, or explicitly configured). */
  searchable?: boolean;
  /** Renders error styling when invalid. */
  invalid?: boolean;
  className?: string;
  buttonClassName?: string;
  clearable?: boolean;
};

export function AdminSearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  emptyLabel = "No options available",
  disabled = false,
  id,
  ariaLabel,
  noResultsLabel = "No matches",
  searchable,
  invalid = false,
  className = "",
  buttonClassName = "",
  clearable = false,
}: AdminSearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const showSearch = searchable !== undefined ? searchable : options.length > 3;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => {
      const l = o.label.toLowerCase();
      const h = o.hint?.toLowerCase() ?? "";
      return l.includes(q) || h.includes(q);
    });
  }, [options, query]);

  // Close on outside click. Attached only while open so a closed select has
  // no listener overhead.
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      // Small raf so the panel is mounted before we focus.
      requestAnimationFrame(() => inputRef.current?.focus());
      setCursor(0);
    } else {
      setQuery("");
    }
  }, [open]);

  const currentLabel =
    options.find((o) => o.value === value)?.label ?? "";

  const handleKey = (event: React.KeyboardEvent) => {
    if (!open) {
      if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor((c) => Math.min(filtered.length - 1, c + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const target = filtered[cursor];
      if (target && !target.disabled) {
        onChange(target.value);
        setOpen(false);
      }
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`} onKeyDown={handleKey}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-2 rounded-none border bg-surface px-3 py-2 text-left text-sm text-ink transition-colors focus:border-burgundy focus:outline-none focus:ring-2 focus:ring-burgundy/20 disabled:cursor-not-allowed disabled:opacity-60 ${
          invalid ? "border-red-500 ring-1 ring-red-500/20" : "border-border"
        } ${buttonClassName}`}
      >
        <span className={`truncate ${currentLabel ? "font-normal" : "text-muted-soft"}`}>
          {currentLabel || placeholder}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          {clearable && value && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="text-muted-soft hover:text-ink text-xs px-1"
            >
              ×
            </span>
          )}
          <ExpandMoreRounded
            sx={{ fontSize: 18 }}
            className={`text-muted-soft transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-1 max-h-72 overflow-hidden border border-border bg-surface shadow-lg"
        >
          {showSearch && (
            <div className="flex items-center gap-2 border-b border-border-soft bg-surface-alt px-2.5 py-2">
              <SearchRounded sx={{ fontSize: 16 }} className="shrink-0 text-muted-soft" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setCursor(0);
                }}
                placeholder="Search…"
                className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted-soft"
              />
            </div>
          )}
          <div className="max-h-56 overflow-y-auto py-1">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-soft">{emptyLabel}</div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-soft">{noResultsLabel}</div>
            ) : (
              filtered.map((option, index) => {
                const active = index === cursor;
                const selected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={option.disabled}
                    role="option"
                    aria-selected={selected}
                    onMouseEnter={() => setCursor(index)}
                    onClick={() => {
                      if (option.disabled) return;
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors disabled:opacity-50 ${
                      active ? "bg-surface-alt" : ""
                    } ${selected ? "text-burgundy font-medium bg-burgundy/5" : "text-ink"}`}
                  >
                    <CheckRounded
                      sx={{ fontSize: 16 }}
                      className={`mt-0.5 shrink-0 ${selected ? "opacity-100 text-burgundy" : "opacity-0"}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{option.label}</span>
                      {option.hint && (
                        <span className="block truncate text-xs text-muted-soft">
                          {option.hint}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
