"use client";

import { adminQueryKeys, adminSettingsService } from "@/services/admin.service";
import type { AdminMediaRef } from "@/server/modules";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useQueryService } from "@/utils/hooks/useQueryService";

/**
 * Shared read/write access to the `site-settings` global for admin screens.
 * Settings and the SEO hub both edit slices of the same document, so they share
 * one query key — saving on either refreshes the other.
 */

/** Payload returns uploads either as a populated doc or a bare id (depth 0). */
type UploadValue = { id: string | number; url?: string | null; alt?: string | null } | string | number | null;

export type AdminSiteSettings = {
  siteName?: string | null;
  logo?: UploadValue;
  socialLinks?: Array<{ platform?: string | null; url?: string | null }> | null;
  seoDefaults?: {
    title?: string | null;
    description?: string | null;
    ogImage?: UploadValue;
  } | null;
};

export type SiteSettingsPatch = {
  siteName?: string;
  logoId?: string | null;
  socialLinks?: { platform: string; url: string }[];
  seoDefaults?: {
    title?: string;
    description?: string;
    ogImageId?: string | null;
  };
};

/** Convert a Payload upload value into the shape `MediaPicker` expects. */
export function toMediaRef(value: UploadValue): AdminMediaRef | null {
  if (!value) return null;
  if (typeof value === "object") {
    return {
      id: String(value.id),
      url: value.url ?? undefined,
      alt: value.alt ?? undefined,
    };
  }
  return { id: String(value) };
}

export function useSiteSettings() {
  return useQueryService<Record<string, never>, AdminSiteSettings>({
    service: adminSettingsService.get,
    options: { keys: [adminQueryKeys.settings] },
  });
}

export function useSaveSiteSettings(successTitle: string) {
  return useMutationService<SiteSettingsPatch, AdminSiteSettings>({
    service: adminSettingsService.update,
    options: {
      keys: [adminQueryKeys.settings],
      invalidateKeys: [adminQueryKeys.settings],
      successTitle,
      errorTitle: "Save failed",
    },
  });
}
