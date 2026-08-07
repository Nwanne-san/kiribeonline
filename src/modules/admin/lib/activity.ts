import type { PillTone } from "@/modules/admin/components/ui/AdminPrimitives";

export type ActivityItem = {
  id: string;
  action: string;
  actorEmail?: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

/** Map an audit-log action string to a badge tone + human label. */
export function actionBadge(action: string): { tone: PillTone; label: string } {
  const a = action.toLowerCase();
  if (a.includes("publish")) return { tone: "success", label: "Published" };
  if (a.includes("schedul")) return { tone: "indigo", label: "Scheduled" };
  if (a.includes("upload")) return { tone: "teal", label: "Uploaded" };
  if (a.includes("invite")) return { tone: "purple", label: "Invited" };
  if (a.includes("comment")) return { tone: "purple", label: "Commented" };
  if (a.includes("submitted_for_review") || a.includes("review"))
    return { tone: "danger", label: "In review" };
  if (a.includes("delete")) return { tone: "neutral", label: "Deleted" };
  if (a.includes("archive")) return { tone: "neutral", label: "Archived" };
  if (a.includes("create")) return { tone: "warning", label: "Created" };
  if (a.includes("reverted_to_draft")) return { tone: "warning", label: "Sent to draft" };
  if (a.includes("update") || a.includes("edit")) return { tone: "info", label: "Edited" };
  if (a.includes("login") || a.includes("sign") || a.includes("logout"))
    return { tone: "neutral", label: "Auth" };
  const label = action.charAt(0).toUpperCase() + action.slice(1).replace(/[._-]/g, " ");
  return { tone: "neutral", label };
}

/** Derive a display name from an actor's email local-part. */
export function actorName(email?: string): string {
  if (!email) return "System";
  const local = email.split("@")[0].replace(/[._-]/g, " ");
  return local.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Relative "2 min ago" / "3 hr ago" formatting; falls back to a short date. */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Math.max(0, Date.now() - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const SINGULAR_LABELS: Record<string, string> = {
  articles: "article",
  reels: "reel",
  categories: "category",
  tags: "tag",
  pages: "page",
  media: "image",
  users: "team member",
  subscribers: "subscriber",
  "audit-logs": "audit log",
  homepage: "homepage",
  navigation: "navigation link",
  settings: "settings entry",
};

function subjectFor(targetType?: string): string {
  if (!targetType) return "record";
  return SINGULAR_LABELS[targetType] ?? targetType;
}

function quoted(title?: unknown): string {
  const t = typeof title === "string" ? title.trim() : "";
  return t ? ` “${t}”` : "";
}

/**
 * Build a one-sentence, human summary of an audit event for the row and
 * expanded detail. Reads the enriched metadata written by `auditAfterChange`
 * (title, previousStatus, nextStatus) plus the action slug and falls back to a
 * generic form when a hook wasn't the source (auth events, manual writes).
 */
export function humanSummary(entry: ActivityItem): string {
  const actor = actorName(entry.actorEmail);
  const subject = subjectFor(entry.targetType);
  const title = (entry.metadata?.title as string | undefined) ?? undefined;
  const label = quoted(title);
  const action = entry.action.toLowerCase();

  // Auth events — the target is always the actor themselves.
  if (action === "auth.login") return `${actor} signed in.`;
  if (action === "auth.logout") return `${actor} signed out.`;
  if (action === "auth.invite_accepted")
    return `${actor} accepted an invitation and activated their account.`;
  if (action === "auth.password_reset_requested")
    return `${actor} requested a password reset.`;
  if (action === "auth.password_reset_completed")
    return `${actor} completed a password reset.`;

  // User invites — role sits in metadata.
  if (action === "users.invited") {
    const role = entry.metadata?.role as string | undefined;
    return `${actor} invited a new ${role ?? "team member"}.`;
  }

  // Status transitions on any content entity.
  if (action.endsWith(".published"))
    return `${actor} published the ${subject}${label}.`;
  if (action.endsWith(".scheduled"))
    return `${actor} scheduled the ${subject}${label} for publication.`;
  if (action.endsWith(".submitted_for_review"))
    return `${actor} submitted the ${subject}${label} for review.`;
  if (action.endsWith(".archived"))
    return `${actor} archived the ${subject}${label}.`;
  if (action.endsWith(".reverted_to_draft"))
    return `${actor} moved the ${subject}${label} back to draft.`;

  // Generic CRUD.
  if (action.endsWith(".created")) return `${actor} created the ${subject}${label}.`;
  if (action.endsWith(".updated")) return `${actor} updated the ${subject}${label}.`;
  if (action.endsWith(".deleted")) return `${actor} deleted the ${subject}${label}.`;
  if (action.endsWith(".uploaded")) return `${actor} uploaded a new ${subject}${label}.`;

  // Fallback — use the action slug as-is so nothing is silently swallowed.
  const readable = entry.action.replace(/[._-]/g, " ");
  return `${actor} · ${readable}${label}.`;
}
