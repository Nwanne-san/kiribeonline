import type { PillTone } from "@/modules/admin/components/ui/AdminPrimitives";

export type ActivityItem = {
  id: string;
  action: string;
  actorEmail?: string;
  targetType?: string;
  targetId?: string;
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
  if (a.includes("review")) return { tone: "danger", label: "Review" };
  if (a.includes("delete")) return { tone: "neutral", label: "Deleted" };
  if (a.includes("archive")) return { tone: "neutral", label: "Archived" };
  if (a.includes("create")) return { tone: "warning", label: "Created" };
  if (a.includes("update") || a.includes("edit")) return { tone: "info", label: "Edited" };
  if (a.includes("login") || a.includes("sign")) return { tone: "neutral", label: "Signed in" };
  const label = action.charAt(0).toUpperCase() + action.slice(1).replace(/[._-]/g, " ");
  return { tone: "neutral", label };
}

/** Derive a display name from an actor's email local-part. */
export function actorName(email?: string): string {
  if (!email) return "Someone";
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
