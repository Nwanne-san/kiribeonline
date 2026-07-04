import type { ZodTypeAny, z } from "zod";
import { apiError } from "./response";

export function parseBody<S extends ZodTypeAny>(schema: S, body: unknown): z.output<S> {
  const result = schema.safeParse(body);

  if (!result.success) {
    const errors: Record<string, string[]> = {};
    result.error.issues.forEach((issue) => {
      const key = issue.path.join(".") || "form";
      if (!errors[key]) errors[key] = [];
      errors[key].push(issue.message);
    });

    throw new ValidationError("Validation failed", errors);
  }

  return result.data;
}

export class ValidationError extends Error {
  errors: Record<string, string[]>;

  constructor(message: string, errors: Record<string, string[]>) {
    super(message);
    this.name = "ValidationError";
    this.errors = errors;
  }
}

export function handleRouteError(error: unknown) {
  if (error instanceof ValidationError) {
    return apiError(error.message, 400, error.errors);
  }

  console.error("[api]", error);
  return apiError("Internal server error", 500);
}
