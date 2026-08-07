"use client";

import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import FileDownloadOutlined from "@mui/icons-material/FileDownloadOutlined";
import HourglassEmptyOutlined from "@mui/icons-material/HourglassEmptyOutlined";
import MarkEmailReadOutlined from "@mui/icons-material/MarkEmailReadOutlined";
import SearchRounded from "@mui/icons-material/SearchRounded";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { ApiMethods } from "../../../../../types/service";
import {
  AdminButton,
  AdminPanel,
  Pill,
  StatTile,
  formatCompact,
} from "@/modules/admin/components/ui/AdminPrimitives";
import { ListSkeleton } from "@/modules/admin/components/ui/AdminSkeletons";
import {
  ADMIN_DEFAULT_PAGE_LIMIT,
  ADMIN_PAGE_LIMIT_OPTIONS,
  URL_PARAMS,
} from "@/constants";
import { usePagination } from "@/utils/hooks/usePagination";
import { useDebouncedUrlParam } from "@/utils/hooks/useDebouncedUrlParam";
import { useQueryService } from "@/utils/hooks/useQueryService";

type SubscriberDoc = {
  id: string;
  email: string;
  source?: string;
  consent: boolean;
  confirmed: boolean;
  confirmedAt?: string;
  createdAt: string;
  updatedAt: string;
};

type SubscribersResponse = {
  docs: SubscriberDoc[];
  page: number;
  totalPages: number;
  totalDocs: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  stats: { total: number; confirmed: number; pending: number };
};

const STATUS_TABS: { label: string; value: "" | "confirmed" | "pending" }[] = [
  { label: "All", value: "" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Pending", value: "pending" },
];

const PARAM = { status: "status" } as const;

export function SubscribersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { page, limit, setPage, setLimit } = usePagination(ADMIN_DEFAULT_PAGE_LIMIT);
  const { value: search, setValue: setSearch, debouncedValue } = useDebouncedUrlParam();

  const status = searchParams.get(PARAM.status) ?? "";

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
    if (status) qs.set("status", status);
    qs.set("page", String(page));
    qs.set("limit", String(limit));
    return `/api/admin/subscribers?${qs.toString()}`;
  }, [debouncedValue, status, page, limit]);

  const { data, isLoading, isFetching } = useQueryService<
    Record<string, never>,
    SubscribersResponse
  >({
    service: { path: listPath, method: ApiMethods.GET },
    options: {
      keys: ["admin", "subscribers"],
      keepPreviousData: true,
      filterFingerprint: `${status}|${limit}`,
      searchQuery: debouncedValue,
    },
  });

  const subs = data?.docs ?? [];
  const stats = data?.stats ?? { total: 0, confirmed: 0, pending: 0 };
  const totalPages = data?.totalPages ?? 1;
  const activeTab = STATUS_TABS.findIndex((t) => t.value === status);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="relative inline-block pb-2 font-headline text-2xl font-bold text-burgundy after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-12 after:bg-mustard after:content-['']">
            Subscribers
          </h1>
          <p className="mt-2 text-sm text-muted">
            Newsletter list · {stats.total.toLocaleString()} total
          </p>
        </div>
        <AdminButton
          variant="secondary"
          leftIcon={<FileDownloadOutlined sx={{ fontSize: 16 }} />}
          onClick={() => {
            // Reuse the same filter params on screen so what the operator sees
            // matches what lands in the file.
            const qs = new URLSearchParams();
            if (debouncedValue) qs.set("q", debouncedValue);
            if (status) qs.set("status", status);
            const url = `/api/admin/subscribers/export.csv${qs.toString() ? `?${qs.toString()}` : ""}`;
            window.location.href = url;
          }}
          disabled={stats.total === 0}
        >
          Export CSV
        </AdminButton>
      </div>

      {/* Stat tiles */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile
          label="Total"
          value={formatCompact(stats.total)}
          accent="brand"
          Icon={MarkEmailReadOutlined}
        />
        <StatTile
          label="Confirmed"
          value={formatCompact(stats.confirmed)}
          accent="success"
          Icon={CheckCircleOutlined}
        />
        <StatTile
          label="Pending"
          value={formatCompact(stats.pending)}
          accent="warning"
          Icon={HourglassEmptyOutlined}
        />
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 rounded-none border border-border bg-surface p-3 shadow-card lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map((t, i) => (
            <button
              key={t.label}
              type="button"
              onClick={() => updateParams({ [PARAM.status]: t.value || null })}
              className={`rounded-none px-3 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-wide transition-colors ${
                activeTab === i
                  ? "bg-[#6b1d2a] text-white"
                  : "border border-border text-ink-secondary hover:bg-surface-muted"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex min-w-0 items-center gap-2 rounded-none border border-border bg-surface-alt px-3 py-2 lg:w-72">
          <SearchRounded sx={{ fontSize: 18 }} className="shrink-0 text-muted-soft" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email…"
            className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted-soft"
          />
        </div>
      </div>

      {/* Table */}
      <AdminPanel bodyClassName={isLoading ? "" : ""}>
        {isLoading && <ListSkeleton rows={8} />}
        {!isLoading && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border-soft text-left text-[0.6875rem] uppercase tracking-[0.08em] text-muted-soft">
                  <th className="px-5 py-3 font-semibold">Email</th>
                  <th className="px-2 py-3 font-semibold">Status</th>
                  <th className="px-2 py-3 font-semibold">Source</th>
                  <th className="px-2 py-3 font-semibold">Subscribed</th>
                  <th className="px-5 py-3 font-semibold">Confirmed</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id} className="border-b border-border-soft last:border-0">
                    <td className="px-5 py-3 font-medium text-ink">{s.email}</td>
                    <td className="px-2 py-3">
                      {s.confirmed ? (
                        <Pill tone="success">Confirmed</Pill>
                      ) : (
                        <Pill tone="warning">Pending</Pill>
                      )}
                    </td>
                    <td className="px-2 py-3 text-ink-secondary">{s.source ?? "—"}</td>
                    <td className="px-2 py-3 text-ink-secondary">{formatDate(s.createdAt)}</td>
                    <td className="px-5 py-3 text-ink-secondary">
                      {s.confirmedAt ? formatDate(s.confirmedAt) : "—"}
                    </td>
                  </tr>
                ))}
                {subs.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center text-sm text-muted-soft"
                    >
                      No subscribers match this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        {!isLoading && subs.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-border-soft px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-muted">
              <label htmlFor="subs-page-size" className="font-semibold uppercase tracking-wide">
                Per page
              </label>
              <select
                id="subs-page-size"
                value={limit}
                onChange={(ev) => setLimit(Number(ev.target.value))}
                className="rounded-none border border-border bg-surface px-2 py-1.5 text-xs text-ink focus:border-burgundy focus:outline-none focus:ring-2 focus:ring-burgundy/20"
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
      className="inline-flex h-8 w-8 items-center justify-center rounded-none border border-border bg-surface text-ink-secondary transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Icon sx={{ fontSize: 18 }} />
    </button>
  );
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
