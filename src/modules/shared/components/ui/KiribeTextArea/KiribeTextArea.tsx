"use client";

import {
  FormControl,
  FormHelperText,
  TextField,
  type TextFieldProps,
} from "@mui/material";
import { type ChangeEvent, forwardRef } from "react";
import { Controller, type Control, type RegisterOptions } from "react-hook-form";
import { cn } from "@/modules/shared/components/tw";

export type KiribeTextAreaProps = Omit<TextFieldProps, "multiline"> & {
  errorText?: string;
  minRows?: number;
  control?: Control;
  name?: string;
  rules?: RegisterOptions;
};

function KiribeTextAreaInner(
  { errorText, helperText, error, minRows = 4, className, sx, ...props }: KiribeTextAreaProps,
  ref: React.Ref<HTMLDivElement>
) {
  const hasError = Boolean(error || errorText);

  return (
    <FormControl fullWidth={props.fullWidth} error={hasError}>
      <TextField
        {...props}
        ref={ref}
        multiline
        minRows={minRows}
        error={hasError}
        helperText={undefined}
        variant={props.variant ?? "outlined"}
        className={cn("kiribe-field", className)}
        sx={sx}
      />
      {(errorText || helperText) && (
        <FormHelperText>{errorText || helperText}</FormHelperText>
      )}
    </FormControl>
  );
}

export const KiribeTextArea = forwardRef(KiribeTextAreaInner);

export function KiribeTextAreaWithControl({
  control,
  name,
  rules,
  onChange,
  ...props
}: KiribeTextAreaProps & { control: Control; name: string }) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState }) => (
        <KiribeTextArea
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
