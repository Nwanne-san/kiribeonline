"use client";

import { useEffect, useRef } from "react";

/**
 * Debounced autosave.
 *
 * When `enabled` is true and the `signature` changes (a stable JSON key of
 * the fields we care about), the hook waits `delayMs` and then calls
 * `save()`. Rapid edits reset the timer, so a typing editor doesn't fire
 * one request per keystroke.
 *
 * Pitfall: after `await save()` resolves, we do NOT setDirty(false) here.
 * The caller passes a `dirtyCounter` (incremented on every edit) into
 * `save`; the save function snapshots the counter before the await and
 * only clears dirty state if the counter hasn't advanced. That contract
 * belongs in the caller so it can also apply to manual saves.
 *
 * The hook is a no-op when disabled — safe to call unconditionally.
 */
export function useAutosave(
  enabled: boolean,
  signature: string,
  save: () => void,
  delayMs: number
): void {
  // Latch the current save fn so a re-render doesn't invalidate an in-flight
  // timer (we don't want to re-arm just because the callback identity changed).
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  // Skip the first fire — the initial render's "signature" is the freshly
  // hydrated form value, which isn't a user edit and shouldn't autosave.
  const primed = useRef(false);

  useEffect(() => {
    if (!enabled) {
      primed.current = false;
      return;
    }
    if (!primed.current) {
      primed.current = true;
      return;
    }
    const timer = window.setTimeout(() => {
      saveRef.current();
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [enabled, signature, delayMs]);
}
