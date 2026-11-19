"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import EditRounded from "@mui/icons-material/EditRounded";
import StarRounded from "@mui/icons-material/StarRounded";
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

type CreatorRow = {
  id: string;
  name: string;
  role: string;
  featuredOnHomepage?: boolean;
};

export function CreatorsListPage() {
  const router = useRouter();
  const { data, isLoading } = useQueryService<Record<string, never>, { docs: CreatorRow[] }>({
    service: { path: "/api/admin/creators", method: ApiMethods.GET },
    options: { keys: ["admin", "creators"] },
  });

  const [pendingDelete, setPendingDelete] = useState<CreatorRow | null>(null);

  const deleteCreator = useMutationService<{ id: string }>({
    // Body carries `{ id }`; the service builder strips it into the URL.
    service: (vars) => ({
      path: `/api/admin/creators/${vars.id}`,
      method: ApiMethods.DELETE,
    }),
    options: {
      invalidateKeys: ["admin", "creators"],
      successMessage: "Creator deleted.",
      onSuccess: () => setPendingDelete(null),
    },
  });

  const creators = data?.docs ?? [];
  const featuredCount = creators.filter((c) => c.featuredOnHomepage).length;

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Creators"
        subtitle={`${creators.length} profile${creators.length === 1 ? "" : "s"} · ${featuredCount} featured on homepage`}
        action={
          <AdminButton
            onClick={() => router.push(AdminRoutes.creatorNew)}
            leftIcon={<AddRounded sx={{ fontSize: 16 }} />}
          >
            New creator
          </AdminButton>
        }
      />

      <AdminPanel>
        {isLoading ? (
          <TableSkeleton rows={6} cols={4} />
        ) : creators.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-muted-soft">
            No creators yet. Add directors, actors, and interviewees to power the Spotlight.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border-soft text-left text-[0.6875rem] uppercase tracking-[0.08em] text-muted-soft">
                  <th className="px-5 py-3 font-semibold">Name</th>
                  <th className="px-2 py-3 font-semibold">Role</th>
                  <th className="px-2 py-3 font-semibold">Homepage</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {creators.map((creator) => (
                  <tr
                    key={creator.id}
                    onClick={() =>
                      router.push(adminRoute(AdminRoutes.creatorEdit, { id: String(creator.id) }))
                    }
                    className="cursor-pointer border-b border-border-soft transition-colors last:border-0 hover:bg-surface-alt"
                  >
                    <td className="px-5 py-3 font-medium text-ink">{creator.name}</td>
                    <td className="px-2 py-3 text-ink-secondary">{creator.role || "—"}</td>
                    <td className="px-2 py-3">
                      {creator.featuredOnHomepage ? (
                        <Pill tone="brand">
                          <StarRounded sx={{ fontSize: 12, mr: 0.5 }} />
                          Featured
                        </Pill>
                      ) : (
                        <Pill tone="neutral">Not featured</Pill>
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
                              adminRoute(AdminRoutes.creatorEdit, { id: String(creator.id) })
                            );
                          }}
                        >
                          Edit
                        </AdminButton>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPendingDelete(creator);
                          }}
                          aria-label={`Delete creator ${creator.name}`}
                          className="grid h-8 w-8 place-items-center rounded-none text-muted-soft transition-colors hover:bg-[#fee4e2] hover:text-[#b42318] disabled:opacity-50"
                          disabled={deleteCreator.isPending}
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
        title="Delete creator?"
        description={
          pendingDelete ? (
            <>
              <p>
                Delete <strong>{pendingDelete.name}</strong>?
              </p>
              <p className="mt-2 text-sm text-muted">
                This removes the profile and their portrait relationship. Any
                reels credited to them keep their byline text, and the homepage
                Spotlight will drop this card on next save.
              </p>
            </>
          ) : null
        }
        confirmLabel="Delete creator"
        tone="danger"
        isPending={deleteCreator.isPending}
        onConfirm={() => {
          if (pendingDelete) deleteCreator.mutate({ id: pendingDelete.id });
        }}
        onCancel={() => !deleteCreator.isPending && setPendingDelete(null)}
      />
    </div>
  );
}
