import { z } from "zod";

export const subscriberListQuerySchema = z.object({
  q: z.string().trim().min(1).max(120).optional(),
  status: z.enum(["all", "confirmed", "pending"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  /** ISO 8601 date string — filter to subscribers created on or after this date */
  subscribedFrom: z.string().datetime({ offset: true }).optional().or(
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
  ),
  /** ISO 8601 date string — filter to subscribers created on or before this date */
  subscribedTo: z.string().datetime({ offset: true }).optional().or(
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
  ),
});

export type SubscriberListQuery = z.output<typeof subscriberListQuerySchema>;
