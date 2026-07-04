"use client";

import { useEffect } from "react";

/**
 * Root-level error boundary. This renders when the root layout itself fails,
 * so it cannot rely on the app shell, global stylesheet, theme providers, or
 * CSS custom properties — everything is self-contained with inline styles and
 * literal brand colors.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error boundary:", error.digest ?? error.message, error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          backgroundColor: "#faf8f5",
          color: "#1a1a1a",
          fontFamily:
            "'Open Sans', system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        }}
      >
        <div style={{ maxWidth: "440px", textAlign: "center" }}>
          <svg
            viewBox="0 0 240 180"
            width="160"
            height="120"
            fill="none"
            aria-hidden="true"
            focusable="false"
            style={{ marginBottom: "8px" }}
          >
            <ellipse cx="120" cy="94" rx="86" ry="62" fill="#6b1d2a" opacity="0.06" />
            <g
              stroke="#6b1d2a"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M56 96 C56 92 59 90 63 90 L138 90 C142 90 145 92 145 96 L145 128 C145 132 142 134 138 134 L63 134 C59 134 56 132 56 128 Z" />
              <path d="M70 134 L66 146" />
              <path d="M130 134 L134 146" />
              <circle cx="82" cy="72" r="17" />
              <circle cx="124" cy="72" r="17" />
              <path d="M145 102 L172 94 L172 124 L145 118" />
            </g>
            <g stroke="#c9a227" strokeWidth="2.5" strokeLinecap="round" fill="none">
              <path d="M132 128 C150 138 168 122 158 108 C150 98 178 96 186 112" />
            </g>
          </svg>
          <h1
            style={{
              fontFamily: "'Outfit', system-ui, sans-serif",
              fontSize: "1.75rem",
              fontWeight: 600,
              margin: "8px 0",
            }}
          >
            Something went wrong
          </h1>
          <p style={{ fontSize: "0.95rem", color: "#4b5563", margin: "0 0 24px" }}>
            The site hit an unexpected error. Please try reloading the page.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px 24px",
              fontFamily: "'Outfit', system-ui, sans-serif",
              fontSize: "0.875rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#ffffff",
              backgroundColor: "#6b1d2a",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
