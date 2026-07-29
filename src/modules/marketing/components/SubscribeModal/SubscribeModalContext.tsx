"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
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
 * Provides the newsletter subscribe modal + an `open()` trigger to any descendant
 * (navbar Subscribe button, inline CTAs). The modal itself is rendered once here.
 *
 * Open state lives in the URL (`?modal=subscribe`) rather than component state,
 * so the modal is linkable — a campaign or footer link can drop a reader
 * straight onto any page with the signup already open — and Back closes it.
 */
export function SubscribeModalProvider({ children }: { children: React.ReactNode }) {
  const { modal, openModal, closeModal } = useModalRoute();
  const isOpen = modal === SUBSCRIBE_MODAL;

  const open = useCallback(() => openModal(SUBSCRIBE_MODAL), [openModal]);
  const close = useCallback(() => closeModal(), [closeModal]);

  const value = useMemo(() => ({ open, close, isOpen }), [open, close, isOpen]);

  return (
    <SubscribeModalContext.Provider value={value}>
      {children}
      <SubscribeModal open={isOpen} onClose={close} />
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
