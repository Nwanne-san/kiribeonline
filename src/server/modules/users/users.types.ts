import type { UserRole, UserStatus } from "@/server/access/roles";

export type AdminUserListItem = {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  articleCount: number;
  createdAt: string;
  updatedAt: string;
};
