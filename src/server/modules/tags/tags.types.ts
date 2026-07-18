import type { AdminTermRef } from "@/server/shared/types";

export type AdminTag = AdminTermRef & {
  brandColor?: string;
  isSystem?: boolean;
  /** Number of articles referencing this tag. */
  articleCount: number;
  updatedAt: string;
};
