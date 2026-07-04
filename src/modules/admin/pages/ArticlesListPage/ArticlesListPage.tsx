"use client";

import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiMethods } from "../../../../../types/service";
import {
  AdminCard,
  AdminCategoryBadge,
  AdminPageHeader,
  AdminStatusBadge,
} from "@/modules/admin/components/AdminUi";
import { AdminRoutes, adminRoute } from "@/routes/admin.routes";
import { KiribeButton, KiribeTextField, KiribeTypography } from "@/modules/shared/components/ui";
import { useQueryService } from "@/utils/hooks/useQueryService";

type ArticleRow = {
  id: string;
  title: string;
  status: string;
  viewCount?: number;
  categories?: Array<{ name: string; brandColor?: string }>;
};

type ListResponse = { docs: ArticleRow[] };

export function ArticlesListPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const queryPath = `/api/admin/articles${status ? `?status=${status}` : ""}`;
  const { data, isLoading } = useQueryService<Record<string, never>, ListResponse>({
    service: { path: queryPath, method: ApiMethods.GET },
    options: { keys: ["admin", "articles", status] },
  });

  const filtered = (data?.docs ?? []).filter((a) =>
    !search.trim() ? true : a.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <AdminPageHeader
        title="Articles"
        action={<KiribeButton onClick={() => router.push(AdminRoutes.articleNew)}>New article</KiribeButton>}
      />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 2 }}>
        <KiribeTextField
          placeholder="Search articles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ maxWidth: 320 }}
        />
        <KiribeTextField
          select
          SelectProps={{ native: true }}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          sx={{ maxWidth: 180 }}
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="scheduled">Scheduled</option>
          <option value="archived">Archived</option>
        </KiribeTextField>
      </Stack>
      {isLoading ? (
        <KiribeTypography>Loading...</KiribeTypography>
      ) : (
        <AdminCard sx={{ overflow: "hidden" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Views</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((article) => {
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
                    <TableCell>{article.viewCount ?? 0}</TableCell>
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
      )}
    </>
  );
}
