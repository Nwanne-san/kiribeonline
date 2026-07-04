"use client";

import Stack from "@mui/material/Stack";
import { useRef } from "react";
import { ApiMethods } from "../../../../../types/service";
import { KiribeButton, KiribeTypography } from "@/modules/shared/components/ui";
import { useQueryService } from "@/utils/hooks/useQueryService";
import client from "@/utils/client";

type Media = { id: string; filename?: string; alt?: string };

export function MediaLibraryPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { data, refetch } = useQueryService<Record<string, never>, { docs: Media[] }>({
    service: { path: "/api/admin/media", method: ApiMethods.GET },
    options: { keys: ["admin", "media"] },
  });

  const onUpload = async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    form.append("alt", file.name.replace(/\.[^.]+$/, ""));
    await client.request({
      path: "/api/admin/media",
      method: ApiMethods.POST,
      data: form,
      headers: { "Content-Type": "multipart/form-data" },
    });
    await refetch();
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <KiribeTypography variant="h4">Media library</KiribeTypography>
        <KiribeButton onClick={() => inputRef.current?.click()}>Upload</KiribeButton>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onUpload(file);
          }}
        />
      </Stack>
      <Stack direction="row" flexWrap="wrap" gap={2}>
        {(data?.docs ?? []).map((item) => (
          <Stack key={item.id} sx={{ width: 160 }}>
            <KiribeTypography variant="caption">{item.alt ?? item.filename ?? item.id}</KiribeTypography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
