"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/modules/shared/components/tw/cn";
import { useOnlineStatus } from "@/utils/hooks";

type BannerMode = "hidden" | "offline" | "reconnected";

const RECONNECTED_VISIBLE_MS = 3000;

/**
 * Slim connectivity bar pinned under the sticky site header.
 *
 * Shows a persistent burgundy notice while offline and a brief green
 * "Back online" confirmation on reconnect before dismissing itself.
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [mode, setMode] = useState<BannerMode>("hidden");
  const hasBeenOffline = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      hasBeenOffline.current = true;
      setMode("offline");
      return;
    }

    if (hasBeenOffline.current) {
      hasBeenOffline.current = false;
      setMode("reconnected");
      const timer = setTimeout(() => setMode("hidden"), RECONNECTED_VISIBLE_MS);
      return () => clearTimeout(timer);
    }

    setMode("hidden");
  }, [isOnline]);

  const reconnected = mode === "reconnected";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "sticky top-16 z-40 flex items-center justify-center gap-2 px-4 py-2 text-center font-body text-sm font-medium text-white transition-colors",
        mode === "hidden" && "hidden",
        reconnected ? "bg-success" : "bg-burgundy"
      )}
    >
      {mode !== "hidden" &&
        (reconnected ? (
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 shrink-0"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M5 12.5 L10 17.5 L19 7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 shrink-0"
            fill="none"
            aria-hidden="true"
            focusable="false"
          >
            {/* rabbit-ear antenna with a broken-signal slash */}
            <path
              d="M12 14 L7 4 M12 14 L17 4 M12 14 L12 20 M8 20 H16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 4 L20 20"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.7"
            />
          </svg>
        ))}
      <span>
        {reconnected
          ? "Back online"
          : "You're offline — some stories may be unavailable"}
      </span>
    </div>
  );
}
