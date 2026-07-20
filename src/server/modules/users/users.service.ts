import { randomUUID } from "node:crypto";
import type { Where } from "payload";
import { getPayloadClient } from "@/lib/payload/get-payload";
import { resolveRole } from "@/server/access/roles";
import { writeAuditLog } from "@/lib/audit";
import { sendAdminInviteEmail } from "./invite-email";
import type { UserInviteInput, UserUpdateInput } from "./users.dto";
import type { AdminUserListItem } from "./users.types";
import {
  INVITE_TOKEN_TTL_MS,
  generateInviteToken,
  hashInviteToken,
} from "./invite-token";

type UserDoc = {
  id: string | number;
  email: string;
  name?: string | null;
  role?: string | null;
  status?: string | null;
  avatar?: { url?: string } | string | null;
  createdAt?: string;
  updatedAt?: string;
};

async function countArticlesByAuthor(authorId: string | number): Promise<number> {
  const payload = await getPayloadClient();
  const result = await payload.count({
    collection: "articles",
    where: { author: { equals: authorId } },
    overrideAccess: true,
  });
  return result.totalDocs;
}

function toListItem(doc: UserDoc, articleCount: number): AdminUserListItem {
  const avatar =
    doc.avatar && typeof doc.avatar === "object" ? doc.avatar.url : undefined;
  return {
    id: String(doc.id),
    email: doc.email,
    name: doc.name ?? null,
    role: resolveRole(doc),
    status: (doc.status as AdminUserListItem["status"]) ?? "active",
    avatarUrl: avatar,
    articleCount,
    createdAt: doc.createdAt ?? "",
    updatedAt: doc.updatedAt ?? "",
  };
}

export type ListAdminUsersParams = {
  role?: string;
  status?: string;
  q?: string;
  page?: number;
  limit?: number;
};

export async function listAdminUsers(params: ListAdminUsersParams = {}) {
  const payload = await getPayloadClient();

  const conditions: Where[] = [];
  if (params.role) conditions.push({ role: { equals: params.role } });
  if (params.status) conditions.push({ status: { equals: params.status } });
  if (params.q) {
    const q = params.q.trim();
    conditions.push({ or: [{ name: { like: q } }, { email: { like: q } }] });
  }
  const where: Where | undefined = conditions.length ? { and: conditions } : undefined;

  const result = await payload.find({
    collection: "users",
    where,
    page: params.page ?? 1,
    limit: params.limit ?? 50,
    sort: "-createdAt",
    depth: 1,
    overrideAccess: true,
  });

  const docs = await Promise.all(
    (result.docs as UserDoc[]).map(async (doc) =>
      toListItem(doc, await countArticlesByAuthor(doc.id))
    )
  );

  return { ...result, docs };
}

export async function getAdminUser(id: string) {
  const payload = await getPayloadClient();
  const doc = (await payload.findByID({
    collection: "users",
    id,
    depth: 1,
    overrideAccess: true,
  })) as UserDoc;
  return toListItem(doc, await countArticlesByAuthor(doc.id));
}

export async function updateAdminUser(id: string, input: UserUpdateInput) {
  const payload = await getPayloadClient();
  const data: Record<string, unknown> = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.role !== undefined) data.role = input.role;
  if (input.status !== undefined) data.status = input.status;
  // Suspension revokes any outstanding invite — a pending user's still-valid
  // link must not be able to re-activate the account later.
  if (input.status === "suspended") {
    data.inviteTokenHash = null;
    data.inviteTokenExpiresAt = null;
  }

  const doc = (await payload.update({
    collection: "users",
    id,
    data,
    overrideAccess: true,
  })) as UserDoc;
  return toListItem(doc, await countArticlesByAuthor(doc.id));
}

/**
 * Create a pending team member and issue a single-use invite token.
 *
 * The account gets a random, unusable password and `status: "pending"`, so it
 * cannot be logged into until `acceptInvite` sets a real password AND flips the
 * status to `active`. Only the SHA-256 hash of the token is stored; the raw
 * token is returned once for the caller to email and is never persisted.
 */
