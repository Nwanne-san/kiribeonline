import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email address")
  .max(254, "Email is too long");

export const honeypotSchema = z
  .string()
  .max(0, "Invalid submission")
  .default("");

export const shortTextSchema = (field: string, max = 200) =>
  z
    .string()
    .trim()
    .min(1, `${field} is required`)
    .max(max, `${field} must be at most ${max} characters`);

export const optionalShortTextSchema = (max = 200) =>
  z.string().trim().max(max).optional().or(z.literal(""));
