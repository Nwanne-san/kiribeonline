"use client";

import Button, { type ButtonProps } from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { cn } from "@/modules/shared/components/tw";

type KiribeButtonProps = ButtonProps & {
  /** Gold subscribe-style CTA */
  accent?: boolean;
  loading?: boolean;
  loadingIndicator?: React.ReactNode;
};

/**
 * Primary and accent buttons — wraps MUI Button with Kiribe defaults.
 * Prefer `className` for visual overrides; `sx` kept for migration back-compat.
 */
export function KiribeButton({
  accent,
  variant,
  color,
  children,
  className,
  sx,
  loading = false,
  loadingIndicator,
  disabled,
  ...props
}: KiribeButtonProps) {
  const isDisabled = disabled || loading;

  const loader = loadingIndicator ?? (
    <CircularProgress size={18} color="inherit" />
  );

  if (accent) {
    return (
      <Button
        variant="contained"
        color="secondary"
        disabled={isDisabled}
        className={cn(className)}
        sx={sx}
        {...props}
      >
        {loading ? loader : children}
      </Button>
    );
  }

  return (
    <Button
      variant={variant ?? "contained"}
      color={color ?? "primary"}
      disabled={isDisabled}
      className={cn(className)}
      sx={sx}
      {...props}
    >
      {loading ? loader : children}
    </Button>
  );
}
