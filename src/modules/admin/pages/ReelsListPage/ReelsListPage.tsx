"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import EditRounded from "@mui/icons-material/EditRounded";
import { useRouter } from "next/navigation";
import { ApiMethods } from "../../../../../types/service";
import {
  AdminButton,
  AdminPageHeader,
  AdminPanel,
  Pill,
} from "@/modules/admin/components/ui/AdminPrimitives";
import { TableSkeleton } from "@/modules/admin/components/ui/AdminSkeletons";
import { AdminRoutes, adminRoute } from "@/routes/admin.routes";
import { useQueryService } from "@/utils/hooks/useQueryService";

type ReelRow = { id: string; title: string; platform: string; published?: boolean };

const PLATFORM_LABEL: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
};

export function ReelsListPage() {
  const router = useRouter();
  const { data, isLoading } = useQueryService<Record<string, never>, { docs: ReelRow[] }>({
    service: { path: "/api/admin/reels", method: ApiMethods.GET },
    options: { keys: ["admin", "reels"] },
  });

  const reels = data?.docs ?? [];

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Reels"
        subtitle={`${reels.length} short-form ${reels.length === 1 ? "video" : "videos"} in the library`}
        action={
          <AdminButton
            onClick={() => router.push(AdminRoutes.reelNew)}
            leftIcon={<AddRounded className="text-[16px]" />}
          >
            New reel
          </AdminButton>
        }
      />

      <AdminPanel>
        {isLoading ? (
          <TableSkeleton rows={6} cols={4} />
        ) : reels.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-muted-soft">
            No reels yet. Paste an Instagram, TikTok, or YouTube URL to add one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border-soft text-left text-[0.6875rem] uppercase tracking-[0.08em] text-muted-soft">
                  <th className="px-5 py-3 font-semibold">Title</th>
                  <th className="px-2 py-3 font-semibold">Platform</th>
                  <th className="px-2 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reels.map((reel) => (
                  <tr
                    key={reel.id}
                    onClick={() =>
                      router.push(adminRoute(AdminRoutes.reelEdit, { id: String(reel.id) }))
                    }
                    className="cursor-pointer border-b border-border-soft transition-colors last:border-0 hover:bg-surface-alt"
                  >
                    <td className="px-5 py-3 font-medium text-ink">
                      <span className="line-clamp-1">{reel.title}</span>
                    </td>
                    <td className="px-2 py-3 text-ink-secondary">
                      {PLATFORM_LABEL[reel.platform] ?? reel.platform}
                    </td>
                    <td className="px-2 py-3">
                      {reel.published ? (
                        <Pill tone="success">Published</Pill>
                      ) : (
                        <Pill tone="warning">Draft</Pill>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <AdminButton
                        variant="secondary"
                        size="sm"
                        leftIcon={<EditRounded className="text-[14px]" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(
                            adminRoute(AdminRoutes.reelEdit, { id: String(reel.id) })
                          );
                        }}
                      >
                        Edit
                      </AdminButton>
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
