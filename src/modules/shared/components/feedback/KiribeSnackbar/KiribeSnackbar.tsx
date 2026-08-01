"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

type ToastSeverity = "success" | "error" | "info" | "warning";

type ShowToastOptions = {
  message: string;
  description?: string;
  severity?: ToastSeverity;
  /** Milliseconds before auto-dismiss. Pass 0 to require manual close. */
  duration?: number;
};

type Toast = {
  id: string;
  message: string;
  description?: string;
  severity: ToastSeverity;
  duration: number;
};

type KiribeToastContextValue = {
  showToast: (options: ShowToastOptions) => string;
  dismissToast: (id: string) => void;
};

const KiribeToastContext = createContext<KiribeToastContextValue | null>(null);

const DEFAULT_DURATION = 5000;
const EXIT_ANIMATION_MS = 220;

type IconComponent = ComponentType<{
  fontSize?: "inherit" | "small" | "medium" | "large";
  className?: string;
}>;

type SeverityConfig = {
  icon: IconComponent;
  iconWrap: string;
  iconTint: string;
  accent: string;
  ariaLive: "polite" | "assertive";
  role: "status" | "alert";
  label: string;
};

// Top accent uses severity for instant recognition. Error deliberately uses
// brand burgundy (not generic red) so failures still feel like Kiribé.
const severityConfig: Record<ToastSeverity, SeverityConfig> = {
  success: {
    icon: CheckCircleRoundedIcon,
    iconWrap: "bg-[color:var(--color-success-bg)]",
    iconTint: "text-[color:var(--color-success)]",
    accent: "bg-[color:var(--color-success)]",
    ariaLive: "polite",
    role: "status",
    label: "Success",
  },
  error: {
    icon: ErrorRoundedIcon,
    iconWrap: "bg-[color:var(--color-danger-bg)]",
    iconTint: "text-[color:var(--color-burgundy)]",
    accent: "bg-[color:var(--color-burgundy)]",
    ariaLive: "assertive",
    role: "alert",
    label: "Error",
  },
  warning: {
    icon: WarningAmberRoundedIcon,
    iconWrap: "bg-[color:var(--color-warning-bg)]",
    iconTint: "text-[color:var(--color-warning)]",
    accent: "bg-[color:var(--color-mustard)]",
    ariaLive: "polite",
    role: "status",
    label: "Warning",
  },
  info: {
    icon: InfoRoundedIcon,
    iconWrap: "bg-[color:var(--color-info-bg)]",
    iconTint: "text-[color:var(--color-info)]",
    accent: "bg-[color:var(--color-info)]",
    ariaLive: "polite",
    role: "status",
    label: "Info",
  },
};

let counter = 0;
const nextId = () => `kiribe-toast-${++counter}-${Date.now()}`;

export function KiribeSnackbarProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((options: ShowToastOptions) => {
    const id = nextId();
    setToasts((prev) => [
      ...prev,
      {
        id,
        message: options.message,
        description: options.description,
        severity: options.severity ?? "info",
        duration: options.duration ?? DEFAULT_DURATION,
      },
    ]);
    return id;
  }, []);

  const value = useMemo(
    () => ({ showToast, dismissToast: removeToast }),
    [showToast, removeToast]
  );

  return (
    <KiribeToastContext.Provider value={value}>
      {children}
      <div
        aria-label="Notifications"
        className="pointer-events-none fixed inset-x-0 top-4 z-[9999] flex flex-col items-center gap-3 px-4 sm:inset-x-auto sm:right-6 sm:top-6 sm:items-end sm:px-0"
      >
        {toasts.map((toast) => (
          <KiribeToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </KiribeToastContext.Provider>
  );
}

function KiribeToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const config = severityConfig[toast.severity];
  const Icon = config.icon;
  const [entered, setEntered] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const beginExit = useCallback(() => {
    setLeaving((prev) => {
      if (prev) return prev;
      window.setTimeout(() => onRemove(toast.id), EXIT_ANIMATION_MS);
      return true;
    });
  }, [onRemove, toast.id]);

  useEffect(() => {
    if (toast.duration <= 0) return;
    const timer = window.setTimeout(beginExit, toast.duration);
    return () => window.clearTimeout(timer);
  }, [beginExit, toast.duration]);

  const showing = entered && !leaving;

  return (
    <div
      role={config.role}
      aria-live={config.ariaLive}
      aria-atomic="true"
      className={[
        "pointer-events-auto w-full max-w-[calc(100vw-2rem)] sm:w-96",
        "overflow-hidden border border-[color:var(--color-border)] bg-white",
        "shadow-[var(--shadow-elevated)]",
        "transition-all duration-[220ms] ease-[var(--ease-out-soft)]",
        showing
          ? "translate-y-0 opacity-100 sm:translate-x-0"
          : "-translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-4",
      ].join(" ")}
    >
      <div className={["h-[2px] w-full", config.accent].join(" ")} />
      <div className="flex items-start gap-3 p-4">
        <div
          className={[
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            config.iconWrap,
          ].join(" ")}
          aria-hidden="true"
        >
          <Icon fontSize="small" className={config.iconTint} />
        </div>
        <span className="sr-only">{config.label}:</span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="font-headline text-[15px] font-semibold leading-snug text-[color:var(--color-ink)]">
            {toast.message}
          </p>
          {toast.description ? (
            <p className="mt-1 font-body text-[13px] leading-relaxed text-[color:var(--color-ink-secondary)]">
              {toast.description}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={beginExit}
          aria-label={`Dismiss ${config.label.toLowerCase()} notification`}
          className="-mr-1 -mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[color:var(--color-muted)] transition-colors hover:bg-[color:var(--color-surface-muted)] hover:text-[color:var(--color-ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-burgundy)]"
        >
          <CloseRoundedIcon style={{ fontSize: 18 }} />
        </button>
      </div>
    </div>
  );
}

export function useKiribeToast() {
  const ctx = useContext(KiribeToastContext);
  if (!ctx) {
    throw new Error("useKiribeToast must be used within KiribeSnackbarProvider");
  }
  return ctx;
}
