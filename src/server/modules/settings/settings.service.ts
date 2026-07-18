import { getPayloadClient } from "@/lib/payload/get-payload";

export async function getSiteSettings() {
  const payload = await getPayloadClient();
  return payload.findGlobal({ slug: "site-settings", depth: 2, overrideAccess: true });
}

/** The route maps the validated patch to Payload field names before calling this. */
export async function updateSiteSettings(data: Record<string, unknown>) {
  const payload = await getPayloadClient();
  return payload.updateGlobal({ slug: "site-settings", data, overrideAccess: true });
}
