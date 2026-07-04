"use client";

import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiMethods } from "../../../../../types/service";
import {
  AdminCard,
  AdminFieldLabel,
  AdminPageHeader,
} from "@/modules/admin/components/AdminUi";
import { MediaPicker } from "@/modules/admin/components/MediaPicker";
import type { AdminMediaRef } from "@/lib/admin/types";
import { AdminRoutes } from "@/routes/admin.routes";
import { KiribeButton, KiribeTextField } from "@/modules/shared/components/ui";
import { useMutationService } from "@/utils/hooks/useMutationService";
import client from "@/utils/client";
import { unwrapApiData } from "@/lib/api/unwrap";

type ReelEditorPageProps = {
  reelId?: string;
};

export function ReelEditorPage({ reelId }: ReelEditorPageProps) {
  const router = useRouter();
  const isEdit = Boolean(reelId);
  const [title, setTitle] = useState("");
  const [label, setLabel] = useState("");
  const [platform, setPlatform] = useState("youtube");
  const [externalUrl, setExternalUrl] = useState("");
  const [thumbnail, setThumbnail] = useState<AdminMediaRef | null>(null);

  useEffect(() => {
    if (!reelId) return;
    void (async () => {
      const res = await client.request<never, Record<string, unknown>>({
        path: `/api/admin/reels/${reelId}`,
        method: ApiMethods.GET,
      });
      const data = unwrapApiData(res);
      setTitle(String(data.title ?? ""));
      setLabel(String(data.label ?? ""));
      setPlatform(String(data.platform ?? "youtube"));
      setExternalUrl(String(data.externalUrl ?? ""));
      const t = data.thumbnail;
      if (t && typeof t === "object" && "id" in t) {
        setThumbnail(t as AdminMediaRef);
      }
    })();
  }, [reelId]);

  const { mutate, isPending } = useMutationService({
    service: (payload) => ({
      path: isEdit ? `/api/admin/reels/${reelId}` : "/api/admin/reels",
      method: isEdit ? ApiMethods.PATCH : ApiMethods.POST,
      data: payload,
    }),
    options: {
      successTitle: isEdit ? "Reel updated" : "Reel created",
      redirectTo: AdminRoutes.reels,
    },
  });

  const save = () => {
    if (!title.trim() || !label.trim() || !externalUrl.trim() || !thumbnail?.id) return;
    mutate({
      title: title.trim(),
      label: label.trim(),
      platform,
      externalUrl: externalUrl.trim(),
      thumbnailId: thumbnail.id,
    });
  };

  return (
    <>
      <AdminPageHeader title={isEdit ? "Edit reel" : "New reel"} />
      <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
        <AdminCard sx={{ flex: 1, p: 3 }}>
          <Stack spacing={2}>
            <Box>
              <AdminFieldLabel label="Title" required />
              <KiribeTextField fullWidth value={title} onChange={(e) => setTitle(e.target.value)} />
            </Box>
            <Box>
              <AdminFieldLabel label="Label" required />
              <KiribeTextField fullWidth value={label} onChange={(e) => setLabel(e.target.value)} />
            </Box>
            <Box>
              <AdminFieldLabel label="Platform" required />
              <KiribeTextField select fullWidth value={platform} onChange={(e) => setPlatform(e.target.value)}>
                <MenuItem value="youtube">YouTube</MenuItem>
                <MenuItem value="instagram">Instagram</MenuItem>
                <MenuItem value="tiktok">TikTok</MenuItem>
              </KiribeTextField>
            </Box>
            <Box>
              <AdminFieldLabel label="External URL" required />
              <KiribeTextField fullWidth value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} />
            </Box>
          </Stack>
        </AdminCard>
        <AdminCard sx={{ width: { md: 320 }, p: 3 }}>
          <MediaPicker label="Thumbnail" value={thumbnail} onChange={setThumbnail} />
        </AdminCard>
      </Stack>
      <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
        <KiribeButton onClick={save} disabled={isPending}>
          {isPending ? "Saving..." : "Save"}
        </KiribeButton>
        <KiribeButton variant="outlined" onClick={() => router.push(AdminRoutes.reels)}>
          Cancel
        </KiribeButton>
      </Stack>
    </>
  );
}
