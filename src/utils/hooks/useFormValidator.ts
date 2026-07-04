"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  type FieldValues,
  type Resolver,
  type UseFormProps,
  useForm,
} from "react-hook-form";
import type { ZodTypeAny } from "zod";

export interface UseFormValidatorProps<T extends FieldValues>
  extends UseFormProps<T> {
  validationSchema?: ZodTypeAny;
}

export function useFormValidator<T extends FieldValues>({
  validationSchema,
  ...props
}: UseFormValidatorProps<T>) {
  const resolver = validationSchema
    ? (zodResolver(validationSchema) as Resolver<T>)
    : undefined;

  return useForm<T>({
    ...props,
    resolver,
    reValidateMode: props.reValidateMode ?? "onChange",
  });
}
