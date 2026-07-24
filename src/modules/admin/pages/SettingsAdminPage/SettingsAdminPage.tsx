"use client";

import SaveRounded from "@mui/icons-material/SaveRounded";
import { useEffect, useState } from "react";
import { ApiMethods } from "../../../../../types/service";
import {
  AdminButton,
  AdminField,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
  AdminTextarea,
} from "@/modules/admin/components/ui/AdminPrimitives";
import { PanelListSkeleton } from "@/modules/admin/components/ui/AdminSkeletons";
import { useMutationService } from "@/utils/hooks/useMutationService";
import client from "@/utils/client";
import { unwrapApiData } from "@/lib/api/unwrap";

export function SettingsAdminPage() {
  const [siteName, setSiteName] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await client.request<never, Record<string, unknown>>({
          path: "/api/admin/settings",
          method: ApiMethods.GET,
        });
        const data = unwrapApiData(res);
        setSiteName(String(data.siteName ?? ""));
        const seo = data.seoDefaults as { description?: string } | undefined;
        setSeoDescription(String(seo?.description ?? ""));
      } finally {
        setLoading(false);
      }
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
    <div className="space-y-5">
      <AdminPageHeader
        title="Site settings"
        subtitle="Global site metadata used by the header, SEO tags, and social share cards."
      />

      <AdminPanel title="Identity & SEO">
        {loading ? (
          <PanelListSkeleton rows={3} />
        ) : (
          <div className="space-y-4 p-5">
            <AdminField
              label="Site name"
              htmlFor="settings-site-name"
              hint="Shown in the header, browser tab, and social previews."
            >
              <AdminInput
                id="settings-site-name"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="Kiribé Online"
              />
            </AdminField>

            <AdminField
              label="Default SEO description"
              htmlFor="settings-seo-description"
              hint="Fallback meta description used on pages without an explicit one."
            >
              <AdminTextarea
                id="settings-seo-description"
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                rows={3}
                placeholder="Kiribé Online is a premium editorial destination for..."
              />
            </AdminField>
          </div>
        )}
      </AdminPanel>

      <div className="flex items-center gap-2">
        <AdminButton
          onClick={() => mutate({ siteName, seoDefaults: { description: seoDescription } })}
          disabled={isPending || loading}
          leftIcon={<SaveRounded sx={{ fontSize: 16 }} />}
        >
          {isPending ? "Saving…" : "Save settings"}
        </AdminButton>
      </div>
    </div>
  );
}
