"use client";

import HomeOutlined from "@mui/icons-material/HomeOutlined";
import SaveRounded from "@mui/icons-material/SaveRounded";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiMethods } from "../../../../../types/service";
import {
  AdminButton,
  AdminField,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
  AdminTextarea,
  formatCompact,
} from "@/modules/admin/components/ui/AdminPrimitives";
import { PanelListSkeleton, TableSkeleton } from "@/modules/admin/components/ui/AdminSkeletons";
import { MediaPicker } from "@/modules/admin/components/MediaPicker";
import {
  toMediaRef,
  useSaveSiteSettings,
  useSiteSettings,
} from "@/modules/admin/hooks/useSiteSettings";
import { usePermissions } from "@/modules/admin/hooks/usePermissions";
import { AdminRoutes } from "@/routes/admin.routes";
import type { AdminMediaRef, AnalyticsData } from "@/server/modules";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { useKiribeToast } from "@/modules/shared/components/feedback/KiribeSnackbar";

export function SeoAdminPage() {
  const { can } = usePermissions();
  const canManage = can("settings:manage");
  const { showToast } = useKiribeToast();

  const { data, isLoading } = useSiteSettings();
  const { mutate, isPending } = useSaveSiteSettings("SEO defaults saved");

  const { data: analytics, isLoading: analyticsLoading } = useQueryService<
    Record<string, never>,
    AnalyticsData
  >({
    service: { path: "/api/admin/analytics", method: ApiMethods.GET },
    options: { keys: ["admin", "analytics"] },
  });

  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [ogImage, setOgImage] = useState<AdminMediaRef | null>(null);

  useEffect(() => {
    if (!data) return;
    setSeoTitle(data.seoDefaults?.title ?? "");
    setSeoDescription(data.seoDefaults?.description ?? "");
    setOgImage(toMediaRef(data.seoDefaults?.ogImage ?? null));
  }, [data]);

  const save = () => {
    if (!canManage) return;
    mutate({
      seoDefaults: {
        title: seoTitle.trim(),
        description: seoDescription.trim(),
        ogImageId: ogImage ? String(ogImage.id) : null,
      },
    });
  };

  const topArticles = analytics?.topArticles ?? [];

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="SEO"
        subtitle="Site-wide defaults and content performance. Per-article SEO lives in the article editor."
        action={
          canManage ? (
            <AdminButton
              onClick={save}
              disabled={isPending || isLoading}
              leftIcon={<SaveRounded className="text-[16px]" />}
            >
              {isPending ? "Saving..." : "Save defaults"}
            </AdminButton>
          ) : null
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <AdminPanel title="Site SEO defaults">
          {isLoading ? (
            <div className="p-5">
              <PanelListSkeleton rows={4} />
            </div>
          ) : (
            <div className="space-y-4 p-5">
              <AdminField
                label="Default SEO title"
                htmlFor="seo-title"
                hint="Fallback browser / search title when a page has none."
              >
                <AdminInput
                  id="seo-title"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  disabled={!canManage}
                  maxLength={120}
                />
              </AdminField>
              <AdminField
                label="Default SEO description"
                htmlFor="seo-description"
                hint="Fallback meta description for pages without one."
              >
                <AdminTextarea
                  id="seo-description"
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  disabled={!canManage}
                  rows={3}
                  maxLength={300}
                />
              </AdminField>
              <MediaPicker
                label="Default OG image"
                value={ogImage}
                onChange={setOgImage}
                helperText="Used on social shares when an article has no OG image."
              />
            </div>
          )}
        </AdminPanel>

        <AdminPanel
          title="Homepage modules"
          action={
            <Link
              href={AdminRoutes.homepage}
              className="inline-flex items-center gap-1 font-headline text-[0.65rem] font-semibold uppercase tracking-widest text-admin-primary hover:text-admin-accent"
            >
              <HomeOutlined className="text-[14px]" />
              Open builder
            </Link>
          }
        >
          <div className="space-y-3 p-5 text-sm text-muted">
            <p>
              Homepage section order and module content are managed in the Homepage
              builder — not duplicated here.
            </p>
            <AdminButton
              variant="secondary"
              size="sm"
              onClick={() =>
                showToast({
                  message: "Not available yet",
                  description: "Branding and typography editors land in a later pass.",
                  severity: "info",
                })
              }
            >
              Branding / Typography
            </AdminButton>
          </div>
        </AdminPanel>
      </div>

      <AdminPanel title="Top articles by views">
        {analyticsLoading ? (
          <div className="p-5">
            <TableSkeleton rows={5} />
          </div>
        ) : topArticles.length === 0 ? (
          <p className="p-5 text-sm text-muted">No view data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border font-headline text-[0.65rem] uppercase tracking-widest text-muted">
                  <th className="px-5 py-3 font-semibold">Title</th>
                  <th className="px-5 py-3 font-semibold">Views</th>
                </tr>
              </thead>
              <tbody>
                {topArticles.slice(0, 8).map((article) => (
                  <tr key={article.id} className="border-b border-border-soft hover:bg-surface-muted">
                    <td className="px-5 py-3 text-ink">{article.title}</td>
                    <td className="px-5 py-3 text-muted">
                      {formatCompact(article.viewCount ?? 0)}
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
