"use client";

import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ApiMethods } from "../../../../../types/service";
import { AdminButton, AdminPanel, InitialAvatar, Pill } from "@/modules/admin/components/ui/AdminPrimitives";
import { ListSkeleton } from "@/modules/admin/components/ui/AdminSkeletons";
import { AdminRoutes } from "@/routes/admin.routes";
import { actionBadge, actorName, relativeTime, type ActivityItem } from "@/modules/admin/lib/activity";
import { useQueryService } from "@/utils/hooks/useQueryService";

/** Tab → substring matched against the action (and its resolved label). */
const TABS: { label: string; match?: string }[] = [
  { label: "All types" },
  { label: "Published", match: "publish" },
  { label: "Draft", match: "draft" },
  { label: "Edited", match: "edit" },
  { label: "Review", match: "review" },
  { label: "Upload", match: "upload" },
  { label: "Scheduled", match: "schedul" },
  { label: "Comment", match: "comment" },
  { label: "Deleted", match: "delet" },
];

export function RecentActivityPage() {
  const router = useRouter();
  // Client-side filter/search over a single fetch. URL-syncing q + tab is a
  // planned follow-up (see CLAUDE.md list-state convention).
  const [tab, setTab] = useState(0);
  const [query, setQuery] = useState("");

  const { data, isLoading } = useQueryService<Record<string, never>, ActivityItem[]>({
    service: { path: "/api/admin/activity?limit=50", method: ApiMethods.GET },
    options: { keys: ["admin", "activity"] },
  });

  const events = useMemo(() => data ?? [], [data]);

  const filtered = useMemo(() => {
    const match = TABS[tab]?.match;
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      if (match) {
        const hay = `${e.action} ${actionBadge(e.action).label}`.toLowerCase();
        if (!hay.includes(match)) return false;
      }
      if (q) {
        const hay = `${e.actorEmail ?? ""} ${actorName(e.actorEmail)} ${e.action} ${e.targetType ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [events, tab, query]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="relative inline-block pb-2 font-headline text-2xl font-bold text-burgundy after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-12 after:bg-mustard after:content-['']">
            Recent Activity
          </h1>
          <p className="mt-2 text-sm text-muted">
            Full audit trail · {events.length} event{events.length === 1 ? "" : "s"} recorded
          </p>
        </div>
        <AdminButton
          variant="secondary"
          leftIcon={<ArrowBackRounded sx={{ fontSize: 16 }} />}
          onClick={() => router.push(AdminRoutes.dashboard)}
        >
          Back to Dashboard
        </AdminButton>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3 shadow-card lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t, i) => (
            <button
              key={t.label}
              type="button"
              onClick={() => setTab(i)}
              className={`rounded-md px-3 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-wide transition-colors ${
                tab === i
                  ? "bg-[#7f0400] text-white"
                  : "border border-border text-ink-secondary hover:bg-surface-muted"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-surface-alt px-3 py-2 lg:w-64">
          <SearchRounded sx={{ fontSize: 18 }} className="shrink-0 text-muted-soft" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search activity…"
            className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted-soft"
          />
        </div>
      </div>

      {/* Event list */}
      <AdminPanel bodyClassName={isLoading ? "" : "divide-y divide-border-soft"}>
        {isLoading && <ListSkeleton rows={8} />}
        {!isLoading && filtered.map((e) => {
          const badge = actionBadge(e.action);
          return (
            <div key={e.id} className="flex items-start gap-3 px-5 py-4">
              <InitialAvatar name={actorName(e.actorEmail)} className="mt-0.5 h-9 w-9" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-ink">{actorName(e.actorEmail)}</span>
                  <Pill tone={badge.tone}>{badge.label}</Pill>
                </div>
                {e.targetType && (
                  <div className="mt-0.5 text-xs capitalize text-muted">
                    {e.targetType}
                    {e.targetId ? ` · #${e.targetId}` : ""}
                  </div>
                )}
              </div>
              <span className="shrink-0 whitespace-nowrap text-xs text-muted-soft">
                {relativeTime(e.createdAt)}
              </span>
            </div>
          );
        })}
        {!isLoading && filtered.length === 0 && (
          <div className="px-5 py-12 text-center text-sm text-muted-soft">
            No activity matches this filter.
          </div>
        )}
      </AdminPanel>
    </div>
  );
}
