"use client";

import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import HistoryEduOutlined from "@mui/icons-material/HistoryEduOutlined";
import RefreshOutlined from "@mui/icons-material/RefreshOutlined";
import UndoOutlined from "@mui/icons-material/UndoOutlined";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { ApiMethods } from "../../../../../types/service";
import {
  AdminButton,
  AdminPageHeader,
  AdminPanel,
  InitialAvatar,
  Pill,
} from "@/modules/admin/components/ui/AdminPrimitives";
import { ListSkeleton } from "@/modules/admin/components/ui/AdminSkeletons";
import { AdminRoutes, adminRoute } from "@/routes/admin.routes";
import { useKiribeToast } from "@/modules/shared/components/feedback/KiribeSnackbar";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { useQueryClient } from "@tanstack/react-query";
import { usePermissions } from "@/modules/admin/hooks/usePermissions";
import client from "@/utils/client";

type ReviewArticle = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  status: string;
  updatedAt: string;
  categories?: { id: string; name: string }[];
  author?: { id: string; name?: string | null; email?: string } | null;
};

type ReviewListResult = {
  docs: ReviewArticle[];
  totalDocs: number;
};

/** Short relative timestamp; matches the audit list voice. */
function relativeTime(iso: string): string {
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

function bylineName(author: ReviewArticle["author"]): string {
  if (!author) return "Unassigned";
  if (author.name?.trim()) return author.name.trim();
  if (author.email) return author.email.split("@")[0];
  return "Unknown";
}

/**
 * Dedicated approvals queue. Editors and admins see every article waiting for
 * review with a one-click Approve (→ published) or Send back to draft. Writers
 * and contributors land here on their own submissions only so they can chase
 * their own review queue without seeing everyone else's.
 */
export function InReviewPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { can, me } = usePermissions();
  const { showToast } = useKiribeToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  const canPublish = can("articles:publish");

  // Non-editors only see submissions where they're the author. Enforced by the
  // ownership access layer on the API — the query param here is a hint so the
  // UI copy makes sense; the server would filter anyway.
  const authorFilter = canPublish ? "" : me?.id ? `&authorId=${me.id}` : "";

  const { data, isLoading, refetch } = useQueryService<
    Record<string, never>,
    ReviewListResult
  >({
    service: {
      path: `/api/admin/articles?status=in_review&limit=200&sort=oldest${authorFilter}`,
      method: ApiMethods.GET,
    },
    options: {
      keys: ["admin", "review", authorFilter],
      keepPreviousData: true,
    },
  });

  const articles = useMemo(() => data?.docs ?? [], [data?.docs]);

  const runAction = useCallback(
    async (id: string, action: "approve" | "reject") => {
      setBusyId(id);
      try {
        const payload = action === "approve" ? { status: "published" } : { status: "draft" };
        await client.request({
          path: `/api/admin/articles/${id}`,
          method: ApiMethods.PATCH,
          data: payload,
        });
        showToast({
          message: action === "approve" ? "Article approved and published" : "Sent back to draft",
          severity: "success",
        });
        queryClient.invalidateQueries({ queryKey: ["admin", "review"] });
        queryClient.invalidateQueries({ queryKey: ["admin", "articles"] });
        queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      } catch (error) {
        const err = error as { message?: string };
        showToast({
          message: action === "approve" ? "Approve failed" : "Send-back failed",
          description: err?.message ?? "Please try again.",
          severity: "error",
        });
      } finally {
        setBusyId(null);
      }
    },
    [queryClient, showToast]
  );

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="In Review"
        subtitle={
          canPublish
            ? "Every article waiting for editorial approval. Oldest submissions first."
            : "Your submissions waiting for editorial review."
        }
        action={
          <AdminButton
            variant="secondary"
            leftIcon={<RefreshOutlined sx={{ fontSize: 16 }} />}
            onClick={() => void refetch()}
          >
            Refresh
          </AdminButton>
        }
      />

      <AdminPanel bodyClassName={isLoading ? "" : "divide-y divide-border-soft"}>
        {isLoading && <ListSkeleton rows={6} />}
        {!isLoading && articles.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
            <HistoryEduOutlined sx={{ fontSize: 40 }} className="text-muted-soft" />
            <p className="text-sm text-muted-soft">
              {canPublish
                ? "No articles are waiting for review right now."
                : "You have no submissions in review."}
            </p>
          </div>
        )}
        {!isLoading &&
          articles.map((article) => {
            const author = bylineName(article.author);
            const isBusy = busyId === article.id;
            const primaryCategory = article.categories?.[0]?.name;
            return (
              <div key={article.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                <InitialAvatar name={author} className="h-10 w-10 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={adminRoute(AdminRoutes.articleEdit, { id: article.id })}
                      className="truncate text-sm font-semibold text-ink hover:underline"
                    >
                      {article.title}
                    </a>
                    <Pill tone="brand">In review</Pill>
                    {primaryCategory ? <Pill tone="neutral">{primaryCategory}</Pill> : null}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-soft">
                    {article.excerpt || "No excerpt yet — the standfirst is what readers see on cards."}
                  </p>
                  <div className="mt-1 text-[0.6875rem] uppercase tracking-wide text-muted-soft">
                    Submitted by {author} · {relativeTime(article.updatedAt)}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                  <AdminButton
                    size="sm"
                    variant="secondary"
                    leftIcon={<EditOutlined sx={{ fontSize: 16 }} />}
                    onClick={() =>
                      router.push(adminRoute(AdminRoutes.articleEdit, { id: article.id }))
                    }
                  >
                    Open
                  </AdminButton>
                  {canPublish && (
                    <>
                      <AdminButton
                        size="sm"
                        variant="ghost"
                        leftIcon={<UndoOutlined sx={{ fontSize: 16 }} />}
                        disabled={isBusy}
                        onClick={() => void runAction(article.id, "reject")}
                      >
                        Send back
                      </AdminButton>
                      <AdminButton
                        size="sm"
                        leftIcon={<CheckCircleOutlined sx={{ fontSize: 16 }} />}
                        disabled={isBusy}
                        onClick={() => void runAction(article.id, "approve")}
                      >
                        {isBusy ? "Working…" : "Approve"}
                      </AdminButton>
                    </>
                  )}
                </div>
              </div>
            );
          })}
      </AdminPanel>
    </div>
  );
}
