"use client";

import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import RateReviewOutlined from "@mui/icons-material/RateReviewOutlined";
import ScheduleOutlined from "@mui/icons-material/ScheduleOutlined";
import PermMediaOutlined from "@mui/icons-material/PermMediaOutlined";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import ChatBubbleOutlineOutlined from "@mui/icons-material/ChatBubbleOutlineOutlined";
import SellOutlined from "@mui/icons-material/SellOutlined";
import LocalOfferOutlined from "@mui/icons-material/LocalOfferOutlined";
import AddRounded from "@mui/icons-material/AddRounded";
import FileUploadOutlined from "@mui/icons-material/FileUploadOutlined";
import HomeOutlined from "@mui/icons-material/HomeOutlined";
import NorthEastRounded from "@mui/icons-material/NorthEastRounded";
import { useRouter } from "next/navigation";
import { ApiMethods } from "../../../../../types/service";
import {
  AdminButton,
  AdminPanel,
  CategoryTag,
  InitialAvatar,
  Pill,
  StatTile,
  formatCompact,
} from "@/modules/admin/components/ui/AdminPrimitives";
import {
  ListSkeleton,
  StatTilesSkeleton,
  TableSkeleton,
} from "@/modules/admin/components/ui/AdminSkeletons";
import { AdminRoutes, adminRoute } from "@/routes/admin.routes";
import { usePermissions } from "@/modules/admin/hooks/usePermissions";
import { actionBadge, actorName, relativeTime } from "@/modules/admin/lib/activity";
import { CATEGORY_COLORS, type CategorySlug } from "@/theme/category-colors";
import { useQueryService } from "@/utils/hooks/useQueryService";

/* ─────────────────────────────────────────────────── API payload types */

type TermRef = { id: string; name: string; slug: string };
type AuthorRef = { id: string; name: string | null; email?: string };

type DashboardData = {
  articles: {
    total: number;
    published: number;
    draft: number;
    inReview: number;
    scheduled: number;
    archived: number;
    publishedThisWeek: number;
  };
  categories: number;
  tags: number;
  media: number;
  totalViews: number;
  unreadMessages: number;
  recentArticles: ArticleListItem[];
  recentActivity: ActivityItem[];
  contentPerformance: PerformanceItem[];
};

type PerformanceItem = {
  id: string;
  title: string;
  slug: string;
  viewCount: number;
  author?: AuthorRef;
  categories: TermRef[];
};

type ActivityItem = {
  id: string;
  action: string;
  actorEmail?: string;
  targetType?: string;
  targetId?: string;
  createdAt: string;
};

type ArticleListItem = {
  id: string;
  title: string;
  status: string;
  publishedAt?: string;
  updatedAt: string;
  author?: AuthorRef;
  categories: TermRef[];
};

/* ───────────────────────────────────────────────────────────── Helpers */

function categoryColor(slug: string): string {
  return CATEGORY_COLORS[slug as CategorySlug]?.bg ?? "#4b5563";
}

/* ─────────────────────────────────────────────────────────────── Page */