export async function inviteAdminUser(
  input: UserInviteInput,
  invitedBy?: { name?: string; email?: string },
) {
  const invitedByName = invitedBy?.name;
  const payload = await getPayloadClient();
  const { raw, hash } = generateInviteToken();
  const expiresAt = new Date(Date.now() + INVITE_TOKEN_TTL_MS).toISOString();

  const doc = (await payload.create({
    collection: "users",
    data: {
      email: input.email,
      name: input.name,
      role: input.role,
      status: "pending",
      password: randomUUID() + randomUUID(),
      inviteTokenHash: hash,
      inviteTokenExpiresAt: expiresAt,
    } as never,
    overrideAccess: true,
  })) as UserDoc;

  // Deliver the invite link. Falls back to returning the raw token to the
  // inviting admin when email isn't configured (dev). AUTH-HARDENING §5.
  const emailSent = await sendAdminInviteEmail({
    email: input.email,
    token: raw,
    role: input.role,
    invitedByName,
  });

  await writeAuditLog(payload, {
    action: "users.invited",
    // Audit rows must stay queryable by actor email — the display name goes to
    // the invite email only. Review finding N1.
    actorEmail: invitedBy?.email ?? invitedByName,
    targetType: "users",
    targetId: String(doc.id),
    metadata: { role: input.role, emailSent },
  });

  return {
    user: toListItem(doc, 0),
    // Only hand the raw token back when we couldn't email it — avoids exposing
    // a live credential in the API response when delivery succeeded.
    inviteToken: emailSent ? undefined : raw,
    inviteExpiresAt: expiresAt,
    emailSent,
  };
}

/**
 * Accept an invite: verify the token + expiry, set the chosen password, activate
 * the account, and clear the one-time token. Returns null when the token is
 * unknown or expired (caller returns a generic error — no user enumeration).
 */
export async function acceptInvite(token: string, password: string) {
  const payload = await getPayloadClient();
  const hash = hashInviteToken(token);

  const match = await payload.find({
    collection: "users",
    where: { inviteTokenHash: { equals: hash } },
    limit: 1,
    overrideAccess: true,
  });

  const user = match.docs[0] as (UserDoc & { inviteTokenExpiresAt?: string }) | undefined;
  if (!user) return null;

  const expiresAt = user.inviteTokenExpiresAt ? Date.parse(user.inviteTokenExpiresAt) : 0;
  if (!expiresAt || expiresAt < Date.now()) return null;

  // A still-valid invite link must not re-activate an account an admin has
  // since suspended (or already activated) — only pending accounts can accept.
  if (user.status !== "pending") return null;

  await payload.update({
    collection: "users",
    id: user.id,
    data: {
      password,
      status: "active",
      inviteTokenHash: null,
      inviteTokenExpiresAt: null,
    } as never,
    overrideAccess: true,
  });

  // Setting a new password rotates Payload's salt/hash, invalidating any token
  // previously issued for this account (forced logout). AUTH-HARDENING §6.
  await writeAuditLog(payload, {
    action: "auth.invite_accepted",
    actorEmail: user.email,
    targetType: "users",
    targetId: String(user.id),
  });

  return { id: String(user.id), email: user.email };
}

export async function deleteAdminUser(id: string) {
  const payload = await getPayloadClient();
  await payload.delete({ collection: "users", id, overrideAccess: true });
  return { deleted: true };
}

/**
 * Slim author-picker payload for the article editor: id + display name only,
 * active users, no emails or roles. The full user list is still gated by
 * `users:manage` (see /api/admin/users); this list is reachable to publish
 * holders too so an editor can file for someone else without granting them
 * team-admin visibility. Suspended and pending users are excluded — you can't
 * assign a byline to an inactive account.
 */
export async function listAuthorPickerCandidates(): Promise<
  Array<{ id: string; name: string }>
> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "users",
    where: { status: { equals: "active" } },
    limit: 200,
    depth: 0,
    sort: "name",
    overrideAccess: true,
    pagination: false,
  });

  return (result.docs as Array<{ id: string | number; name?: string | null; email: string }>)
    .map((doc) => ({
      id: String(doc.id),
      // Fall back to the email local-part when a user has no display name yet
      // — the picker still needs a label to render, but we never return the
      // full address (prior review flagged the leak).
      name: doc.name?.trim() || doc.email.split("@")[0] || `User ${doc.id}`,
    }))
    .filter((u) => u.name);
}
