import type { ReactNode } from "react";
import Link from "next/link";
import { PublicRoutes } from "@/routes/public.routes";
import { BrandMark } from "@/modules/shared/components/brand";

/**
 * Shared full-viewport shell for every unauthenticated admin surface (login,
 * accept-invite, forgot-password, reset-password).
 *
 * Dark #1C1214 backdrop with a faint gold pinstripe — same treatment as the
 * public archive hero and the FIGMA-ADMIN-PROMPT.md Screen 1 spec. On mobile the
 * card fills the viewport (no card chrome, no wasted margins). On tablet and up
 * it centers as a 400px card.
 *
 * Kept deliberately dumb: this only lays out the chrome. Each page owns its own
 * form, error state, and copy.
 */
export function AdminAuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div
      className="flex min-h-[100dvh] flex-col items-center bg-[#1C1214] px-4 py-8 sm:justify-center sm:py-12"
      style={{
        /* Faint gold pinstripe — pure decoration, no accessibility impact. */
        backgroundImage:
          "repeating-linear-gradient(90deg, rgba(201,162,39,0.08) 0, rgba(201,162,39,0.08) 1px, transparent 1px, transparent 24px)",
      }}
    >
      <Link
        href={PublicRoutes.home}
        aria-label="Kiribé home"
        className="mb-8 inline-flex items-center text-white sm:mb-10"
      >
        <BrandMark height={36} tone="light" />
      </Link>

      <div className="w-full max-w-[420px] rounded-none bg-white p-6 shadow-elevated sm:p-8">
        <h1 className="font-headline text-2xl font-semibold leading-tight text-ink">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm leading-6 text-ink-secondary">{subtitle}</p>
        )}
        <div className="mt-6">{children}</div>
      </div>

      {footer && (
        <div className="mt-6 w-full max-w-[420px] text-center text-xs text-white/70">
          {footer}
        </div>
      )}
    </div>
  );
}
