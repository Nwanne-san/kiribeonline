import type { AdminTermRef } from "@/server/shared/types";

export type AdminTag = AdminTermRef & {
  updatedAt: string;
};
