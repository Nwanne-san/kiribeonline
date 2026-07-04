"use client";

import { type Control, type FieldValues } from "react-hook-form";
import {
  KiribeTextAreaWithControl,
  type KiribeTextAreaProps,
} from "@/modules/shared/components/ui/KiribeTextArea";

export type FormTextAreaProps<T extends FieldValues = FieldValues> = Omit<
  KiribeTextAreaProps,
  "control" | "name"
> & {
  name: string;
  control: Control<T>;
};

export function FormTextArea<T extends FieldValues = FieldValues>({
  control,
  name,
  ...props
}: FormTextAreaProps<T>) {
  return (
    <KiribeTextAreaWithControl
      control={control as Control}
      name={name}
      {...props}
    />
  );
}
