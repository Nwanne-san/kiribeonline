import type {
  ButtonHTMLAttributes,
  ComponentType,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

/**
 * Tailwind-first admin UI primitives (MUI→Tailwind migration, per CLAUDE.md).
 * Shared across the rebuilt admin screens: shell, dashboard, list views.
 * Presentational only — no hooks — so they work in server or client components.
 */

/* ────────────────────────────────────────────────────────────── Pills */

/** Soft (tinted) badge tones — background + foreground pairs. */
export type PillTone =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "purple"
  | "teal"
  | "indigo"
  | "brand"
  | "neutral";

const SOFT_TONE: Record<PillTone, string> = {
  success: "bg-[#ecfdf3] text-[#15803d]",
  warning: "bg-[#fef3c6] text-[#b54708]",
  danger: "bg-[#fee4e2] text-[#b42318]",
  info: "bg-[#eff6ff] text-[#2563eb]",
  purple: "bg-[#f3e8ff] text-[#7c3aed]",
  teal: "bg-[#ccfbf1] text-[#0d766e]",
  indigo: "bg-[#e0e7ff] text-[#4f46e5]",
  // Kiribé burgundy on a soft cream tint — reserved for editorial-workflow
  // states (`in_review`) so they read as brand-owned, not generic status.
  brand: "bg-[#fdf3ef] text-[#6b1d2a]",
  neutral: "bg-[#f3f4f6] text-[#4b5563]",
};

/**
 * A soft, pill-shaped status/action badge (e.g. "Published", "Saved draft").
 * Tone drives the tint; text stays readable in both.
 */
export function Pill({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: PillTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-none px-2 py-0.5 text-[0.6875rem] font-semibold leading-tight ${SOFT_TONE[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * A solid, filled category badge — brand-colored fill with white text, matching
 * the Figma category chips (Film / TV / Opinion …). Pass the category's accent
 * hex (see `category-colors.ts` / `brandColor`).
 */
export function CategoryTag({
  label,
  color = "#4b5563",
  className = "",
}: {
  label: string;
  color?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-none px-2 py-0.5 text-[0.6875rem] font-semibold uppercase leading-tight tracking-wide text-white ${className}`}
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────── Buttons */

export type AdminButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type AdminButtonSize = "sm" | "md";

const BTN_VARIANT: Record<AdminButtonVariant, string> = {
  primary: "bg-[#6b1d2a] text-white hover:bg-[#4a1420] border border-transparent",
  secondary:
    "bg-surface text-ink-secondary border border-border hover:bg-surface-muted hover:text-ink",
  ghost: "bg-transparent text-ink-secondary border border-transparent hover:bg-surface-muted",
  danger: "bg-[#b42318] text-white hover:bg-[#98211a] border border-transparent",
};

/**
 * Padding and type scale mirror the public `MuiButton` theme exactly
 * (8px/20px at `sm`, 10px/24px at `md`, 0.875rem Outfit) so an admin button and
 * the site header Subscribe CTA are the same object in two places.
 */
const BTN_SIZE: Record<AdminButtonSize, string> = {
  sm: "py-2 px-5 text-sm gap-1.5",
  md: "py-2.5 px-6 text-sm gap-2",
};

/**
 * The single admin button. Uppercase, tracked label with an optional leading
 * icon — matches the Figma CTAs ("New Article", "Upload", "Invite User").
 * Use `primary` for the main action, `secondary` for outline buttons.
 */
export function AdminButton({
  variant = "primary",
  size = "md",
  leftIcon,
  children,
  className = "",
  type = "button",
  ...rest
}: {
  variant?: AdminButtonVariant;
  size?: AdminButtonSize;
  leftIcon?: ReactNode;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      // Sharp corners to match the public header Subscribe CTA — buttons are
      // square-edged across the whole product, admin included.
      className={`inline-flex shrink-0 items-center justify-center rounded-none font-semibold uppercase tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${BTN_VARIANT[variant]} ${BTN_SIZE[size]} ${className}`}
      {...rest}
    >
      {leftIcon}
      {children}
    </button>
  );
}

/* ──────────────────────────────────────────────────────────── Panels */

/**
 * A bordered white content card. When `title` is set, renders the burgundy
 * kicker + gold rule header, with an optional right-aligned action link.
 */
export function AdminPanel({
  title,
  action,
  children,
  bodyClassName = "",
  className = "",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  bodyClassName?: string;
  className?: string;
}) {
  return (
    <section
      className={`rounded-none border border-border bg-surface shadow-card ${className}`}
    >
      {title ? (
        <header className="flex items-center justify-between gap-3 border-b border-border-soft px-5 py-4">
          <h2 className="relative pb-1 font-headline text-[0.8125rem] font-bold uppercase tracking-[0.12em] text-burgundy after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-8 after:bg-mustard after:content-['']">
            {title}
          </h2>
          {action}
        </header>
      ) : null}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────── Stat tile */

export type StatAccent = PillTone;

const STAT_ACCENT: Record<StatAccent, { bar: string; icon: string; value: string }> = {
  success: { bar: "bg-[#15803d]", icon: "bg-[#ecfdf3] text-[#15803d]", value: "text-[#15803d]" },
  warning: { bar: "bg-[#b54708]", icon: "bg-[#fef3c6] text-[#b54708]", value: "text-[#b54708]" },
  danger: { bar: "bg-[#b42318]", icon: "bg-[#fee4e2] text-[#b42318]", value: "text-[#b42318]" },
  info: { bar: "bg-[#2563eb]", icon: "bg-[#eff6ff] text-[#2563eb]", value: "text-[#2563eb]" },
  purple: { bar: "bg-[#7c3aed]", icon: "bg-[#f3e8ff] text-[#7c3aed]", value: "text-[#7c3aed]" },
  teal: { bar: "bg-[#0d766e]", icon: "bg-[#ccfbf1] text-[#0d766e]", value: "text-[#0d766e]" },
  indigo: { bar: "bg-[#4f46e5]", icon: "bg-[#e0e7ff] text-[#4f46e5]", value: "text-[#4f46e5]" },
  // Kiribé burgundy — pairs with the `brand` Pill tone for editorial-workflow states.
  brand: { bar: "bg-[#6b1d2a]", icon: "bg-[#fdf3ef] text-[#6b1d2a]", value: "text-[#6b1d2a]" },
  neutral: { bar: "bg-[#4b5563]", icon: "bg-[#f3f4f6] text-[#4b5563]", value: "text-[#374151]" },
};

/**
 * A dashboard KPI tile: colored top accent, tinted icon chip, large value, an
 * uppercase label and an optional sub-metric line. `Icon` is any MUI/SVG icon
 * component. Renders as a link when `href` is provided.
 */
export function StatTile({
  label,
  value,
  sub,
  accent = "neutral",
  Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: StatAccent;
  Icon: ComponentType<{ fontSize?: "small" | "inherit" | "medium" | "large"; className?: string }>;
}) {
  const a = STAT_ACCENT[accent];
  return (
    <div className="relative overflow-hidden rounded-none border border-border bg-surface p-4 shadow-card">
      <span className={`absolute inset-x-0 top-0 h-1 ${a.bar}`} aria-hidden />
      <span
        className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-none ${a.icon}`}
        aria-hidden
      >
        <Icon fontSize="small" />
      </span>
      <div className={`font-headline text-[1.75rem] font-bold leading-none ${a.value}`}>
        {value}
      </div>
      <div className="mt-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted">
        {label}
      </div>
      {sub ? <div className="mt-1 text-xs text-muted-soft">{sub}</div> : null}
    </div>
  );
}

/* ───────────────────────────────────────────────────── Small helpers */

/** A compact avatar disc with a single initial (activity feed, top bar). */
export function InitialAvatar({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  const initial = name?.trim()?.charAt(0)?.toUpperCase() || "?";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-burgundy text-xs font-semibold text-white ${className}`}
    >
      {initial}
    </span>
  );
}

/** Compact number formatter for KPI tiles: 84200 → "84.2K". */
export function formatCompact(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) {
    const k = n / 1000;
    return `${k % 1 === 0 ? k : k.toFixed(1)}K`;
  }
  const m = n / 1_000_000;
  return `${m % 1 === 0 ? m : m.toFixed(1)}M`;
}

/* ────────────────────────────────────────────────── Page + form primitives */

/**
 * Standard admin page header — burgundy title with the mustard underline bar
 * (matches the SubscribersPage / RecentActivityPage / ArticlesListPage shape).
 * Use as the first child of a page's root `<div className="space-y-5">`.
 */
export function AdminPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="relative inline-block pb-2 font-headline text-2xl font-bold text-burgundy after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-12 after:bg-mustard after:content-['']">
          {title}
        </h1>
        {subtitle ? <p className="mt-2 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}

/**
 * A labeled form-field wrapper. Renders a small uppercase label, the input
 * `children`, an optional hint below, and (when present) a red error message
 * that supersedes the hint.
 */
export function AdminField({
  label,
  htmlFor,
  hint,
  error,
  required = false,
  children,
  className = "",
}: {
  label: string;
  htmlFor?: string;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label
        htmlFor={htmlFor}
        className="block text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted"
      >
        {label}
        {required ? <span className="ml-1 text-[#b42318]">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-[#b42318]">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-soft">{hint}</p>
      ) : null}
    </div>
  );
}

// Square edges to match the buttons and the public form controls.
const CONTROL_BASE =
  "w-full rounded-none border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted-soft focus:border-burgundy focus:outline-none focus:ring-2 focus:ring-burgundy/20 disabled:cursor-not-allowed disabled:opacity-60";
const CONTROL_ERROR = "border-[#b42318] focus:border-[#b42318] focus:ring-[#b42318]/20";

/** Standard admin text input. Add `invalid` to switch to the error border. */
export function AdminInput({
  invalid = false,
  className = "",
  ...rest
}: {
  invalid?: boolean;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`${CONTROL_BASE} ${invalid ? CONTROL_ERROR : ""} ${className}`}
      {...rest}
    />
  );
}

/** Standard admin textarea. */
export function AdminTextarea({
  invalid = false,
  className = "",
  rows = 4,
  ...rest
}: {
  invalid?: boolean;
} & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={rows}
      className={`${CONTROL_BASE} min-h-[80px] leading-relaxed ${invalid ? CONTROL_ERROR : ""} ${className}`}
      {...rest}
    />
  );
}

export {
  AdminSearchableSelect,
  type AdminSearchableOption,
  type AdminSearchableSelectProps,
} from "./AdminSearchableSelect";

/**
 * A checkbox row with an inline label — the compact form control pattern used
 * on sidebar toggles ("Featured", "Published", "Consent").
 */
export function AdminCheckboxRow({
  label,
  hint,
  ...rest
}: {
  label: string;
  hint?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-none border border-border bg-surface px-3 py-2.5 hover:bg-surface-muted">
      <input
        type="checkbox"
        className="mt-0.5 h-4 w-4 shrink-0 rounded-none border-border text-burgundy focus:ring-2 focus:ring-burgundy/20"
        {...rest}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-ink">{label}</span>
        {hint ? <span className="mt-0.5 block text-xs text-muted-soft">{hint}</span> : null}
      </span>
    </label>
  );
}
