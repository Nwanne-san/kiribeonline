"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import { useRouter } from "next/navigation";
import { AdminConfirmDialog } from "@/modules/admin/components/ui/AdminDialog";

/**
 * Block accidental data loss when a form is dirty.
 *
 * Two exits are guarded:
 *
 *   1. Browser navigation (tab close, hard reload, back/forward) — we set
 *      `event.returnValue` so the browser shows its native "Leave site?"
 *      prompt. Wording is browser-controlled; we can only opt in.
 *   2. In-app navigation via `next/navigation` (Link, router.push, router.replace) —
 *      we monkey-patch the router's `push`/`replace` while the guard is active
 *      and show the branded `AdminConfirmDialog` before letting the navigation
 *      proceed. On confirm we call through; on cancel the URL is untouched.
 *
 * The in-app guard is intentionally patched at mount instead of wrapping every
 * `router.push` call site — the editor has links (breadcrumb, cancel button,
 * side nav) that don't know about editor state, and asking every one to
 * consult the dirty flag would be error-prone.
 *
 * Consumers must render the returned `dialog` element for the confirm to
 * show. It's a portal-less inline element so it renders wherever it's placed.
 */
export interface UnsavedChangesGuardApi {
  /**
   * Navigate without triggering the confirm prompt — use for programmatic
   * redirects the caller *knows* are safe (e.g. after a successful save
   * that hasn't yet flushed `dirty` back through React's render cycle).
   * When the guard is inactive, this is a plain `router.push`.
   */
  navigateSafely: (href: string, mode?: "push" | "replace") => void;
  /** Branded confirm dialog; render inside the guarded page. */
  dialog: ReactElement;
}

type Pending = { href: string; mode: "push" | "replace"; options?: unknown };

export function useUnsavedChangesGuard(
  dirty: boolean,
  message?: string
): UnsavedChangesGuardApi {
  const router = useRouter();
  const [pending, setPending] = useState<Pending | null>(null);

  // The originals live in a ref so both the effect (for cleanup) and
  // navigateSafely (for the bypass) see the SAME underlying functions.
  const originalPushRef = useRef<typeof router.push | null>(null);
  const originalReplaceRef = useRef<typeof router.replace | null>(null);

  const navigateSafely = useCallback(
    (href: string, mode: "push" | "replace" = "push") => {
      const push = originalPushRef.current ?? router.push.bind(router);
      const replace = originalReplaceRef.current ?? router.replace.bind(router);
      if (mode === "replace") replace(href);
      else push(href);
    },
    [router]
  );

  useEffect(() => {
    if (!dirty) return;

    const prompt = message ?? "You have unsaved changes. Leave without saving?";

    // Browser exits (close/reload/back).
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = prompt;
      return prompt;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    type PushFn = typeof router.push;
    type ReplaceFn = typeof router.replace;
    const originalPush: PushFn = router.push.bind(router);
    const originalReplace: ReplaceFn = router.replace.bind(router);
    originalPushRef.current = originalPush;
    originalReplaceRef.current = originalReplace;

    const guardedPush: PushFn = (href, options) => {
      setPending({ href: String(href), mode: "push", options });
      return undefined;
    };
    const guardedReplace: ReplaceFn = (href, options) => {
      setPending({ href: String(href), mode: "replace", options });
      return undefined;
    };

    router.push = guardedPush;
    router.replace = guardedReplace;

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      router.push = originalPush;
      router.replace = originalReplace;
      originalPushRef.current = null;
      originalReplaceRef.current = null;
      // Clear any pending confirm from the previous session — turning the
      // guard off should never leave a floating modal behind.
      setPending(null);
    };
  }, [dirty, message, router]);

  const dialog = (
    <AdminConfirmDialog
      open={pending !== null}
      title="Unsaved changes"
      description={
        message ??
        "You have unsaved changes on this page. Leave without saving — your edits will be discarded."
      }
      confirmLabel="Leave without saving"
      cancelLabel="Stay on page"
      tone="danger"
      onConfirm={() => {
        const target = pending;
        setPending(null);
        if (!target) return;
        // Use the stashed originals — the patched fns would just re-queue us.
        const push = originalPushRef.current ?? router.push.bind(router);
        const replace = originalReplaceRef.current ?? router.replace.bind(router);
        if (target.mode === "replace") replace(target.href);
        else push(target.href);
      }}
      onCancel={() => setPending(null)}
    />
  );

  return { navigateSafely, dialog };
}
