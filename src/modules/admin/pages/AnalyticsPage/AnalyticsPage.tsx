"use client";

import ArticleOutlined from "@mui/icons-material/ArticleOutlined";
import LaunchRounded from "@mui/icons-material/LaunchRounded";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import { ApiMethods } from "../../../../../types/service";
import type { AnalyticsData } from "@/server/modules";
import {
  AdminButton,
  AdminPageHeader,
  AdminPanel,
  Pill,
  StatTile,
  formatCompact,
  type PillTone,
} from "@/modules/admin/components/ui/AdminPrimitives";
import { ListSkeleton, TableSkeleton } from "@/modules/admin/components/ui/AdminSkeletons";
import { useQueryService } from "@/utils/hooks/useQueryService";

const STATUS_TONE: Record<string, PillTone> = {
  published: "success",
  scheduled: "indigo",
  in_review: "brand",
  draft: "warning",
  archived: "neutral",
};

const STATUS_LABEL: Record<string, string> = {
  published: "Published",
  scheduled: "Scheduled",
  in_review: "In review",
  draft: "Draft",
  archived: "Archived",
};

export function AnalyticsPage() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const { data, isLoading } = useQueryService<Record<string, never>, AnalyticsData>({
    service: { path: "/api/admin/analytics", method: ApiMethods.GET },
    options: { keys: ["admin", "analytics"] },
  });

  const totalViews = data?.totalViews ?? 0;
  const statusEntries = Object.entries(data?.statusBreakdown ?? {});
  const topArticles = data?.topArticles ?? [];

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Analytics"
        subtitle="Publishing health, reach, and top-performing content."
        action={
          gaId ? (
            <a href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer">
              <AdminButton
                variant="secondary"
                leftIcon={<LaunchRounded sx={{ fontSize: 16 }} />}
              >
                Open GA4
              </AdminButton>
            </a>
          ) : null
        }
      />

      {/* Stat tiles */}
      <div className="grid gap-4 sm:grid-cols-2">
        <StatTile
          label="Total views"
          value={formatCompact(totalViews)}
          accent="info"
          Icon={VisibilityOutlined}
          sub="Across all published articles"
        />
        <StatTile
          label="Articles tracked"
          value={formatCompact(topArticles.length)}
          accent="brand"
          Icon={ArticleOutlined}
          sub="In this leaderboard"
        />
      </div>

      {/* Status breakdown */}
      <AdminPanel title="Status breakdown">
        {isLoading ? (
          <div className="p-5">
            <ListSkeleton rows={2} />
          </div>
        ) : statusEntries.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-soft">
            No articles yet.
          </div>
        ) : (
          <div className="flex flex-wrap gap-3 px-5 py-4">
            {statusEntries.map(([status, count]) => (
              <div
                key={status}
                className="flex items-center gap-2 rounded-lg border border-border bg-surface-alt px-3 py-2"
              >
                <Pill tone={STATUS_TONE[status] ?? "neutral"}>
                  {STATUS_LABEL[status] ?? status}
                </Pill>
                <span className="font-headline text-lg font-bold text-ink">
                  {count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </AdminPanel>

      {/* Top articles */}
      <AdminPanel title="Top articles by views">
        {isLoading ? (
          <TableSkeleton rows={6} cols={2} />
        ) : topArticles.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-muted-soft">
            No view data yet — articles will appear here once readers arrive.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-border-soft text-left text-[0.6875rem] uppercase tracking-[0.08em] text-muted-soft">
                  <th className="px-5 py-3 font-semibold">#</th>
                  <th className="px-2 py-3 font-semibold">Title</th>
                  <th className="px-5 py-3 text-right font-semibold">Views</th>
                </tr>
              </thead>
              <tbody>
                {topArticles.map((row, i) => (
                  <tr key={row.id} className="border-b border-border-soft last:border-0">
                    <td className="px-5 py-3 text-muted-soft">{i + 1}</td>
                    <td className="px-2 py-3 font-medium text-ink">
                      <span className="line-clamp-1">{row.title}</span>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-ink-secondary">
                      {row.viewCount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>
    </div>
  );
}
