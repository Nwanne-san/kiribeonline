"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import EditRounded from "@mui/icons-material/EditRounded";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ApiMethods } from "../../../../../types/service";
import {
  AdminButton,
  AdminPageHeader,
  AdminPanel,
  Pill,
} from "@/modules/admin/components/ui/AdminPrimitives";
import { AdminConfirmDialog } from "@/modules/admin/components/ui/AdminDialog";
import { TableSkeleton } from "@/modules/admin/components/ui/AdminSkeletons";
import { AdminRoutes, adminRoute } from "@/routes/admin.routes";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { useMutationService } from "@/utils/hooks/useMutationService";

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

  const [pendingDelete, setPendingDelete] = useState<ReelRow | null>(null);

  const deleteReel = useMutationService<{ id: string }>({
    service: (vars) => ({
      path: `/api/admin/reels/${vars.id}`,
      method: ApiMethods.DELETE,
    }),
    options: {
      invalidateKeys: ["admin", "reels"],
      successMessage: "Reel deleted.",
      onSuccess: () => setPendingDelete(null),
    },
  });

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Reels"
        subtitle={`${reels.length} short-form ${reels.length === 1 ? "video" : "videos"} in the library`}
        action={
          <AdminButton
            onClick={() => router.push(AdminRoutes.reelNew)}
            leftIcon={<AddRounded sx={{ fontSize: 16 }} />}
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
                      <div className="flex items-center justify-end gap-2">
                        <AdminButton
                          variant="secondary"
                          size="sm"
                          leftIcon={<EditRounded sx={{ fontSize: 14 }} />}
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(
                              adminRoute(AdminRoutes.reelEdit, { id: String(reel.id) })
                            );
                          }}
                        >
                          Edit
                        </AdminButton>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingDelete(reel);
                          }}
                          aria-label={`Delete reel ${reel.title}`}
                          className="grid h-8 w-8 place-items-center rounded-none text-muted-soft transition-colors hover:bg-[#fee4e2] hover:text-[#b42318] disabled:opacity-50"
                          disabled={deleteReel.isPending}
                        >
                          <DeleteOutlineRounded sx={{ fontSize: 16 }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>

      <AdminConfirmDialog
        open={pendingDelete !== null}
        title="Delete reel?"
        description={
          pendingDelete ? (
            <>
              <p>
                Delete <strong>{pendingDelete.title}</strong>?
              </p>
              <p className="mt-2 text-sm text-muted">
                The reel is removed from the public site immediately. The
                source video stays on its original platform —
                {" "}
                {PLATFORM_LABEL[pendingDelete.platform] ?? pendingDelete.platform}
                {" "}
                — and is unaffected.
              </p>
            </>
          ) : null
        }
        confirmLabel="Delete reel"
        tone="danger"
        isPending={deleteReel.isPending}
        onConfirm={() => {
          if (pendingDelete) deleteReel.mutate({ id: pendingDelete.id });
        }}
        onCancel={() => !deleteReel.isPending && setPendingDelete(null)}
      />
    </div>
  );
}
