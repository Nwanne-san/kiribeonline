export type AuditLogEntry = {
  id: string;
  action: string;
  actorEmail?: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type AuditLogListResult = {
  docs: AuditLogEntry[];
  page: number;
  limit: number;
  totalDocs: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type ListAuditLogsParams = {
  q?: string;
  action?: string;
  targetType?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};
