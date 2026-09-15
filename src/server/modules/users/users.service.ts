import { randomUUID } from "node:crypto";
import type { Where } from "payload";
import { ValidationError } from "@/lib/api";
import { getPayloadClient } from "@/lib/payload/get-payload";
import { ROLE_LABELS, USER_ROLES, resolveRole } from "@/server/access/roles";

/**
 * Names that would render as a role on the public byline (`author.name` flows
 * straight to `resolvePublicByline`). If someone's `name` is literally "Admin"
 * or "Writer", every article they publish shows that word instead of a real
 * person's name — the exact bug we saw with an early admin account. Reject
 * both the internal role slugs and the display labels, case-insensitive.
 */
const RESERVED_NAMES = new Set<string>([
  ...USER_ROLES,
  ...Object.values(ROLE_LABELS).map((label) => label.toLowerCase()),
]);
function isReservedName(name: string): boolean {
  return RESERVED_NAMES.has(name.trim().toLowerCase());
}
import { writeAuditLog } from "@/lib/audit";
import { sendAdminInviteEmail } from "./invite-email";
import { sendAdminPasswordChangedEmail } from "./password-changed-email";
import { sendAdminPasswordResetEmail } from "./reset-email";
import type { UserInviteInput, UserUpdateInput } from "./users.dto";
import type { AdminUserListItem } from "./users.types";
import {
  INVITE_TOKEN_TTL_MS,
  generateInviteToken,
  hashInviteToken,
} from "./invite-token";
import {
  RESET_TOKEN_TTL_MS,
  generateResetToken,
  hashResetToken,
} from "./reset-token";

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
  if (input.name !== undefined) {
    const trimmed = input.name.trim();
    if (isReservedName(trimmed)) {
      throw new ValidationError("Name would render as a role on the public byline", {
        name: [
          `“${trimmed}” looks like a role, not a person. Every article this user publishes would show that word as the byline. Use a real name instead.`,
        ],
      });
    }
  }
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

  const normalizedEmail = input.email.trim().toLowerCase();
  const existing = await payload.find({
    collection: "users",
    where: { email: { equals: normalizedEmail } },
    limit: 1,
    overrideAccess: true,
  });

  if (existing.docs.length > 0) {
    throw new ValidationError("User with this email already exists", {
      email: ["A team member with this email address already exists."],
    });
  }

  // Guard against dual accounts under the same person's name (writer + admin
  // for the same human, etc). The email column is the only uniqueness we get
  // for free; a second, case-insensitive check on `name` catches the "invited
  // myself twice" pattern the byline system can't distinguish from two
  // genuine people. Postgres `equals` is case-sensitive and Payload's `like`
  // maps to `ILIKE %v%` (substring), so we pre-filter with `like` and then
  // narrow to an exact case-insensitive match in memory.
  const normalizedName = input.name?.trim();
  if (normalizedName && isReservedName(normalizedName)) {
    throw new ValidationError("Name would render as a role on the public byline", {
      name: [
        `“${normalizedName}” looks like a role, not a person. Every article this user publishes would show that word as the byline. Use a real name (e.g. “Chima Nwoke”) instead.`,
      ],
    });
  }
  if (normalizedName) {
    const nameMatches = await payload.find({
      collection: "users",
      where: { name: { like: normalizedName } },
      limit: 20,
      overrideAccess: true,
    });
    const target = normalizedName.toLowerCase();
    const clash = (nameMatches.docs as UserDoc[]).find(
      (doc) => (doc.name ?? "").trim().toLowerCase() === target,
    );
    if (clash) {
      throw new ValidationError("A team member with this name already exists", {
        name: [
          `A team member named “${normalizedName}” already exists. Use a distinguishing form (middle initial, suffix) or promote the existing account instead of creating a second one.`,
        ],
      });
    }
  }

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
    // Audit rows must stay queryable by actor email; the display name goes to
    // the invite email only. Review finding N1.
    actorEmail: invitedBy?.email ?? invitedByName,
    targetType: "users",
    targetId: String(doc.id),
    metadata: { role: input.role, emailSent },
  });

  return {
    user: toListItem(doc, 0),
    // Always hand the raw token back. Resend accepting a send is not the same
    // as the recipient actually receiving it (bounces, spam filters, an
    // unverified domain), so the inviting admin needs a shareable link as a
    // backup regardless of whether the mail transport reported success. The
    // token is single-use, expires with the invite, and is only reachable to
    // an admin who already holds `users:manage` on this same request.
    inviteToken: raw,
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
      // Payload's JWT strategy verifies `sid` against `user.sessions`
      // (jwt.js:73-79). Clearing the array invalidates every outstanding token
      // for this account — required so an invite that lands after a suspicious
      // signup can't be replayed. AUTH-HARDENING §6.
      sessions: [],
    } as never,
    overrideAccess: true,
  });

  await writeAuditLog(payload, {
    action: "auth.invite_accepted",
    actorEmail: user.email,
    targetType: "users",
    targetId: String(user.id),
  });

  return { id: String(user.id), email: user.email };
}

