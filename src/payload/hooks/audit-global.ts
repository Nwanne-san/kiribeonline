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

    if (globalSlug === "homepage") {
      revalidateTag("homepage");
    }
    if (globalSlug === "site-settings") {
      revalidateTag("site-settings");
    }
  };
}
