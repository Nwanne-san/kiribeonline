"use client";

import Button, { type ButtonProps } from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";

type KiribeButtonProps = ButtonProps & {
  /** Gold subscribe-style CTA */
  accent?: boolean;
  loading?: boolean;
  loadingIndicator?: React.ReactNode;
};

/** Primary and accent buttons — wraps MUI Button with Kiribe defaults. */
export function KiribeButton({
  accent,
  variant,
  color,
  children,
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
      sx={sx}
      {...props}
    >
      {loading ? loader : children}
    </Button>
  );
}
