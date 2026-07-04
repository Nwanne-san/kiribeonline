import configPromise from "@payload-config";
import { getPayload } from "payload";

/**
 * Cached Payload instance for Server Components, route handlers, and cron jobs.
 * Always import this in server code — never instantiate Payload ad hoc.
 */
export async function getPayloadClient() {
  return getPayload({ config: configPromise });
}
