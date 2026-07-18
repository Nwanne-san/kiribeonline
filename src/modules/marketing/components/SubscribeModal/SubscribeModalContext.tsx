"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { SubscribeModal } from "./SubscribeModal";

type SubscribeModalContextValue = {
  open: () => void;
  close: () => void;
  isOpen: boolean;
};

const SubscribeModalContext = createContext<SubscribeModalContextValue | null>(null);

/**
 * Provides the newsletter subscribe modal + an `open()` trigger to any descendant
 * (navbar Subscribe button, inline CTAs). The modal itself is rendered once here.
 */
export function SubscribeModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

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
