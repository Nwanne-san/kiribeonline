"use client";

import Stack from "@mui/material/Stack";
import { useEffect, useState } from "react";
import { ApiMethods } from "../../../../../types/service";
import { KiribeButton, KiribeTextField, KiribeTypography } from "@/modules/shared/components/ui";
import { useMutationService } from "@/utils/hooks/useMutationService";
import client from "@/utils/client";
import { unwrapApiData } from "@/lib/api/unwrap";

export function SettingsAdminPage() {
  const [siteName, setSiteName] = useState("");
  const [seoDescription, setSeoDescription] = useState("");

  useEffect(() => {
    void (async () => {
      const res = await client.request<never, Record<string, unknown>>({
        path: "/api/admin/settings",
        method: ApiMethods.GET,
      });
      const data = unwrapApiData(res);
      setSiteName(String(data.siteName ?? ""));
      const seo = data.seoDefaults as { description?: string } | undefined;
      setSeoDescription(String(seo?.description ?? ""));
    })();
  }, []);

  const { mutate, isPending } = useMutationService({
    service: (payload) => ({
      path: "/api/admin/settings",
      method: ApiMethods.PATCH,
      data: payload,
    }),
    options: { keys: ["admin", "settings"] },
  });

  return (
    <Stack spacing={3} sx={{ maxWidth: 560 }}>
      <KiribeTypography variant="h4">Site settings</KiribeTypography>
      <KiribeTextField label="Site name" value={siteName} onChange={(e) => setSiteName(e.target.value)} fullWidth />
      <KiribeTextField
        label="Default SEO description"
        value={seoDescription}
        onChange={(e) => setSeoDescription(e.target.value)}
        fullWidth
        multiline
        rows={3}
      />
      <KiribeButton
        onClick={() => mutate({ siteName, seoDefaults: { description: seoDescription } })}
        disabled={isPending}
      >
        {isPending ? "Saving..." : "Save settings"}
      </KiribeButton>
    </Stack>
  );
}
