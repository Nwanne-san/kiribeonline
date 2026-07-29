/**
 * Stub pages domain — UI ships ahead of a Payload `pages` collection.
 * GET returns an empty list; writes are not persisted yet.
 */
export function listStubPages() {
  return { docs: [] as Array<{ id: string; title: string; slug: string; status: string }>, totalDocs: 0 };
}
