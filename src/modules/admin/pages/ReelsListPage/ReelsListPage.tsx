"use client";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { useRouter } from "next/navigation";
import { ApiMethods } from "../../../../../types/service";
import { AdminCard, AdminPageHeader } from "@/modules/admin/components/AdminUi";
import { AdminRoutes, adminRoute } from "@/routes/admin.routes";
import { KiribeButton, KiribeTypography } from "@/modules/shared/components/ui";
import { useQueryService } from "@/utils/hooks/useQueryService";

type ReelRow = { id: string; title: string; platform: string; published?: boolean };

export function ReelsListPage() {
  const router = useRouter();
  const { data, isLoading } = useQueryService<Record<string, never>, { docs: ReelRow[] }>({
    service: { path: "/api/admin/reels", method: ApiMethods.GET },
    options: { keys: ["admin", "reels"] },
  });

  return (
    <>
      <AdminPageHeader
        title="Reels"
        action={<KiribeButton onClick={() => router.push(AdminRoutes.reelNew)}>New reel</KiribeButton>}
      />
      {isLoading ? (
        <KiribeTypography>Loading...</KiribeTypography>
      ) : (
        <AdminCard sx={{ overflow: "hidden" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Platform</TableCell>
                <TableCell>Published</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {(data?.docs ?? []).map((reel) => (
                <TableRow key={reel.id}>
                  <TableCell>{reel.title}</TableCell>
                  <TableCell>{reel.platform}</TableCell>
                  <TableCell>{reel.published ? "Yes" : "No"}</TableCell>
                  <TableCell align="right">
                    <KiribeButton
                      size="small"
                      onClick={() =>
                        router.push(adminRoute(AdminRoutes.reelEdit, { id: String(reel.id) }))
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
