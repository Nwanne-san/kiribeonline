import type { CollectionAfterChangeHook } from "payload";
import { getPayloadClient } from "@/lib/payload/get-payload";

async function bumpMediaUsage(payload: Awaited<ReturnType<typeof getPayloadClient>>, mediaId: string | number) {
  try {
    const media = await payload.findByID({
      collection: "media",
      id: mediaId,
      overrideAccess: true,
    });
    const current = typeof media.usageCount === "number" ? media.usageCount : 0;
    await payload.update({
      collection: "media",
      id: mediaId,
      data: { usageCount: current + 1 },
      overrideAccess: true,
    });
  } catch {
    // Media may have been deleted
  }
}

export const mediaUsageAfterChange: CollectionAfterChangeHook = async ({ doc, req, context }) => {
  if (context?.skipHooks) return;
  const hero = doc.heroImage;
  if (hero && typeof hero === "object" && hero.id) {
    await bumpMediaUsage(req.payload, hero.id);
  } else if (typeof hero === "string" || typeof hero === "number") {
    await bumpMediaUsage(req.payload, hero);
  }
};
