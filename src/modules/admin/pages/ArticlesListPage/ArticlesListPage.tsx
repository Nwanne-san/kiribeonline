"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import FilterListRounded from "@mui/icons-material/FilterListRounded";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import RemoveCircleOutlineOutlined from "@mui/icons-material/RemoveCircleOutlineOutlined";
import ArchiveOutlined from "@mui/icons-material/ArchiveOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiMethods } from "../../../../../types/service";
import {
  AdminButton,
  CategoryTag,
  Pill,
  formatCompact,
  type PillTone,
} from "@/modules/admin/components/ui/AdminPrimitives";
import { TableSkeleton } from "@/modules/admin/components/ui/AdminSkeletons";
import { usePermissions } from "@/modules/admin/hooks/usePermissions";
import { AdminRoutes, adminRoute } from "@/routes/admin.routes";
import {
  adminArticlesService,
  adminCategoriesService,
  adminUsersService,
} from "@/services/admin.service";
import { CATEGORY_COLORS, type CategorySlug } from "@/theme/category-colors";
import {
  ADMIN_DEFAULT_PAGE_LIMIT,
  ADMIN_PAGE_LIMIT_OPTIONS,
  URL_PARAMS,
} from "@/constants";
import { useDebouncedUrlParam } from "@/utils/hooks/useDebouncedUrlParam";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { usePagination } from "@/utils/hooks/usePagination";
import { useQueryService } from "@/utils/hooks/useQueryService";

/* ─────────────────────────────────────────────────── API payload types */

type MediaRef = { url?: string | null; alt?: string | null };
type AuthorRef = { id: string; name?: string | null; email?: string | null };
type TermRef = { id: string; name: string; slug: string };

type ArticleStatus = "draft" | "published" | "scheduled" | "archived";

type ArticleDoc = {
  id: string;
  title: string;
  status: ArticleStatus | string;
  publishedAt?: string | null;
  updatedAt: string;
  viewCount?: number;
  heroImage?: MediaRef | string | null;
  author?: AuthorRef | string | null;
  categories?: Array<TermRef | string> | null;
};

type Paginated<T> = {
  docs: T[];
  totalDocs: number;
  totalPages: number;
  page: number;
  limit: number;
};

/**
 * List params owned by this screen. `page`/`limit`/`q` are handled by the shared
 * URL hooks (`URL_PARAMS`); the rest live here since they're specific to the
 * article filter panel and aren't part of the shared constant.
 */
const PARAM = {
  status: "status",
  category: "category",
  author: "author",
  sort: "sort",
} as const;

/* ─────────────────────────────────────────── Status → tab / pill maps */

const STATUS_TABS: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Published", value: "published" },
  { label: "Draft", value: "draft" },
  { label: "Scheduled", value: "scheduled" },
];

const STATUS_TONE: Record<string, PillTone> = {
  draft: "warning",
  published: "success",
  scheduled: "info",
  archived: "neutral",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  scheduled: "Scheduled",
  archived: "Archived",
};

/* ─────────────────────────────────────────────────────────── Helpers */

function categoryColor(slug: string): string {
  return CATEGORY_COLORS[slug as CategorySlug]?.bg ?? "#4b5563";
}

function pickCategory(doc: ArticleDoc, preferSlug?: string): TermRef | null {
  const objects = (doc.categories ?? []).filter(
    (c): c is TermRef => typeof c === "object"
  );
  if (preferSlug) {
    const match = objects.find((c) => c.slug === preferSlug);
    if (match) return match;
  }
  return objects[0] ?? null;
}

function authorName(doc: ArticleDoc): string {
  const a = doc.author;
  if (a && typeof a === "object") return a.name ?? a.email ?? "Unassigned";
  return "Unassigned";
}

function heroUrl(doc: ArticleDoc): string | null {
  const h = doc.heroImage;
  if (h && typeof h === "object" && h.url) return h.url;
  return null;
}

