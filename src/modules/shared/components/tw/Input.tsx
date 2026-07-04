"use client";

import * as React from "react";
import { cn } from "./cn";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  helperText?: string;
  error?: string | boolean;
  /** Subtle on a colored panel (e.g. the burgundy newsletter band). */
  surface?: "default" | "light";
  containerClassName?: string;
};

let __idCounter = 0;
function useFallbackId() {
  const [id] = React.useState(() => `kiribe-input-${++__idCounter}`);
  return id;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    id,
    label,
    helperText,
    error,
    surface = "default",
    className,
    containerClassName,
    ...props
  },
  ref
) {
  const fallbackId = useFallbackId();
  const inputId = id ?? fallbackId;
  const helperId = `${inputId}-helper`;
  const errorText = typeof error === "string" ? error : null;
  const isInvalid = Boolean(error);

  return (
    <div className={cn("flex flex-col gap-1.5", containerClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="font-body text-xs font-semibold uppercase tracking-[0.08em] text-muted"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={isInvalid || undefined}
        aria-describedby={helperText || errorText ? helperId : undefined}
        className={cn(
          "w-full rounded border px-3.5 py-3 text-[0.9375rem] font-body text-ink",
          "transition-colors duration-150 placeholder:text-muted/60",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mustard",
          surface === "light"
            ? "bg-white border-transparent focus-visible:border-mustard"
            : "bg-white border-border focus-visible:border-burgundy",
          isInvalid && "border-red-500 focus-visible:ring-red-300",
          className
        )}
        {...props}
      />
      {(errorText || helperText) && (
        <span
          id={helperId}
          className={cn(
            "font-body text-xs",
            isInvalid ? "text-red-200" : "text-muted"
          )}
        >
          {errorText ?? helperText}
        </span>
      )}
    </div>
  );
});
