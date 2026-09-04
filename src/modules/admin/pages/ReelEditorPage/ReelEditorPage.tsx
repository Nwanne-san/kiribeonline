"use client";

import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import SaveRounded from "@mui/icons-material/SaveRounded";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiMethods } from "../../../../../types/service";
import { MediaPicker } from "@/modules/admin/components/MediaPicker";
import type { AdminMediaRef } from "@/server/modules";
import {
  AdminButton,
  AdminField,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
  AdminSearchableSelect,
} from "@/modules/admin/components/ui/AdminPrimitives";
import { AdminRoutes } from "@/routes/admin.routes";
import { useMutationService } from "@/utils/hooks/useMutationService";
import client from "@/utils/client";
import { unwrapApiData } from "@/lib/api/unwrap";

type ReelEditorPageProps = {
  reelId?: string;
};

const PLATFORM_HOST_PATTERN: Record<string, RegExp> = {
  instagram: /(^|\.)instagram\.com$/i,
  tiktok: /(^|\.)tiktok\.com$/i,
  youtube: /(^|\.)(youtube\.com|youtu\.be)$/i,
};

/** Mirror of the server-side guard so we can flash the same error inline
 *  before the user submits. */
function validateReelUrl(url: string, platform: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return "That doesn’t look like a valid link. Paste the full URL, including https://.";
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return "Reel links must start with http:// or https://.";
  }
  const expected = PLATFORM_HOST_PATTERN[platform];
  if (!expected || expected.test(parsed.hostname)) return null;
  const label = platform === "instagram" ? "Instagram" : platform === "tiktok" ? "TikTok" : "YouTube";
  return `The link doesn't match the selected platform (${label}). Paste an ${label} URL or change the platform.`;
}

export function ReelEditorPage({ reelId }: ReelEditorPageProps) {
  const router = useRouter();
  const isEdit = Boolean(reelId);
  const [title, setTitle] = useState("");
  const [label, setLabel] = useState("");
  const [platform, setPlatform] = useState("youtube");
  const [externalUrl, setExternalUrl] = useState("");
  const [thumbnail, setThumbnail] = useState<AdminMediaRef | null>(null);
  const urlError = validateReelUrl(externalUrl, platform);

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

  const canSave =
    title.trim() &&
    label.trim() &&
    externalUrl.trim() &&
    thumbnail?.id &&
    !urlError &&
    !isPending;

  const save = () => {
    if (!canSave) return;
    mutate({
      title: title.trim(),
      label: label.trim(),
      platform,
      externalUrl: externalUrl.trim(),
      thumbnailId: thumbnail.id,
    });
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title={isEdit ? "Edit reel" : "New reel"}
        subtitle="Paste the original post URL — Instagram, TikTok, or YouTube."
        action={
          <AdminButton
            variant="secondary"
            leftIcon={<ArrowBackRounded sx={{ fontSize: 16 }} />}
            onClick={() => router.push(AdminRoutes.reels)}
          >
            Back
          </AdminButton>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <AdminPanel title="Reel details">
          <div className="space-y-4 p-5">
            <AdminField label="Title" htmlFor="reel-title" required>
              <AdminInput
                id="reel-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Kiribé on-set with Kunle Afolayan"
              />
            </AdminField>

            <AdminField label="Label" htmlFor="reel-label" required
              hint="Short badge shown on the card (e.g. INTERVIEW, TRAILER)."
            >
              <AdminInput
                id="reel-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </AdminField>

            <AdminField label="Platform" htmlFor="reel-platform" required>
              <AdminSearchableSelect
                id="reel-platform"
                value={platform}
                onChange={(val) => setPlatform(val as "youtube" | "instagram" | "tiktok")}
                options={[
                  { value: "youtube", label: "YouTube" },
                  { value: "instagram", label: "Instagram" },
                  { value: "tiktok", label: "TikTok" },
                ]}
                searchable={false}
              />
            </AdminField>

            <AdminField
              label="External URL"
              htmlFor="reel-url"
              required
              error={urlError ?? undefined}
              hint="Instagram /reel/, TikTok /video/, YouTube /shorts/ or /watch."
            >
              <AdminInput
                id="reel-url"
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://"
                invalid={Boolean(urlError)}
              />
            </AdminField>
          </div>
        </AdminPanel>

        <AdminPanel title="Thumbnail">
          <div className="p-5">
            <MediaPicker label="Thumbnail" value={thumbnail} onChange={setThumbnail} />
          </div>
        </AdminPanel>
      </div>

      <div className="flex items-center gap-2">
        <AdminButton
          onClick={save}
          disabled={!canSave}
          leftIcon={<SaveRounded sx={{ fontSize: 16 }} />}
        >
          {isPending ? "Saving…" : "Save"}
        </AdminButton>
        <AdminButton variant="secondary" onClick={() => router.push(AdminRoutes.reels)}>
          Cancel
        </AdminButton>
      </div>
    </div>
  );
}
