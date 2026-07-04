"use client";

import { type Control, type FieldValues } from "react-hook-form";
import {
  KiribeTextFieldWithControl,
  type KiribeTextFieldProps,
} from "@/modules/shared/components/ui/KiribeTextField";

export type FormTextFieldProps<T extends FieldValues = FieldValues> = Omit<
  KiribeTextFieldProps,
  "control" | "name"
> & {
  name: string;
  control: Control<T>;
};

export function FormTextField<T extends FieldValues = FieldValues>({
  control,
  name,
  ...props
}: FormTextFieldProps<T>) {
  return (
    <KiribeTextFieldWithControl
      control={control as Control}
      name={name}
      {...props}
    />
  );
}
