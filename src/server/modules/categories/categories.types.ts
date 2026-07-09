import type { AdminTermRef } from "@/server/shared/types";

export type AdminCategory = AdminTermRef & {
  description?: string;
  displayOrder: number;
  updatedAt: string;
};
