"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

type ToastSeverity = "success" | "error" | "info" | "warning";

type ToastState = {
  open: boolean;
  message: string;
  description?: string;
  severity: ToastSeverity;
};

type ShowToastOptions = {
  message: string;
  description?: string;
  severity?: ToastSeverity;
};

type KiribeToastContextValue = {
  showToast: (options: ShowToastOptions) => void;
};

const KiribeToastContext = createContext<KiribeToastContextValue | null>(null);

export function KiribeSnackbarProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: "",
    severity: "info",
  });

  const showToast = useCallback((options: ShowToastOptions) => {
    setToast({
      open: true,
      message: options.message,
      description: options.description,
      severity: options.severity ?? "info",
    });
  }, []);

  const handleClose = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <KiribeToastContext.Provider value={value}>
      {children}
      <Snackbar
        open={toast.open}
        autoHideDuration={5000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleClose} severity={toast.severity} variant="filled" className="w-full">
          {toast.message}
          {toast.description ? (
            <>
              <br />
              <span className="text-sm opacity-90">{toast.description}</span>
            </>
          ) : null}
        </Alert>
      </Snackbar>
    </KiribeToastContext.Provider>
  );
}

export function useKiribeToast() {
  const ctx = useContext(KiribeToastContext);
  if (!ctx) {
    throw new Error("useKiribeToast must be used within KiribeSnackbarProvider");
  }
  return ctx;
}
