"use client";

import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import ExpandLessRounded from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { ApiMethods } from "../../../../../types/service";
import {
  AdminButton,
  AdminPanel,
  InitialAvatar,
  Pill,
} from "@/modules/admin/components/ui/AdminPrimitives";
import { ListSkeleton } from "@/modules/admin/components/ui/AdminSkeletons";
import {
  ADMIN_DEFAULT_PAGE_LIMIT,
  ADMIN_PAGE_LIMIT_OPTIONS,
  URL_PARAMS,
} from "@/constants";
import { AdminRoutes } from "@/routes/admin.routes";
import {
  actionBadge,
  actorName,
  relativeTime,
  type ActivityItem,
} from "@/modules/admin/lib/activity";
import { usePagination } from "@/utils/hooks/usePagination";
import { useDebouncedUrlParam } from "@/utils/hooks/useDebouncedUrlParam";
import { useQueryService } from "@/utils/hooks/useQueryService";

/** Filter tabs. `action` is a prefix match on the audit-log `action` column. */
const TABS: { label: string; action?: string }[] = [
  { label: "All types" },
  { label: "Published", action: "publish" },
  { label: "Created", action: "created" },
  { label: "Updated", action: "updated" },
  { label: "Deleted", action: "deleted" },
  { label: "Auth", action: "auth" },
  { label: "Users", action: "users" },
];

const PARAM = {
  action: "action",
  targetType: "type",
  from: "from",
  to: "to",
} as const;

