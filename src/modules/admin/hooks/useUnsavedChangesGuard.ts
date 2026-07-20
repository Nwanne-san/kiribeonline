"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

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
 *      and pop a `confirm()` before letting the navigation proceed. On confirm
 *      we call through; on cancel we swallow the call and the URL is untouched.
 *
 * The in-app guard is intentionally patched at mount instead of wrapping every
 * `router.push` call site — the editor has links (breadcrumb, cancel button,
 * side nav) that don't know about editor state, and asking every one to
 * consult the dirty flag would be error-prone.
 *
 * Safe to call unconditionally; the `dirty` flag gates the behavior so the
 * effect can turn off without unmount.
 */
export function useUnsavedChangesGuard(dirty: boolean, message?: string): void {
  const router = useRouter();

  useEffect(() => {
    if (!dirty) return;

    const prompt = message ?? "You have unsaved changes. Leave without saving?";

    // Browser exits (close/reload/back).
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Legacy browsers require the return-value assignment; modern browsers
      // ignore the string and show their own copy.
      event.returnValue = prompt;
      return prompt;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    // In-app navigation via next/navigation. Patch on this router instance
    // only; restore on cleanup so we can't leak the wrapper into an unrelated
    // screen if the guard flag toggles.
    type PushFn = typeof router.push;
    type ReplaceFn = typeof router.replace;
    const originalPush: PushFn = router.push.bind(router);
    const originalReplace: ReplaceFn = router.replace.bind(router);

    const guardedPush: PushFn = (href, options) => {
      if (window.confirm(prompt)) {
        return originalPush(href, options);
      }
      return undefined;
    };
    const guardedReplace: ReplaceFn = (href, options) => {
      if (window.confirm(prompt)) {
        return originalReplace(href, options);
      }
      return undefined;
    };

    router.push = guardedPush;
    router.replace = guardedReplace;

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      router.push = originalPush;
      router.replace = originalReplace;
    };
  }, [dirty, message, router]);
}
