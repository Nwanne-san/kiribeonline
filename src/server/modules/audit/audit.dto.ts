import { z } from "zod";

/**
 * Query params accepted by `GET /api/admin/audit`. Everything is optional; an
 * empty query returns the newest page. Dates are ISO 8601 (the datetime picker
 * on the client produces these directly).
 */
export const auditListQuerySchema = z.object({
  q: z.string().trim().min(1).max(120).optional(),
  action: z.string().trim().min(1).max(64).optional(),
  targetType: z.string().trim().min(1).max(64).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type AuditListQuery = z.output<typeof auditListQuerySchema>;
