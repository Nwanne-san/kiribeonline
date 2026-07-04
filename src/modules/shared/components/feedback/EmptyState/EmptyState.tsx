import * as React from "react";
import { cn } from "@/modules/shared/components/tw/cn";
import { Button } from "@/modules/shared/components/tw/Button";

/** An action either navigates (href) or runs a handler (onClick). */
export type EmptyStateAction =
  | { label: string; href: string; onClick?: never }
  | { label: string; onClick: () => void; href?: never };

export type EmptyStateProps = {
  /** Branded line-art illustration rendered above the copy. */
  illustration?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  /** Primary call to action. */
  action?: EmptyStateAction;
  /** Optional secondary call to action (rendered as an outline button). */
  secondaryAction?: EmptyStateAction;
  /**
   * `default` — generous public spacing.
   * `compact` — denser padding + smaller illustration for admin surfaces.
   */
  size?: "default" | "compact";
  className?: string;
};

const CONTAINER: Record<NonNullable<EmptyStateProps["size"]>, string> = {
  default: "py-12 md:py-16 gap-4",
  compact: "py-8 gap-3",
};

const ILLUSTRATION_WIDTH: Record<NonNullable<EmptyStateProps["size"]>, string> = {
  default: "w-full max-w-[240px]",
  compact: "w-full max-w-[150px]",
};

const TITLE: Record<NonNullable<EmptyStateProps["size"]>, string> = {
  default: "text-xl md:text-2xl",
  compact: "text-base md:text-lg",
};

function ActionButton({
  action,
  variant,
}: {
  action: EmptyStateAction;
  variant: "primary" | "outline";
}) {
  if (action.href) {
    return (
      <Button href={action.href} variant={variant} size="md">
        {action.label}
      </Button>
    );
  }
  return (
    <Button onClick={action.onClick} variant={variant} size="md">
      {action.label}
    </Button>
  );
}

/**
 * The single, Tailwind-first empty/error/idle state for Kiribé.
 *
 * Illustrations are decorative (`aria-hidden`); the heading + description carry
 * the accessible meaning of the state.
 */
export function EmptyState({
  illustration,
  title,
  description,
  action,
  secondaryAction,
  size = "default",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        CONTAINER[size],
        className
      )}
    >
      {illustration && (
        <div className={cn("mx-auto", ILLUSTRATION_WIDTH[size])} aria-hidden="true">
          {illustration}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h2
          className={cn(
            "font-headline font-semibold text-ink",
            TITLE[size]
          )}
        >
          {title}
        </h2>
        {description && (
          <p className="mx-auto max-w-md font-body text-sm text-muted md:text-base">
            {description}
          </p>
        )}
      </div>

      {(action || secondaryAction) && (
        <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
          {action && <ActionButton action={action} variant="primary" />}
          {secondaryAction && (
            <ActionButton action={secondaryAction} variant="outline" />
          )}
        </div>
      )}
    </div>
  );
}
