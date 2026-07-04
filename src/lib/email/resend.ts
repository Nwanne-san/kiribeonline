import { Resend } from "resend";

let cached: Resend | null = null;

/** Returns the Resend client, or null when no API key is configured (dev fallback). */
export function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!cached) cached = new Resend(process.env.RESEND_API_KEY);
  return cached;
}

export const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "Kiribé <hello@kiribeonline.com>";

export const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
).replace(/\/$/, "");