type AuditListResponse = {
  docs: (ActivityItem & { metadata?: Record<string, unknown> })[];
  page: number;
  totalPages: number;
  totalDocs: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export function RecentActivityPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { page, limit, setPage, setLimit } = usePagination(ADMIN_DEFAULT_PAGE_LIMIT);
  const { value: search, setValue: setSearch, debouncedValue } = useDebouncedUrlParam();

  const action = searchParams.get(PARAM.action) ?? "";
  const targetType = searchParams.get(PARAM.targetType) ?? "";
  const from = searchParams.get(PARAM.from) ?? "";
  const to = searchParams.get(PARAM.to) ?? "";

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      }
      params.set(URL_PARAMS.page, "1");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const listPath = useMemo(() => {
    const qs = new URLSearchParams();
    if (debouncedValue) qs.set("q", debouncedValue);
    if (action) qs.set("action", action);
    if (targetType) qs.set("targetType", targetType);
    if (from) qs.set("from", toIsoStart(from));
    if (to) qs.set("to", toIsoEnd(to));
    qs.set("page", String(page));
    qs.set("limit", String(limit));
    return `/api/admin/audit?${qs.toString()}`;
  }, [debouncedValue, action, targetType, from, to, page, limit]);

  const { data, isLoading, isFetching } = useQueryService<
    Record<string, never>,
    AuditListResponse
  >({
    service: { path: listPath, method: ApiMethods.GET },
    options: {
      keys: ["admin", "audit"],
      keepPreviousData: true,
      filterFingerprint: `${action}|${targetType}|${from}|${to}|${limit}`,
      searchQuery: debouncedValue,
    },
  });

  const { data: targetTypes } = useQueryService<Record<string, never>, string[]>({
    service: { path: "/api/admin/audit/target-types", method: ApiMethods.GET },
    options: { keys: ["admin", "audit", "target-types"], staleTime: 5 * 60 * 1000 },
  });

  const events = data?.docs ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalDocs = data?.totalDocs ?? 0;
  const activeTab = TABS.findIndex((t) => (t.action ?? "") === action);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="relative inline-block pb-2 font-headline text-2xl font-bold text-burgundy after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-12 after:bg-mustard after:content-['']">
            Audit Log
          </h1>
          <p className="mt-2 text-sm text-muted">
            {totalDocs.toLocaleString()} event{totalDocs === 1 ? "" : "s"} recorded
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
      <div className="space-y-3 rounded-xl border border-border bg-surface p-3 shadow-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {TABS.map((t, i) => (
              <button
                key={t.label}
                type="button"
                onClick={() => updateParams({ [PARAM.action]: t.action ?? null })}
                className={`rounded-md px-3 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-wide transition-colors ${
                  activeTab === i
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by actor email…"
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted-soft"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <FilterField label="Entity">
            <select
              value={targetType}
              onChange={(e) => updateParams({ [PARAM.targetType]: e.target.value })}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-burgundy focus:outline-none focus:ring-2 focus:ring-burgundy/20"
            >
              <option value="">All entities</option>
              {(targetTypes ?? []).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </FilterField>
          <FilterField label="From">
            <DateInput value={from} onChange={(v) => updateParams({ [PARAM.from]: v })} />
          </FilterField>
          <FilterField label="To">
            <DateInput value={to} onChange={(v) => updateParams({ [PARAM.to]: v })} />
          </FilterField>
        </div>
      </div>

      {/* Event list */}
      <AdminPanel bodyClassName={isLoading ? "" : "divide-y divide-border-soft"}>
        {isLoading && <ListSkeleton rows={8} />}
        {!isLoading &&
          events.map((e) => {
            const badge = actionBadge(e.action);
            const isExpanded = expandedId === e.id;
            const hasMeta = e.metadata && Object.keys(e.metadata).length > 0;
            return (
              <div key={e.id} className="px-5 py-4">
                <div className="flex items-start gap-3">
                  <InitialAvatar name={actorName(e.actorEmail)} className="mt-0.5 h-9 w-9" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-ink">
                        {actorName(e.actorEmail)}
                      </span>
                      <Pill tone={badge.tone}>{badge.label}</Pill>
                      <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[0.6875rem] text-ink-secondary">
                        {e.action}
                      </code>
                    </div>
                    <div className="mt-0.5 text-xs capitalize text-muted">
                      {e.targetType ? `${e.targetType}` : "—"}
                      {e.targetId ? ` · #${e.targetId}` : ""}
                      {e.actorEmail ? ` · ${e.actorEmail}` : ""}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="whitespace-nowrap text-xs text-muted-soft">
                      {relativeTime(e.createdAt)}
                    </span>
                    {hasMeta && (
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : e.id)}
                        aria-label={isExpanded ? "Hide details" : "Show details"}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface text-ink-secondary hover:bg-surface-muted"
                      >
                        {isExpanded ? (
                          <ExpandLessRounded sx={{ fontSize: 18 }} />
                        ) : (
                          <ExpandMoreRounded sx={{ fontSize: 18 }} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
                {isExpanded && hasMeta && (
                  <pre className="mt-3 overflow-x-auto rounded-lg border border-border-soft bg-surface-muted p-3 text-[0.6875rem] leading-relaxed text-ink-secondary">
                    {JSON.stringify(e.metadata, null, 2)}
                  </pre>
                )}
              </div>
            );
          })}
        {!isLoading && events.length === 0 && (
          <div className="px-5 py-12 text-center text-sm text-muted-soft">
            No activity matches this filter.
          </div>
        )}

        {/* Pagination footer */}
        {!isLoading && events.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-border-soft px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-muted">
              <label htmlFor="audit-page-size" className="font-semibold uppercase tracking-wide">
                Per page
              </label>
              <select
                id="audit-page-size"
                value={limit}
                onChange={(ev) => setLimit(Number(ev.target.value))}
                className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-ink focus:border-burgundy focus:outline-none focus:ring-2 focus:ring-burgundy/20"
              >
                {ADMIN_PAGE_LIMIT_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-muted" aria-live="polite">
                Page {page} of {totalPages}
                {isFetching ? " · updating…" : ""}
              </span>
              <div className="flex items-center gap-1.5">
                <PagerButton
                  Icon={ChevronLeftRounded}
                  label="Previous page"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                />
                <PagerButton
                  Icon={ChevronRightRounded}
                  label="Next page"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                />
              </div>
            </div>
          </div>
        )}
      </AdminPanel>
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="mb-1.5 block text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted">
        {label}
      </span>
      {children}
    </div>
  );
}

function DateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-burgundy focus:outline-none focus:ring-2 focus:ring-burgundy/20"
    />
  );
}

function PagerButton({
  Icon,
  label,
  onClick,
  disabled,
}: {
  Icon: React.ComponentType<{ sx?: object }>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-ink-secondary transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Icon sx={{ fontSize: 18 }} />
    </button>
  );
}

/** Convert `YYYY-MM-DD` (native date input) into an ISO datetime at day boundaries. */
function toIsoStart(ymd: string): string {
  if (!ymd) return ymd;
  return `${ymd}T00:00:00.000Z`;
}
function toIsoEnd(ymd: string): string {
  if (!ymd) return ymd;
  return `${ymd}T23:59:59.999Z`;
}
