"use client";

import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { useRouter } from "next/navigation";
import { ApiMethods } from "../../../../../types/service";
import {
  AdminCard,
  AdminCategoryBadge,
  AdminPageHeader,
  AdminStatCard,
  AdminStatusBadge,
} from "@/modules/admin/components/AdminUi";
import { AdminRoutes, adminRoute } from "@/routes/admin.routes";
import { KiribeButton, KiribeTypography } from "@/modules/shared/components/ui";
import { useQueryService } from "@/utils/hooks/useQueryService";

type DashboardStats = {
  published: number;
  draft: number;
  scheduled: number;
  media: number;
};

type ArticleRow = {
  id: string;
  title: string;
  status: string;
  categories?: Array<{ name: string; brandColor?: string }>;
};

export function AdminDashboardPage() {
  const router = useRouter();
  const { data } = useQueryService<Record<string, never>, DashboardStats>({
    service: { path: "/api/admin/dashboard", method: ApiMethods.GET },
    options: { keys: ["admin", "dashboard"] },
  });

  const { data: articles } = useQueryService<Record<string, never>, { docs: ArticleRow[] }>({
    service: { path: "/api/admin/articles?limit=5", method: ApiMethods.GET },
    options: { keys: ["admin", "articles", "recent"] },
  });

  const stats = [
    { label: "Published", value: data?.published ?? 0 },
    { label: "Drafts", value: data?.draft ?? 0 },
    { label: "Scheduled", value: data?.scheduled ?? 0 },
    { label: "Media", value: data?.media ?? 0 },
  ];

  return (
    <Stack spacing={3}>
      <AdminPageHeader title="Dashboard" />
      <Grid container spacing={2}>
        {stats.map((stat) => (
          <Grid key={stat.label} size={{ xs: 6, md: 3 }}>
            <AdminStatCard label={stat.label} value={stat.value} />
          </Grid>
        ))}
      </Grid>
      <Stack direction="row" spacing={2} flexWrap="wrap">
        <KiribeButton onClick={() => router.push(AdminRoutes.articleNew)}>New article</KiribeButton>
        <KiribeButton variant="outlined" onClick={() => router.push(AdminRoutes.homepage)}>
          Homepage builder
        </KiribeButton>
        <KiribeButton variant="outlined" onClick={() => router.push(AdminRoutes.media)}>
          Media library
        </KiribeButton>
      </Stack>
      <AdminCard sx={{ overflow: "hidden" }}>
        <KiribeTypography variant="h6" sx={{ p: 2, pb: 0 }}>
          Recent articles
        </KiribeTypography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Status</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {(articles?.docs ?? []).slice(0, 5).map((article) => {
              const cat = article.categories?.[0];
              return (
                <TableRow key={article.id}>
                  <TableCell>{article.title}</TableCell>
                  <TableCell>
                    {cat ? <AdminCategoryBadge label={cat.name} color={cat.brandColor} /> : "—"}
                  </TableCell>
                  <TableCell>
                    <AdminStatusBadge status={article.status as "draft" | "published" | "scheduled" | "archived"} />
                  </TableCell>
                  <TableCell align="right">
                    <KiribeButton
                      size="small"
                      onClick={() =>
                        router.push(adminRoute(AdminRoutes.articleEdit, { id: String(article.id) }))
                      }
                    >
                      Edit
                    </KiribeButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </AdminCard>
    </Stack>
  );
}
