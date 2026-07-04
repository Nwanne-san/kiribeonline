"use client";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { useRouter } from "next/navigation";
import { ApiMethods } from "../../../../../types/service";
import {
  AdminCard,
  AdminPageHeader,
} from "@/modules/admin/components/AdminUi";
import { AdminRoutes, adminRoute } from "@/routes/admin.routes";
import { KiribeButton, KiribeTypography } from "@/modules/shared/components/ui";
import { useQueryService } from "@/utils/hooks/useQueryService";

type CreatorRow = { id: string; name: string; role: string; featuredOnHomepage?: boolean };

export function CreatorsListPage() {
  const router = useRouter();
  const { data, isLoading } = useQueryService<Record<string, never>, { docs: CreatorRow[] }>({
    service: { path: "/api/admin/creators", method: ApiMethods.GET },
    options: { keys: ["admin", "creators"] },
  });

  return (
    <>
      <AdminPageHeader
        title="Creators"
        action={<KiribeButton onClick={() => router.push(AdminRoutes.creatorNew)}>New creator</KiribeButton>}
      />
      {isLoading ? (
        <KiribeTypography>Loading...</KiribeTypography>
      ) : (
        <AdminCard sx={{ overflow: "hidden" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Featured</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {(data?.docs ?? []).map((creator) => (
                <TableRow key={creator.id}>
                  <TableCell>{creator.name}</TableCell>
                  <TableCell>{creator.role}</TableCell>
                  <TableCell>{creator.featuredOnHomepage ? "Yes" : "No"}</TableCell>
                  <TableCell align="right">
                    <KiribeButton
                      size="small"
                      onClick={() =>
                        router.push(adminRoute(AdminRoutes.creatorEdit, { id: String(creator.id) }))
                      }
                    >
                      Edit
                    </KiribeButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AdminCard>
      )}
    </>
  );
}