export function AdminDashboardPage() {
  const router = useRouter();
  const { me, can } = usePermissions();

  const { data, isLoading } = useQueryService<Record<string, never>, DashboardData>({
    service: { path: "/api/admin/dashboard", method: ApiMethods.GET },
    options: { keys: ["admin", "dashboard"] },
  });

  const { data: scheduled, isLoading: scheduledLoading } = useQueryService<
    Record<string, never>,
    { docs: ArticleListItem[] }
  >({
    service: { path: "/api/admin/articles?status=scheduled&limit=4", method: ApiMethods.GET },
    options: { keys: ["admin", "articles", "scheduled"] },
  });

  const firstName = (me?.name ?? "").split(" ")[0] || "there";
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const a = data?.articles;
  const tiles = [
    {
      label: "Published",
      value: a?.published ?? 0,
      sub: a?.publishedThisWeek ? `+${a.publishedThisWeek} this week` : undefined,
      accent: "success" as const,
      Icon: CheckCircleOutlined,
    },
    { label: "Drafts", value: a?.draft ?? 0, accent: "warning" as const, Icon: EditOutlined },
    // Editorial-queue tile — clicking should ideally deep-link to the In-review
    // filter; wiring the tile navigation up is left to a UX pass once we
    // confirm the click target with product.
    { label: "In Review", value: a?.inReview ?? 0, accent: "brand" as const, Icon: RateReviewOutlined },
    { label: "Scheduled", value: a?.scheduled ?? 0, accent: "info" as const, Icon: ScheduleOutlined },
    { label: "Media Assets", value: data?.media ?? 0, accent: "teal" as const, Icon: PermMediaOutlined },
    {
      label: "Total Views",
      value: formatCompact(data?.totalViews ?? 0),
      accent: "indigo" as const,
      Icon: VisibilityOutlined,
    },
    {
      label: "Unread Messages",
      value: data?.unreadMessages ?? 0,
      accent: "neutral" as const,
      Icon: ChatBubbleOutlineOutlined,
    },
    { label: "Categories", value: data?.categories ?? 0, accent: "purple" as const, Icon: SellOutlined },
    { label: "Tags", value: data?.tags ?? 0, accent: "danger" as const, Icon: LocalOfferOutlined },
  ];

  const performance = data?.contentPerformance ?? [];
  const activity = data?.recentActivity ?? [];
  const scheduledPosts = scheduled?.docs ?? [];
  const recentArticles = data?.recentArticles ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="relative inline-block pb-2 font-headline text-2xl font-bold text-burgundy after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-12 after:bg-mustard after:content-['']">
            Welcome back, {firstName}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {today}
            {me ? ` · ${roleLabel(me.role)}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminButton leftIcon={<AddRounded sx={{ fontSize: 16 }} />} onClick={() => router.push(AdminRoutes.articleNew)}>
            New Article
          </AdminButton>
          <AdminButton variant="secondary" leftIcon={<FileUploadOutlined sx={{ fontSize: 16 }} />} onClick={() => router.push(AdminRoutes.media)}>
            Upload Media
          </AdminButton>
          <AdminButton variant="secondary" leftIcon={<SellOutlined sx={{ fontSize: 16 }} />} onClick={() => router.push(AdminRoutes.categories)}>
            Add Category
          </AdminButton>
          <AdminButton variant="secondary" leftIcon={<HomeOutlined sx={{ fontSize: 16 }} />} onClick={() => router.push(AdminRoutes.homepage)}>
            Homepage
          </AdminButton>
        </div>
      </div>

      {/* Stat tiles */}
      {isLoading ? (
        <StatTilesSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 2xl:grid-cols-8">
          {tiles.map((t) => (
            <StatTile key={t.label} {...t} />
          ))}
        </div>
      )}

      {/* Performance + Activity — the activity tile is gated on `audit:view`
          server-side (see /api/admin/dashboard) so writers/contributors get a
          performance-only row rather than seeing other users' actions. */}
      <div
        className={`grid gap-5 ${can("audit:view") ? "lg:grid-cols-[1.6fr_1fr]" : ""}`}
      >
        <AdminPanel
          title="Content Performance"
          action={<PanelLink label="View Analytics" onClick={() => router.push(AdminRoutes.analytics)} />}
        >
          {isLoading ? (
            <TableSkeleton rows={5} cols={5} />
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-border-soft text-left text-[0.6875rem] uppercase tracking-[0.08em] text-muted-soft">
                  <th className="px-5 py-2.5 font-semibold">#</th>
                  <th className="px-2 py-2.5 font-semibold">Article</th>
                  <th className="px-2 py-2.5 font-semibold">Category</th>
                  <th className="px-2 py-2.5 font-semibold">Author</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Views</th>
                </tr>
              </thead>
              <tbody>
                {performance.map((item, i) => {
                  const cat = item.categories[0];
                  return (
                    <tr
                      key={item.id}
                      onClick={() => router.push(adminRoute(AdminRoutes.articleEdit, { id: item.id }))}
                      className="cursor-pointer border-b border-border-soft transition-colors last:border-0 hover:bg-surface-alt"
                    >
                      <td className="px-5 py-3 text-muted-soft">{i + 1}</td>
                      <td className="px-2 py-3 font-medium text-ink">
                        <span className="line-clamp-1">{item.title}</span>
                      </td>
                      <td className="px-2 py-3">
                        {cat ? <CategoryTag label={cat.name} color={categoryColor(cat.slug)} /> : "—"}
                      </td>
                      <td className="px-2 py-3 text-ink-secondary">
                        {item.author?.name ?? item.author?.email ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-ink-secondary">
                        {item.viewCount.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
                {performance.length === 0 && <EmptyRow colSpan={5} label="No published articles yet." />}
              </tbody>
            </table>
          </div>
          )}
        </AdminPanel>

        {can("audit:view") && (
        <AdminPanel
          title="Recent Activity"
          action={<PanelLink label="See All" onClick={() => router.push(AdminRoutes.recentActivity)} />}
          bodyClassName={isLoading ? "" : "divide-y divide-border-soft"}
        >
          {isLoading && <ListSkeleton rows={6} />}
          {!isLoading && activity.map((item) => {
            const badge = actionBadge(item.action);
            return (
              <div key={item.id} className="flex items-start gap-3 px-5 py-3">
                <InitialAvatar name={actorName(item.actorEmail)} className="mt-0.5 h-8 w-8" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[0.8125rem] font-semibold text-ink">
                      {actorName(item.actorEmail)}
                    </span>
                    <Pill tone={badge.tone}>{badge.label}</Pill>
                  </div>
                  <div className="mt-0.5 text-xs text-muted">
                    {item.targetType ? `${item.targetType} · ` : ""}
                    {relativeTime(item.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
          {!isLoading && activity.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-muted-soft">No recent activity.</div>
          )}
        </AdminPanel>
        )}
      </div>

      {/* Scheduled + Recently updated */}
      <div className="grid gap-5 lg:grid-cols-2">
        <AdminPanel
          title="Scheduled Posts"
          action={<PanelLink label="Open Calendar" onClick={() => router.push(AdminRoutes.articles)} />}
          bodyClassName={scheduledLoading ? "" : "divide-y divide-border-soft"}
        >
          {scheduledLoading && <ListSkeleton rows={3} />}
          {!scheduledLoading && scheduledPosts.map((post) => (
            <ArticleRow key={post.id} article={post} dateField="publishedAt" onOpen={router.push} />
          ))}
          {!scheduledLoading && scheduledPosts.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-muted-soft">Nothing scheduled.</div>
          )}
        </AdminPanel>

        <AdminPanel
          title="Recently Updated"
          action={<PanelLink label="All Articles" onClick={() => router.push(AdminRoutes.articles)} />}
          bodyClassName={isLoading ? "" : "divide-y divide-border-soft"}
        >
          {isLoading && <ListSkeleton rows={4} />}
          {!isLoading && recentArticles.slice(0, 4).map((post) => (
            <ArticleRow key={post.id} article={post} dateField="updatedAt" onOpen={router.push} />
          ))}
          {!isLoading && recentArticles.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-muted-soft">No articles yet.</div>
          )}
        </AdminPanel>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────── Sub-components */

function roleLabel(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function PanelLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-burgundy transition-colors hover:text-burgundy-light"
    >
      {label}
      <NorthEastRounded sx={{ fontSize: 13 }} />
    </button>
  );
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-8 text-center text-sm text-muted-soft">
        {label}
      </td>
    </tr>
  );
}

function ArticleRow({
  article,
  dateField,
  onOpen,
}: {
  article: ArticleListItem;
  dateField: "publishedAt" | "updatedAt";
  onOpen: (route: string) => void;
}) {
  const cat = article.categories[0];
  const dateStr = article[dateField];
  const date = dateStr ? new Date(dateStr) : null;

  return (
    <button
      type="button"
      onClick={() => onOpen(adminRoute(AdminRoutes.articleEdit, { id: article.id }))}
      className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-surface-alt"
    >
      {date && (
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-ink text-white">
          <span className="text-[0.5625rem] font-semibold uppercase leading-none">
            {date.toLocaleDateString("en-GB", { month: "short" })}
          </span>
          <span className="text-sm font-bold leading-tight">{date.getDate()}</span>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="line-clamp-1 text-sm font-medium text-ink">{article.title}</div>
        <div className="mt-0.5 text-xs text-muted">
          {article.author?.name ?? article.author?.email ?? "Unassigned"}
        </div>
      </div>
      {cat && <CategoryTag label={cat.name} color={categoryColor(cat.slug)} />}
    </button>
  );
}
