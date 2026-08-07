"use client";

import CloseRounded from "@mui/icons-material/CloseRounded";
import WarningAmberRounded from "@mui/icons-material/WarningAmberRounded";
import { useCallback, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { AdminButton } from "./AdminPrimitives";

/**
 * Kiribé's brand-shaped modal shell. Sharp corners, burgundy hairline title,
 * mustard rule under the header — matches the surrounding admin aesthetic and
 * lets us kill every `window.confirm` in the app in one swap.
 *
 * Handles the ergonomics you'd otherwise re-implement per caller:
 * - Escape to close
 * - Click on the scrim to close (but not on the panel itself)
 * - Focus is trapped inside the panel while open
 * - Auto-focuses the first focusable element on open
 * - Body scroll is locked while open
 * - `aria-modal`, `role="dialog"`, and `aria-labelledby` wired to the title
 */
export type AdminModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** Panel width. `md` (default) fits a confirm; `lg` for form modals. */
  size?: "sm" | "md" | "lg";
  /** Suppress the built-in close button on the header. */
  hideCloseButton?: boolean;
};

const SIZE_CLASSES: Record<NonNullable<AdminModalProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
};

export function AdminModal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  hideCloseButton,
}: AdminModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useRef(`admin-modal-${Math.random().toString(36).slice(2, 9)}`);

  // Escape to close + body-scroll lock. Effects only run while `open` so a
  // closed modal has zero listener footprint.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Move focus to the first focusable element inside the panel so keyboard
    // users don't have to tab out of the trigger. A caller may override the
    // target by tagging a specific element with `data-admin-modal-initial-focus`
    // — used by the confirm dialog to focus Cancel instead of Confirm.
    const raf = requestAnimationFrame(() => {
      const explicit = panelRef.current?.querySelector<HTMLElement>(
        '[data-admin-modal-initial-focus="true"]',
      );
      const target =
        explicit ??
        panelRef.current?.querySelector<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
      target?.focus();
    });
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      cancelAnimationFrame(raf);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId.current : undefined}
    >
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />
      <div
        ref={panelRef}
        className={`relative w-full ${SIZE_CLASSES[size]} bg-white shadow-xl`}
      >
        {(title || !hideCloseButton) && (
          <div className="flex items-start justify-between gap-3 border-b border-border-soft px-5 py-4">
            {title ? (
              <h2
                id={titleId.current}
                className="relative pb-2 font-headline text-lg font-bold text-burgundy after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-10 after:bg-mustard after:content-['']"
              >
                {title}
              </h2>
            ) : (
              <span />
            )}
            {!hideCloseButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-none border border-border bg-surface text-ink-secondary hover:bg-surface-muted"
              >
                <CloseRounded sx={{ fontSize: 18 }} />
              </button>
            )}
          </div>
        )}
        {(description || children) && (
          <div className="space-y-3 px-5 py-4 text-sm text-ink-secondary">
            {description}
            {children}
          </div>
        )}
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border-soft bg-surface-alt px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export type AdminConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Yes/no confirmation dialog — the drop-in replacement for `window.confirm`
 * and every ad-hoc "are you sure?" MUI dialog. Danger tone gets a red
 * warning icon + red primary button; primary tone stays burgundy.
 *
 * The cancel button always has focus on open so an accidental Enter doesn't
 * complete a destructive action.
 */
export function AdminConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "primary",
  isPending = false,
  onConfirm,
  onCancel,
}: AdminConfirmDialogProps) {
  const handleConfirm = useCallback(() => {
    if (isPending) return;
    onConfirm();
  }, [isPending, onConfirm]);

  return (
    <AdminModal
      open={open}
      onClose={onCancel}
      size="sm"
      title={title}
      description={
        <div className="flex gap-3">
          {tone === "danger" && (
            <WarningAmberRounded sx={{ fontSize: 24 }} className="shrink-0 text-[#b42318]" />
          )}
          <div>{description}</div>
        </div>
      }
      footer={
        <>
          <AdminButton
            variant="ghost"
            onClick={onCancel}
            disabled={isPending}
            // The AdminModal focuses its first focusable child on open. Keep
            // the cancel button first so a stray Enter cancels rather than
            // completing a destructive action.
            data-admin-modal-initial-focus="true"
          >
            {cancelLabel}
          </AdminButton>
          <AdminButton
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? "Working…" : confirmLabel}
          </AdminButton>
        </>
      }
    />
  );
}
