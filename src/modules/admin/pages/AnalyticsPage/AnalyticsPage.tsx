"use client";

import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Link from "next/link";
import { ApiMethods } from "../../../../../types/service";
import type { AnalyticsData } from "@/server/modules";
import { KiribeTypography } from "@/modules/shared/components/ui";
import { useQueryService } from "@/utils/hooks/useQueryService";

export function AnalyticsPage() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const { data, isLoading } = useQueryService<Record<string, never>, AnalyticsData>({
    service: { path: "/api/admin/analytics", method: ApiMethods.GET },
    options: { keys: ["admin", "analytics"] },
  });

  return (
    <Stack spacing={3}>
      <KiribeTypography variant="h4">Analytics</KiribeTypography>
      {gaId ? (
        <Link href="https://analytics.google.com/" target="_blank" rel="noopener noreferrer">
          Open GA4 console
        </Link>
      ) : null}
      {isLoading ? (
        <KiribeTypography>Loading...</KiribeTypography>
      ) : (
        <>
          <KiribeTypography variant="body1">Total views: {data?.totalViews ?? 0}</KiribeTypography>
          <KiribeTypography variant="h6">Status counts</KiribeTypography>
          <Stack direction="row" gap={2} flexWrap="wrap">
            {Object.entries(data?.statusBreakdown ?? {}).map(([status, count]) => (
              <KiribeTypography key={status}>
                {status}: {count}
              </KiribeTypography>
            ))}
          </Stack>
          <KiribeTypography variant="h6">Top articles</KiribeTypography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Views</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(data?.topArticles ?? []).map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.title}</TableCell>
                  <TableCell>{row.viewCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </Stack>
  );
}
