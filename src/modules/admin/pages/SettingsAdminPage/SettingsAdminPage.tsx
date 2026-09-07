"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import SaveRounded from "@mui/icons-material/SaveRounded";
import { useEffect, useMemo, useState } from "react";
import {
  AdminButton,
  AdminField,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
  AdminSearchableSelect,
  AdminTextarea,
} from "@/modules/admin/components/ui/AdminPrimitives";
import { PanelListSkeleton } from "@/modules/admin/components/ui/AdminSkeletons";
import { MediaPicker } from "@/modules/admin/components/MediaPicker";
import { usePermissions } from "@/modules/admin/hooks/usePermissions";
import {
  toMediaRef,
  useSaveSiteSettings,
  useSiteSettings,
} from "@/modules/admin/hooks/useSiteSettings";
import type { AdminMediaRef } from "@/server/modules";
import { SOCIAL_PLATFORMS, normalizeSocialPlatform } from "@/constants";

type SocialRow = { platform: string; url: string };

const SEO_TITLE_MAX = 60;
const SEO_DESCRIPTION_MAX = 160;

export function SettingsAdminPage() {
  const { can } = usePermissions();
  const canManage = can("settings:manage");

  const { data, isLoading } = useSiteSettings();
  const { mutate, isPending } = useSaveSiteSettings("Settings saved");

  const [siteName, setSiteName] = useState("");
  const [logo, setLogo] = useState<AdminMediaRef | null>(null);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [ogImage, setOgImage] = useState<AdminMediaRef | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialRow[]>([]);

  // Hydrate the form once the global arrives (and again after a save refetch —
  // the server is the source of truth for what actually persisted).
  useEffect(() => {
    if (!data) return;
    setSiteName(data.siteName ?? "");
    setLogo(toMediaRef(data.logo ?? null));
    setSeoTitle(data.seoDefaults?.title ?? "");
    setSeoDescription(data.seoDefaults?.description ?? "");
    setOgImage(toMediaRef(data.seoDefaults?.ogImage ?? null));
    setSocialLinks(
      (data.socialLinks ?? [])
        .map((link) => ({
          platform: normalizeSocialPlatform(link.platform ?? ""),
          url: link.url ?? "",
        }))
        .filter((link) => link.platform || link.url)
    );
  }, [data]);

  const usedPlatforms = new Set(socialLinks.map((link) => link.platform));
  const nextFreePlatform =
    SOCIAL_PLATFORMS.find((platform) => !usedPlatforms.has(platform.key))?.key ?? "";

  /**
   * Social rows are one of three states: fully empty (dropped on save),
   * half-filled (blocked — editor probably meant to keep it), or valid.
   * Show per-row errors on the half-filled ones and disable Save until all
   * rows are resolved.
   */
  const socialErrors = useMemo(() => {
    return socialLinks.map((row) => {
      const hasPlatform = Boolean(row.platform.trim());
      const hasUrl = Boolean(row.url.trim());
      if (!hasPlatform && !hasUrl) return { platform: null, url: null, empty: true };
      let urlError: string | null = null;
      if (!hasUrl) urlError = "URL is required";
      else if (!/^https?:\/\//i.test(row.url.trim()))
        urlError = "Use a full https:// URL";
      return {
        platform: hasPlatform ? null : "Pick a platform",
        url: urlError,
        empty: false,
      };
    });
  }, [socialLinks]);
  const hasSocialErrors = socialErrors.some((e) => e.platform !== null || e.url !== null);

  const addSocialRow = () => {
    setSocialLinks((prev) => [...prev, { platform: nextFreePlatform, url: "" }]);
  };

  const updateSocialRow = (index: number, patch: Partial<SocialRow>) => {
    setSocialLinks((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );
  };

  const removeSocialRow = (index: number) => {
    setSocialLinks((prev) => prev.filter((_, i) => i !== index));
  };

  const save = () => {
    mutate({
      siteName: siteName.trim(),
      logoId: logo ? String(logo.id) : null,
      seoDefaults: {
        title: seoTitle.trim(),
        description: seoDescription.trim(),
        ogImageId: ogImage ? String(ogImage.id) : null,
      },
      // Drop half-filled rows so an empty URL can't fail server URL validation
      // and block the rest of the save.
      socialLinks: socialLinks
        .map((row) => ({
          platform: normalizeSocialPlatform(row.platform),
          url: row.url.trim(),
        }))
        .filter((row) => row.platform && row.url),
    });
  };

  const saveButton = canManage ? (
    <AdminButton
      onClick={save}
      disabled={isPending || isLoading || !siteName.trim() || hasSocialErrors}
      leftIcon={<SaveRounded className="text-[16px]" />}
    >
      {isPending
        ? "Saving…"
        : hasSocialErrors
          ? "Fix social links to save"
          : "Save settings"}
    </AdminButton>
  ) : null;

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Site settings"
        subtitle="Global site metadata used by the header, SEO tags, and social share cards."
        action={saveButton}
      />

      {!canManage && (
        <div className="border border-border bg-surface-alt px-4 py-3 text-sm text-muted">
          You have read-only access to site settings. Ask an admin to make changes.
        </div>
      )}

      <AdminPanel title="Site identity">
        {isLoading ? (
          <PanelListSkeleton rows={3} />
        ) : (
          <div className="space-y-5 p-5">
            <AdminField
              label="Site name"
              htmlFor="settings-site-name"
              hint="Shown in the header, browser tab, and social previews."
              required
            >
              <AdminInput
                id="settings-site-name"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="Kiribé Online"
                disabled={!canManage}
              />
            </AdminField>

            <MediaPicker
              label="Logo"
              value={logo}
              onChange={setLogo}
              helperText="Used where the wordmark can't be rendered as SVG (emails, share cards)."
            />
          </div>
        )}
      </AdminPanel>

      <AdminPanel title="SEO defaults">
        {isLoading ? (
          <PanelListSkeleton rows={3} />
        ) : (
          <div className="space-y-5 p-5">
            <AdminField
              label="Default title"
              htmlFor="settings-seo-title"
              hint={`Fallback <title> for pages without their own. ${seoTitle.length}/${SEO_TITLE_MAX} recommended.`}
            >
              <AdminInput
                id="settings-seo-title"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="Kiribé Online — Entertainment journalism"
                disabled={!canManage}
              />
            </AdminField>

            <AdminField
              label="Default description"
              htmlFor="settings-seo-description"
              hint={`Fallback meta description. ${seoDescription.length}/${SEO_DESCRIPTION_MAX} recommended.`}
            >
              <AdminTextarea
                id="settings-seo-description"
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                rows={3}
                placeholder="Kiribé Online is a premium editorial destination for…"
                disabled={!canManage}
              />
            </AdminField>

            <MediaPicker
              label="Default share image"
              value={ogImage}
              onChange={setOgImage}
              helperText="Open Graph image for pages without their own. 1200×630 works best."
            />
          </div>
        )}
      </AdminPanel>

      <AdminPanel
        title="Social links"
        action={
          canManage ? (
            <AdminButton
              variant="secondary"
              size="sm"
              onClick={addSocialRow}
              disabled={!nextFreePlatform}
              leftIcon={<AddRounded className="text-[14px]" />}
            >
              Add link
            </AdminButton>
          ) : null
        }
      >
        {isLoading ? (
          <PanelListSkeleton rows={3} />
        ) : (
          <div className="space-y-3 p-5">
            <p className="text-xs text-muted-soft">
              Only platforms with a URL appear in the site header rail and footer.
            </p>

            {socialLinks.length === 0 ? (
              <div className="border border-dashed border-border bg-surface-alt px-4 py-8 text-center text-sm text-muted-soft">
                No social links yet.
              </div>
            ) : (
              socialLinks.map((row, index) => {
                const rowError = socialErrors[index];
                return (
                <div
                  key={index}
                  className="flex flex-col gap-2 border border-border bg-surface-alt p-3 sm:flex-row sm:items-end"
                >
                  <div className="sm:w-48">
                    <AdminField
                      label="Platform"
                      htmlFor={`settings-social-platform-${index}`}
                      error={rowError?.platform ?? undefined}
                    >
                      <AdminSearchableSelect
                        id={`settings-social-platform-${index}`}
                        value={row.platform}
                        onChange={(val) => updateSocialRow(index, { platform: val })}
                        disabled={!canManage}
                        options={[
                          { value: "", label: "Select platform" },
                          ...SOCIAL_PLATFORMS.map((platform) => ({
                            value: platform.key,
                            label: platform.label,
                            disabled:
                              platform.key !== row.platform && usedPlatforms.has(platform.key),
                          })),
                        ]}
                        searchable={false}
                      />
                    </AdminField>
                  </div>

                  <div className="min-w-0 flex-1">
                    <AdminField
                      label="URL"
                      htmlFor={`settings-social-url-${index}`}
                      error={rowError?.url ?? undefined}
                    >
                      <AdminInput
                        id={`settings-social-url-${index}`}
                        type="url"
                        value={row.url}
                        invalid={Boolean(rowError?.url)}
                        onChange={(e) => updateSocialRow(index, { url: e.target.value })}
                        placeholder="https://instagram.com/kiribeonline"
                        disabled={!canManage}
                      />
                    </AdminField>
                  </div>

                  {canManage && (
                    <button
                      type="button"
                      onClick={() => removeSocialRow(index)}
                      aria-label={`Remove ${row.platform || "social"} link`}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center border border-border bg-surface text-ink-secondary transition-colors hover:border-admin-primary hover:text-admin-primary"
                    >
                      <DeleteOutlineRounded className="text-[16px]" />
                    </button>
                  )}
                </div>
                );
              })
            )}
          </div>
        )}
      </AdminPanel>
    </div>
  );
}