/**
 * Kick off a password reset. The public route is always generic (200 OK) —
 * this function returns `true` regardless of outcome, but only actually issues
 * a token and sends an email when an `active` account is found. Silence on the
 * miss case is what prevents this from being a user-enumeration oracle.
 *
 * `pending` accounts are excluded on purpose (they set a password via the
 * invite flow, not the reset flow), and `suspended` accounts must not be able
 * to reactivate themselves. AUTH-HARDENING §8.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const payload = await getPayloadClient();
  const normalized = email.trim().toLowerCase();

  const match = await payload.find({
    collection: "users",
    where: { email: { equals: normalized } },
    limit: 1,
    overrideAccess: true,
  });
  const user = match.docs[0] as UserDoc | undefined;

  // Audit the request first, so a "requested but never delivered" pattern is
  // still queryable even if the fire-and-forget path below crashes. Records
  // the *requested* email, not user existence, so a spray campaign shows up
  // as high volume against unknown accounts. AUTH-HARDENING §8b.
  await writeAuditLog(payload, {
    action: "auth.password_reset_requested",
    actorEmail: normalized,
    targetType: user ? "users" : undefined,
    targetId: user ? String(user.id) : undefined,
    metadata: {
      userMatched: Boolean(user),
      userStatus: user?.status ?? null,
    },
  });

  if (!user || user.status !== "active") return;

  const { raw, hash } = generateResetToken();
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();

  // Fire-and-forget the DB write + email so hit-branch response time matches
  // the miss branch. `await`-ing here would leak a timing oracle (extra ms
  // measurable across many probes even under the 5/min + 3/hour caps),
  // defeating the generic-200 defense the route relies on. Errors are logged
  // and a follow-up audit row records the actual send outcome so a "did the
  // reset email go out?" question has a real answer to check.
  void (async () => {
    let emailDelivered = false;
    try {
      await payload.update({
        collection: "users",
        id: user.id,
        data: {
          resetTokenHash: hash,
          resetTokenExpiresAt: expiresAt,
        } as never,
        overrideAccess: true,
      });
      emailDelivered = await sendAdminPasswordResetEmail({
        email: user.email,
        token: raw,
      });
    } catch (err) {
      console.error("[users] password reset delivery failed", err);
    }
    // Second audit row carries the real delivery signal. Kept as a separate
    // row so the first audit (recorded synchronously above) stays intact even
    // if this async block never finishes.
    try {
      await writeAuditLog(payload, {
        action: "auth.password_reset_delivered",
        actorEmail: normalized,
        targetType: "users",
        targetId: String(user.id),
        metadata: { emailDelivered },
      });
    } catch (err) {
      console.error("[users] password reset audit failed", err);
    }
  })();
}

/**
 * Complete a reset: verify token + expiry, set the new password, clear the
 * one-time token. Returns null when the token is unknown, expired, or already
 * consumed — the caller returns a generic error either way.
 *
 * Setting a new password rotates Payload's salt/hash, which invalidates any
 * outstanding session cookies for the account (forced logout everywhere).
 * AUTH-HARDENING §6.
 */
export async function completePasswordReset(
  token: string,
  password: string,
  context?: { ipAddress?: string }
): Promise<{ id: string; email: string } | null> {
  const payload = await getPayloadClient();
  const hash = hashResetToken(token);

  const match = await payload.find({
    collection: "users",
    where: { resetTokenHash: { equals: hash } },
    limit: 1,
    overrideAccess: true,
  });

  const user = match.docs[0] as
    | (UserDoc & { resetTokenExpiresAt?: string })
    | undefined;
  if (!user) return null;

  const expiresAt = user.resetTokenExpiresAt
    ? Date.parse(user.resetTokenExpiresAt)
    : 0;
  if (!expiresAt || expiresAt < Date.now()) return null;

  // A suspended account must not be able to reset back into active — but we
  // don't distinguish "expired token" from "suspended account" in the error
  // response either way, so this is a silent guard.
  if (user.status !== "active") return null;

  await payload.update({
    collection: "users",
    id: user.id,
    data: {
      password,
      resetTokenHash: null,
      resetTokenExpiresAt: null,
      // Every outstanding session for this account is invalidated — Payload's
      // JWT strategy verifies `sid` against `user.sessions` (jwt.js:73-79), so
      // wiping the array honors the "you're signed out everywhere" promise the
      // reset UI makes. This is the primary security value of a password reset
      // in a compromised-account scenario. AUTH-HARDENING §6.
      sessions: [],
    } as never,
    overrideAccess: true,
  });

  await writeAuditLog(payload, {
    action: "auth.password_reset_completed",
    actorEmail: user.email,
    targetType: "users",
    targetId: String(user.id),
  });

  // Await the security receipt (~200ms) before returning so it is queued at
  // Resend before the reset endpoint responds. Without this the user's next
  // action (log in with the new password) fires its own login-notification
  // email that can race and arrive first — the audit trail is durable either
  // way, but users expect "your password was changed" to precede "new
  // sign-in". Failure is still swallowed: the reset already succeeded and the
  // audit row above is the authoritative record.
  try {
    await sendAdminPasswordChangedEmail({
      email: user.email,
      changedAtISO: new Date().toISOString(),
      ipAddress: context?.ipAddress,
    });
  } catch (err) {
    console.error("[users] password changed notification failed", err);
  }

  return { id: String(user.id), email: user.email };
}

export async function deleteAdminUser(id: string) {
  const payload = await getPayloadClient();
  await payload.delete({ collection: "users", id, overrideAccess: true });
  return { deleted: true };
}

/**
 * Return every active user with the `admin` role, id + email + name only.
 * Used to fan out review-queue notifications (see article-submitted email).
 * Skips pending and suspended accounts so a dormant admin doesn't receive
 * transactional mail.
 */
export async function listActiveAdminRecipients(): Promise<
  Array<{ id: string; email: string; name: string | null }>
> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "users",
    where: {
      and: [{ role: { equals: "admin" } }, { status: { equals: "active" } }],
    },
    limit: 200,
    depth: 0,
    overrideAccess: true,
    pagination: false,
  });
  return (
    result.docs as Array<{
      id: string | number;
      email: string;
      name?: string | null;
    }>
  ).map((doc) => ({
    id: String(doc.id),
    email: doc.email,
    name: doc.name ?? null,
  }));
}