function displayDate(doc: ArticleDoc): string {
  const raw = doc.publishedAt ?? doc.updatedAt;
  if (!raw) return "—";
  return new Date(raw).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/* ─────────────────────────────────────────────────────────────── Page */

export function ArticlesListPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { can } = usePermissions();

  const { page, limit, setPage, setLimit } = usePagination(ADMIN_DEFAULT_PAGE_LIMIT);
  const { value: search, setValue: setSearch, debouncedValue } = useDebouncedUrlParam();

  const status = searchParams.get(PARAM.status) ?? "";
  const category = searchParams.get(PARAM.category) ?? "";
  const author = searchParams.get(PARAM.author) ?? "";
  const sort = searchParams.get(PARAM.sort) ?? "newest";

  const [filterOpen, setFilterOpen] = useState(
    () => Boolean(category || author || (sort && sort !== "newest"))
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());

  /**
   * Atomically write one or more list params, resetting to page 1. Reads the
   * live URL at call time (not a render snapshot) so a write can't clobber a
   * change another URL writer — the debounced search or the pager — just made.
   */
  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(window.location.search);
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      }
      params.set(URL_PARAMS.page, "1");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router]
  );

  /* ── List query (server: status, q, page, limit) ── */

  const listPath = useMemo(() => {
    const qs = new URLSearchParams();
    if (status) qs.set("status", status);
    if (debouncedValue) qs.set("q", debouncedValue);
    if (category) qs.set("categoryId", category);
    if (author) qs.set("authorId", author);
    qs.set("sort", sort === "oldest" ? "oldest" : "newest");
    qs.set("page", String(page));
    qs.set("limit", String(limit));
    return `/api/admin/articles?${qs.toString()}`;
  }, [status, debouncedValue, category, author, sort, page, limit]);

  const { data, isLoading, isFetching } = useQueryService<
    Record<string, never>,
    Paginated<ArticleDoc>
  >({
    service: { path: listPath, method: ApiMethods.GET },
    options: { keys: ["admin", "articles"], keepPreviousData: true },
  });

  /* ── Filter option sources ── */

  const { data: categoryData } = useQueryService<
    Record<string, never>,
    Paginated<TermRef>
  >({
    service: adminCategoriesService.list,
    options: { keys: ["admin", "categories"], staleTime: 5 * 60 * 1000 },
  });

  const { data: userData } = useQueryService<
    Record<string, never>,
    Paginated<AuthorRef>
  >({
    service: adminUsersService.list,
    options: { keys: ["admin", "users"], staleTime: 5 * 60 * 1000 },
  });

  const categoryOptions = categoryData?.docs ?? [];
  const authorOptions = userData?.docs ?? [];

  // Filtering + ordering all happen server-side (see `listPath`), so the current
  // page of docs is already the correct, complete result set for the pager.
  const rows = data?.docs ?? [];

  // When a category filter is active, prefer showing that category's tag on rows
  // that carry several categories.
  const activeCategory = useMemo(
    () => (categoryData?.docs ?? []).find((c) => c.id === category) ?? null,
    [categoryData, category]
  );

  // Clear selection whenever the underlying result set changes.
  useEffect(() => {
    setSelected(new Set());
  }, [listPath]);

  /* ── Bulk actions ── */

  const bulk = useMutationService<
    { ids: string[]; action: string },
    { updated: number }
  >({
    service: adminArticlesService.bulk,
    options: {
      successTitle: "Articles updated",
      successMessage: (r) => `${r.updated} article${r.updated === 1 ? "" : "s"} updated.`,
      errorTitle: "Bulk action failed",
      onSuccess: (_r, { queryClient }) => {
        // Refresh the article list and dashboard counters; leave the category /
        // user option lists (long staleTime) untouched.
        queryClient.invalidateQueries({ queryKey: ["admin", "articles"] });
        queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
        setSelected(new Set());
      },
    },
  });

  const runBulk = (action: "publish" | "unpublish" | "archive" | "delete") => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    if (action === "delete") {
      const ok = window.confirm(
        `Delete ${ids.length} article${ids.length === 1 ? "" : "s"}? This cannot be undone.`
      );
      if (!ok) return;
    }
    bulk.mutate({ ids, action });
  };

  /* ── Selection helpers ── */

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const someSelected = rows.some((r) => selected.has(r.id));

  const toggleAll = () => {
    setSelected((prev) => {
      if (rows.every((r) => prev.has(r.id))) return new Set();
      return new Set(rows.map((r) => r.id));
    });
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /* ── Derived header + pagination values ── */

  const totalDocs = data?.totalDocs ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const subtitle = filterOpen
    ? `${totalDocs} total · ${rows.length} shown`
    : `${totalDocs} total article${totalDocs === 1 ? "" : "s"}`;

  const canEdit = can("articles:edit");
  const canPublish = can("articles:publish");
  const canDelete = can("articles:delete");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="relative inline-block pb-2 font-headline text-2xl font-bold text-burgundy after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-12 after:bg-mustard after:content-['']">
            Articles
          </h1>
          <p className="mt-2 text-sm text-muted">{subtitle}</p>
        </div>
        <AdminButton
          variant="primary"
          size="sm"
          className="self-start"
          leftIcon={<AddRounded sx={{ fontSize: 16 }} />}
          onClick={() => router.push(AdminRoutes.articleNew)}
        >
          New Article
        </AdminButton>
      </div>

      {/* Toolbar */}
      <div className="rounded-xl border border-border bg-surface px-4 py-3 shadow-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Status tabs */}
          <div className="flex flex-wrap gap-1.5">
            {STATUS_TABS.map((tab) => {
              const active = status === tab.value;
              return (
                <button
                  key={tab.value || "all"}
                  type="button"
                  onClick={() => updateParams({ [PARAM.status]: tab.value })}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                    active
                      ? "bg-[#7f0400] text-white"
                      : "border border-border bg-surface text-ink-secondary hover:bg-surface-muted"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search + filter toggle */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 lg:w-64 lg:flex-none">
              <SearchRounded
                sx={{ fontSize: 18 }}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-soft"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search articles..."
                aria-label="Search articles"
                className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-ink placeholder:text-muted-soft focus:border-burgundy focus:outline-none focus:ring-2 focus:ring-burgundy/20"
              />
            </div>
            <button
              type="button"
              onClick={() => setFilterOpen((v) => !v)}
              aria-pressed={filterOpen}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
                filterOpen
                  ? "border border-[#7f0400] text-[#7f0400]"
                  : "border border-border bg-surface text-ink-secondary hover:bg-surface-muted"
              }`}
            >
              <FilterListRounded sx={{ fontSize: 16 }} />
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Filter panel */}
      {filterOpen && (
        <div className="animate-fadeIn rounded-xl border border-border bg-surface px-5 py-4 shadow-card">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FilterSelect
              label="Category"
              value={category}
              onChange={(v) => updateParams({ [PARAM.category]: v })}
              placeholder="All categories"
              options={categoryOptions.map((c) => ({ value: c.id, label: c.name }))}
            />
            <FilterSelect
              label="Author"
              value={author}
              onChange={(v) => updateParams({ [PARAM.author]: v })}
              placeholder="All authors"
              options={authorOptions.map((a) => ({
                value: a.id,
                label: a.name ?? a.email ?? "Unnamed",
              }))}
            />
            <FilterSelect
              label="Sort by date"
              value={sort}
              onChange={(v) => updateParams({ [PARAM.sort]: v })}
              options={[
                { value: "newest", label: "Newest first" },
                { value: "oldest", label: "Oldest first" },
              ]}
            />
          </div>
        </div>
      )}

      {/* Table card */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
        {/* Bulk action bar */}
        {canEdit && selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-border-soft bg-surface-alt px-4 py-2.5">
            <span className="text-xs font-semibold text-ink">
              {selected.size} selected
            </span>
            <span className="mx-1 h-4 w-px bg-border" aria-hidden />
            {canPublish && (
              <>
                <AdminButton
                  variant="secondary"
                  size="sm"
                  leftIcon={<CheckCircleOutlined sx={{ fontSize: 16 }} />}
                  disabled={bulk.isPending}
                  onClick={() => runBulk("publish")}
                >
                  Publish
                </AdminButton>
                <AdminButton
                  variant="secondary"
                  size="sm"
                  leftIcon={<RemoveCircleOutlineOutlined sx={{ fontSize: 16 }} />}
                  disabled={bulk.isPending}
                  onClick={() => runBulk("unpublish")}
                >
                  Unpublish
                </AdminButton>
                <AdminButton
                  variant="secondary"
                  size="sm"
                  leftIcon={<ArchiveOutlined sx={{ fontSize: 16 }} />}
                  disabled={bulk.isPending}
                  onClick={() => runBulk("archive")}
                >
                  Archive
                </AdminButton>
              </>
            )}
            {canDelete && (
              <AdminButton
                variant="danger"
                size="sm"
                leftIcon={<DeleteOutlineOutlined sx={{ fontSize: 16 }} />}
                disabled={bulk.isPending}
                onClick={() => runBulk("delete")}
              >
                Delete
              </AdminButton>
            )}
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="ml-auto text-xs font-semibold uppercase tracking-wide text-muted hover:text-ink"
            >
              Clear
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          {isLoading ? (
            <TableSkeleton rows={10} cols={7} />
          ) : (
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-border-soft text-left text-[0.6875rem] uppercase tracking-[0.08em] text-muted-soft">
                <th className="w-10 px-4 py-3">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={!allSelected && someSelected}
                    onChange={toggleAll}
                    ariaLabel="Select all articles"
                  />
                </th>
                <th className="px-2 py-3 font-semibold">Title</th>
                <th className="px-2 py-3 font-semibold">Category</th>
                <th className="px-2 py-3 font-semibold">Author</th>
                <th className="px-2 py-3 font-semibold">Date</th>
                <th className="px-2 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Views</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((article) => {
                const cat = pickCategory(article, activeCategory?.slug);
                const hero = heroUrl(article);
                const isSelected = selected.has(article.id);
                return (
                  <tr
                    key={article.id}
                    onClick={() =>
                      router.push(adminRoute(AdminRoutes.articleEdit, { id: article.id }))
                    }
                    className={`cursor-pointer border-b border-border-soft transition-colors last:border-0 hover:bg-surface-alt ${
                      isSelected ? "bg-surface-alt" : ""
                    }`}
                  >
                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleOne(article.id)}
                        ariaLabel={`Select ${article.title}`}
                      />
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-surface-muted">
                          {hero ? (
                            <Image
                              src={hero}
                              alt={
                                (typeof article.heroImage === "object" &&
                                  article.heroImage?.alt) ||
                                article.title
                              }
                              width={40}
                              height={40}
                              className="h-10 w-10 object-cover"
                            />
                          ) : null}
                        </div>
                        <Link
                          href={adminRoute(AdminRoutes.articleEdit, { id: article.id })}
                          onClick={(e) => e.stopPropagation()}
                          className="line-clamp-1 font-medium text-ink transition-colors hover:text-burgundy focus:underline focus:outline-none"
                        >
                          {article.title}
                        </Link>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      {cat ? (
                        <CategoryTag label={cat.name} color={categoryColor(cat.slug)} />
                      ) : (
                        <span className="text-muted-soft">—</span>
                      )}
                    </td>
                    <td className="px-2 py-3 text-ink-secondary">{authorName(article)}</td>
                    <td className="px-2 py-3 whitespace-nowrap text-ink-secondary">
                      {displayDate(article)}
                    </td>
                    <td className="px-2 py-3">
                      <Pill tone={STATUS_TONE[article.status] ?? "neutral"}>
                        {STATUS_LABEL[article.status] ?? article.status}
                      </Pill>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink-secondary">
                      {formatCompact(article.viewCount ?? 0)}
                    </td>
                  </tr>
                );
              })}

              {!isLoading && rows.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-sm text-muted-soft"
                  >
                    {status || debouncedValue || category || author
                      ? "No articles match these filters."
                      : "No articles yet. Create your first one."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          )}
        </div>

        {/* Pagination footer */}
        <div className="flex flex-col gap-3 border-t border-border-soft px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-muted">
            <label htmlFor="page-size" className="font-semibold uppercase tracking-wide">
              Per page
            </label>
            <select
              id="page-size"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
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
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────── Sub-components */

function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  const id = `filter-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-burgundy focus:outline-none focus:ring-2 focus:ring-burgundy/20"
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
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
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-ink-secondary transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Icon sx={{ fontSize: 18 }} />
    </button>
  );
}

function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={ariaLabel}
      className="h-4 w-4 cursor-pointer rounded border-border text-burgundy accent-burgundy focus:outline-none focus:ring-2 focus:ring-burgundy/30"
    />
  );
}
