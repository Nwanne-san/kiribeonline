import type { AdminTermRef } from "@/server/shared/types";

export type AdminCategory = AdminTermRef & {
  description?: string;
  brandColor?: string;
  displayOrder: number;
  showInNav?: boolean;
  isSystem?: boolean;
  /** Number of articles referencing this category. */
  articleCount: number;
  updatedAt: string;
};
