"use client";

import { useMemo } from "react";
import { adminMeService, adminQueryKeys } from "@/services/admin.service";
import type { Capability, UserRole, UserStatus } from "@/server/access/roles";
import { useQueryService } from "@/utils/hooks/useQueryService";

const STALE_TIME_MS = 5 * 60 * 1000; // 5 minutes — role rarely changes mid-session.

export type AdminMe = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  status: UserStatus;
  capabilities: Capability[];
};

/** Pure check — true when the capability list grants `capability`. */
export function hasCapability(
  capabilities: Capability[] | undefined,
  capability: Capability
): boolean {
  return Boolean(capabilities?.includes(capability));
}

/**
 * Fetch the current admin's identity + resolved capabilities from `/api/admin/me`
 * and expose a `can(capability)` gate. Mirrors BrandDrive's permissions hook:
 * the server is the source of truth, the client caches it and gates UI off it.
 * Server-side checks remain authoritative for every mutation.
 */
export function usePermissions() {
  const query = useQueryService<Record<string, never>, AdminMe>({
    service: adminMeService.get,
    options: { keys: [adminQueryKeys.me], staleTime: STALE_TIME_MS },
  });

  const me = query.data;

  const can = useMemo(() => {
    const caps = me?.capabilities;
    return (capability: Capability) => hasCapability(caps, capability);
  }, [me?.capabilities]);

  return {
    me,
    role: me?.role,
    capabilities: me?.capabilities ?? [],
    can,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
