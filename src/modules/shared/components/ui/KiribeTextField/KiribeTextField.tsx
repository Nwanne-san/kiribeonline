"use client";

import SearchIcon from "@mui/icons-material/Search";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import {
  CircularProgress,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  TextField as MuiTextField,
  type TextFieldProps as MuiTextFieldProps,
} from "@mui/material";
import { type ChangeEvent, type ReactNode, forwardRef, useState } from "react";
import { Controller, type Control, type RegisterOptions } from "react-hook-form";

export type KiribeTextFieldProps = MuiTextFieldProps & {
  errorText?: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  isSearch?: boolean;
  labelOnTop?: boolean;
  isLoading?: boolean;
  isRounded?: boolean;
  control?: Control;
  name?: string;
  rules?: RegisterOptions;
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    // Square by default, matching the buttons and the rest of the form
    // controls. The `isRounded` pill variant (header search) is a deliberate
    // exception and still overrides this below.
    borderRadius: 0,
    "&.Mui-focused fieldset": {
      borderColor: "primary.main",
      borderWidth: 2,
    },
  },
};

function KiribeTextFieldInner(
  {
    errorText,
    startIcon,
    endIcon,
    isSearch,
    labelOnTop,
    isLoading,
    isRounded,
    type,
    helperText,
    error,
    InputProps,
    sx,
    ...props
  }: KiribeTextFieldProps,
  ref: React.Ref<HTMLInputElement>
) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const resolvedType = isPassword && showPassword ? "text" : type;

  const startAdornment = isSearch
    ? (
        <InputAdornment position="start">
          <SearchIcon fontSize="small" color="action" />
        </InputAdornment>
      )
    : startIcon
      ? (
          <InputAdornment position="start">{startIcon}</InputAdornment>
        )
      : InputProps?.startAdornment;

  const endAdornment = isLoading
    ? (
        <InputAdornment position="end">
          <CircularProgress size={18} />
        </InputAdornment>
      )
    : isPassword
      ? (
          <InputAdornment position="end">
            <IconButton
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((v) => !v)}
              edge="end"
              size="small"
            >
              {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
            </IconButton>
          </InputAdornment>
        )
      : endIcon
        ? (
            <InputAdornment position="end">{endIcon}</InputAdornment>
          )
        : InputProps?.endAdornment;

  const hasError = Boolean(error || errorText);

  return (
    <FormControl fullWidth={props.fullWidth} error={hasError}>
      <MuiTextField
        {...props}
        inputRef={ref}
        type={resolvedType}
        error={hasError}
        helperText={undefined}
        variant={props.variant ?? "outlined"}
        size={props.size ?? "medium"}
        InputProps={{
          ...InputProps,
          startAdornment,
          endAdornment,
        }}
        sx={{
          ...fieldSx,
          ...(isRounded ? { "& .MuiOutlinedInput-root": { borderRadius: 999 } } : {}),
          ...(labelOnTop ? { "& .MuiInputLabel-root": { position: "relative", transform: "none", mb: 0.5 } } : {}),
          ...sx,
        }}
      />
      {(errorText || helperText) && (
        <FormHelperText>{errorText || helperText}</FormHelperText>
      )}
    </FormControl>
  );
}

export const KiribeTextField = forwardRef(KiribeTextFieldInner);

export function KiribeTextFieldWithControl({
  control,
  name,
  rules,
  onChange,
  ...props
}: KiribeTextFieldProps & { control: Control; name: string }) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <KiribeTextField
          {...props}
          {...field}
          name={name}
          errorText={fieldState.error?.message}
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            field.onChange(e);
            onChange?.(e);
          }}
        />
      )}
    />
  );
}
