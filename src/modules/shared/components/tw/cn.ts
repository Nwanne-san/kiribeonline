import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Conditional Tailwind class merger — same pattern as shadcn/cw-real-estate. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
