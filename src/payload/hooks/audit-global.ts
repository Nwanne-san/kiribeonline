import type { GlobalAfterChangeHook } from "payload";
import { revalidateTag } from "next/cache";
import { writeAuditLog } from "@/lib/audit";

export function auditGlobalAfterChange(globalSlug: string): GlobalAfterChangeHook {
  return async ({ req, previousDoc }) => {
    await writeAuditLog(req.payload, {
      action: `${globalSlug}.updated`,
      actorEmail: req.user?.email,
      targetType: globalSlug,
      targetId: globalSlug,
      metadata: { previousId: previousDoc?.id },
    });

    // Never let cache invalidation break the write — revalidateTag throws
    // outside a Next request context (scripts, seed, cron via local API).
    try {
      if (globalSlug === "homepage") {
        revalidateTag("homepage");
      }
      if (globalSlug === "site-settings") {
        revalidateTag("site-settings");
      }
    } catch (error) {
      console.warn("[audit-global] revalidateTag failed", error);
    }
  };
}
