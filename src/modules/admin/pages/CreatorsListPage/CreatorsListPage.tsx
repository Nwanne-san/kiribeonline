"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import EditRounded from "@mui/icons-material/EditRounded";
import StarRounded from "@mui/icons-material/StarRounded";
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
