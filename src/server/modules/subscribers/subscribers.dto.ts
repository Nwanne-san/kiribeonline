import { z } from "zod";

export const subscriberListQuerySchema = z.object({
  q: z.string().trim().min(1).max(120).optional(),
  status: z.enum(["all", "confirmed", "pending"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type SubscriberListQuery = z.output<typeof subscriberListQuerySchema>;
