import type { Access } from "payload";

/** Single-admin v1: any authenticated CMS user may perform the action. */
export const authenticated: Access = ({ req: { user } }) => Boolean(user);

/** Public read for published-facing collections. */
export const anyone: Access = () => true;

/** Admin-only writes; public cannot create/update/delete. */
export const adminOnly: Access = ({ req: { user } }) => Boolean(user);
