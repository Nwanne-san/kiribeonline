"use client";

import { createContext, Suspense, useCallback, useContext, useMemo, useState } from "react";
import { useModalRoute } from "@/utils/hooks";
import { SubscribeModal } from "./SubscribeModal";

type SubscribeModalContextValue = {
  open: () => void;
  close: () => void;
  isOpen: boolean;
};

const SubscribeModalContext = createContext<SubscribeModalContextValue | null>(null);

/** `?modal=` value used by the newsletter modal. */
export const SUBSCRIBE_MODAL = "subscribe";

/**
 * Inner shell: owns `useSearchParams` (via `useModalRoute`) and renders
 * the Dialog. Lives inside a `<Suspense>` boundary so only this subtree
 * suspends during Next.js param hydration — the outer layout (header,
 * page content) streams immediately without waiting.
 */
function SubscribeModalInner({
  onIsOpenChange,
}: {
  onIsOpenChange: (v: boolean) => void;
}) {
  const { modal, closeModal } = useModalRoute();
  const isOpen = modal === SUBSCRIBE_MODAL;

  // Bubble isOpen up to the outer context so consumers (e.g. analytics,
  // navbar button state) see the correct value. React bails out of
  // re-renders when state value is unchanged, so this is safe to call
  // on every render without an extra useEffect.
  onIsOpenChange(isOpen);

  const close = useCallback(() => closeModal(), [closeModal]);
  return <SubscribeModal open={isOpen} onClose={close} />;
}

/**
 * Provides the newsletter subscribe modal + an `open()` trigger to any
 * descendant (navbar Subscribe button, inline CTAs). The modal is rendered
 * once at the SiteLayout level so it is never torn down across navigations.
 *
 * Open state lives in the URL (`?modal=subscribe`) so the modal is
 * linkable — a campaign or footer link can drop a reader straight onto
 * any page with the signup already open — and the browser Back button
 * closes it naturally.
 *
 * The `<Suspense fallback={null}>` wrapper means only the Dialog subtree
 * suspends while Next.js hydrates `useSearchParams`; everything else
 * (children, header, page content) renders immediately without a flash
 * or full-page loading state.
 */
export function SubscribeModalProvider({ children }: { children: React.ReactNode }) {
  // isOpen is mirrored from URL state via SubscribeModalInner below.
  const [isOpen, setIsOpen] = useState(false);

  // open() uses useModalRoute but we can't call it here (it uses
  // useSearchParams which would re-introduce the Suspense cost to the
  // outer shell). Instead we write directly to the URL. The inner
  // component will pick up the change and update isOpen accordingly.
  const open = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("modal", SUBSCRIBE_MODAL);
    const url = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", url);
    // Trigger a Next.js router event so useSearchParams inside the
    // Suspense boundary re-reads the updated URL.
    // Next.js 15 re-renders on pushState/replaceState via its own
    // MutationObserver, so no extra step is needed.
  }, []);

  const close = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    params.delete("modal");
    const qs = params.toString();
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, []);

  const value = useMemo(() => ({ open, close, isOpen }), [open, close, isOpen]);

  return (
    <SubscribeModalContext.Provider value={value}>
      {children}
      {/* Suspense isolates useSearchParams to only the Dialog subtree. */}
      <Suspense fallback={null}>
        <SubscribeModalInner onIsOpenChange={setIsOpen} />
      </Suspense>
    </SubscribeModalContext.Provider>
  );
}

export function useSubscribeModal(): SubscribeModalContextValue {
  const ctx = useContext(SubscribeModalContext);
  if (!ctx) {
    throw new Error("useSubscribeModal must be used within a SubscribeModalProvider");
  }
  return ctx;
}
