"use client";

import LockIcon from "@mui/icons-material/Lock";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { useState } from "react";
import { ApiMethods } from "../../../../../types/service";
import {
  AdminCard,
  AdminFieldLabel,
  AdminPageHeader,
} from "@/modules/admin/components/AdminUi";
import { KiribeButton, KiribeTextField, KiribeTypography } from "@/modules/shared/components/ui";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useQueryService } from "@/utils/hooks/useQueryService";

type TaxonomyRow = {
  id: string;
  name: string;
  slug: string;
  brandColor?: string;
  isSystem?: boolean;
};

function TaxonomyPage({
  title,
  listPath,
  createPath,
  fieldLabel,
}: {
  title: string;
  listPath: string;
  createPath: string;
  fieldLabel: string;
}) {
  const [name, setName] = useState("");
  const [brandColor, setBrandColor] = useState("#6B1D2A");

  const { data, isLoading, refetch } = useQueryService<Record<string, never>, { docs: TaxonomyRow[] }>({
    service: { path: listPath, method: ApiMethods.GET },
    options: { keys: ["admin", listPath] },
  });

  const { mutate, isPending } = useMutationService({
    service: (payload: { name: string; brandColor?: string }) => ({
      path: createPath,
      method: ApiMethods.POST,
      data: payload,
    }),
    options: {
      keys: ["admin", createPath],
      onSuccess: () => {
        setName("");
        void refetch();
      },
    },
  });

  return (
    <>
      <AdminPageHeader title={title} />
      <Stack direction={{ xs: "column", lg: "row" }} spacing={3}>
        <AdminCard sx={{ p: 3, width: { lg: 360 } }}>
          <Stack spacing={2}>
            <Box>
              <AdminFieldLabel label={fieldLabel} required />
              <KiribeTextField fullWidth value={name} onChange={(e) => setName(e.target.value)} />
            </Box>
            <Box>
              <AdminFieldLabel label="Brand color" />
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  component="input"
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  sx={{ width: 48, height: 36, border: "1px solid", borderColor: "divider", borderRadius: 0.5, p: 0 }}
                />
                <KiribeTextField fullWidth value={brandColor} onChange={(e) => setBrandColor(e.target.value)} />
              </Stack>
            </Box>
            <KiribeButton
              onClick={() => mutate({ name: name.trim(), brandColor })}
              disabled={isPending || !name.trim()}
            >
              Create
            </KiribeButton>
          </Stack>
        </AdminCard>

        <AdminCard sx={{ flex: 1, overflow: "hidden" }}>
          {isLoading ? (
            <KiribeTypography sx={{ p: 2 }}>Loading...</KiribeTypography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Color</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Slug</TableCell>
                  <TableCell>System</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(data?.docs ?? []).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Box sx={{ width: 20, height: 20, borderRadius: 0.5, bgcolor: row.brandColor ?? "#6B1D2A" }} />
                    </TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.slug}</TableCell>
                    <TableCell>{row.isSystem ? <LockIcon fontSize="small" /> : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </AdminCard>
      </Stack>
    </>
  );
}

export function CategoriesAdminPage() {
  return (
    <TaxonomyPage
      title="Categories"
      listPath="/api/admin/categories"
      createPath="/api/admin/categories"
      fieldLabel="Category name"
    />
  );
}

export function TagsAdminPage() {
  return (
    <TaxonomyPage
      title="Tags"
      listPath="/api/admin/tags"
      createPath="/api/admin/tags"
      fieldLabel="Tag name"
    />
  );
}
