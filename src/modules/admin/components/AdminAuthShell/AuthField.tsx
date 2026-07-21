"use client";

import type { InputHTMLAttributes } from "react";
import { forwardRef, useId, useState } from "react";

const BASE_INPUT =
  "block w-full rounded-md border border-border bg-white px-3 py-2.5 text-[15px] leading-6 text-ink shadow-sm placeholder:text-ink-secondary focus:outline-none focus-visible:border-burgundy focus-visible:ring-2 focus-visible:ring-burgundy/20 disabled:cursor-not-allowed disabled:opacity-60";

type AuthFieldProps = {
  label: string;
  hint?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id">;

/** Text/email input matching the admin auth chrome. Label + optional hint. */
export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(
  function AuthField({ label, hint, className = "", ...rest }, ref) {
    const id = useId();
    const hintId = hint ? `${id}-hint` : undefined;
    return (
      <div className={className}>
        <label
          htmlFor={id}
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-secondary"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          className={BASE_INPUT}
          aria-describedby={hintId}
          {...rest}
        />
        {hint && (
          <p id={hintId} className="mt-1.5 text-xs leading-5 text-ink-secondary">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

/**
 * Password field with a show/hide toggle. The toggle button has the accessible
 * name "Toggle password" so the same e2e locator strategy used against the MUI
 * login works after the Tailwind rebuild.
 */
export const AuthPasswordField = forwardRef<HTMLInputElement, AuthFieldProps>(
  function AuthPasswordField({ label, hint, className = "", ...rest }, ref) {
    const id = useId();
    const hintId = hint ? `${id}-hint` : undefined;
    const [visible, setVisible] = useState(false);
    return (
      <div className={className}>
        <label
          htmlFor={id}
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-secondary"
        >
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={visible ? "text" : "password"}
            className={`${BASE_INPUT} pr-11`}
            aria-describedby={hintId}
            {...rest}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label="Toggle password"
            aria-pressed={visible}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-secondary hover:text-ink"
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
        {hint && (
          <p id={hintId} className="mt-1.5 text-xs leading-5 text-ink-secondary">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.94 10.94 0 0112 20c-6.5 0-10-7-10-7a19.9 19.9 0 014.22-5.44M9.9 4.24A10.94 10.94 0 0112 4c6.5 0 10 7 10 7a19.9 19.9 0 01-3.06 4.19M1 1l22 22" />
      <path d="M9 9a3 3 0 105.83 1" />
    </svg>
  );
}
