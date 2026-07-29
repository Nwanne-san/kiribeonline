"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import SaveRounded from "@mui/icons-material/SaveRounded";
import { useEffect, useState } from "react";
import {
  AdminButton,
  AdminCheckboxRow,
  AdminField,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
} from "@/modules/admin/components/ui/AdminPrimitives";
import { PanelListSkeleton } from "@/modules/admin/components/ui/AdminSkeletons";
import { usePermissions } from "@/modules/admin/hooks/usePermissions";
import { useSiteSettings } from "@/modules/admin/hooks/useSiteSettings";
import { adminNavigationService, adminQueryKeys } from "@/services/admin.service";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { AdminRoutes } from "@/routes/admin.routes";
import { NAV_MAX_HEADER_LINKS } from "@/constants";
import Link from "next/link";

type NavLinkRow = { id: string; label: string; href: string; visible: boolean };
type FooterColumn = { id: string; title: string; links: NavLinkRow[] };

type NavigationPayload = {
  headerLinks: NavLinkRow[];
  footerColumns: FooterColumn[];
  isDefault: boolean;
  maxHeaderLinks: number;
  availableCategories: Array<{ label: string; href: string; inNav: boolean }>;
};

/**
 * Navigation & Footer — edits the public header row and footer columns, saved
 * onto the `site-settings` global.
 *
 * The header is capped at `NAV_MAX_HEADER_LINKS`: the Figma nav is a single
 * centred row and past six labels it wraps into the search + Subscribe cluster.
 * The cap is enforced server-side too (PATCH schema + Payload `maxRows`) — this
 * just stops an editor hitting a validation error they couldn't see coming.
 */
export function NavigationAdminPage() {
  const { can } = usePermissions();
  const canManage = can("settings:manage");
  const { data: settings } = useSiteSettings();

  const { data, isLoading } = useQueryService<
    Record<string, never>,
    NavigationPayload
  >({
    service: adminNavigationService.get,
    options: { keys: [adminQueryKeys.navigation] },
  });

  const [headerLinks, setHeaderLinks] = useState<NavLinkRow[]>([]);
  const [footerColumns, setFooterColumns] = useState<FooterColumn[]>([]);

  useEffect(() => {
    if (!data) return;
    setHeaderLinks(data.headerLinks ?? []);
    setFooterColumns(data.footerColumns ?? []);
  }, [data]);

  const maxHeaderLinks = data?.maxHeaderLinks ?? NAV_MAX_HEADER_LINKS;
  const atHeaderLimit = headerLinks.length >= maxHeaderLinks;
  const socialCount = settings?.socialLinks?.filter((l) => l?.url).length ?? 0;

  const saveNavigation = useMutationService<
    { headerLinks: unknown[]; footerColumns: unknown[] },
    NavigationPayload
  >({
    service: adminNavigationService.update,
    options: {
      successTitle: "Navigation saved",
      successMessage: "The public header and footer have been updated.",
      invalidateKeys: [adminQueryKeys.navigation],
    },
  });

  const save = () => {
    saveNavigation.mutate({
      // `id` is a client-side row key only — the API schema rejects extras.
      headerLinks: headerLinks
        .slice(0, maxHeaderLinks)
        .map(({ label, href, visible }) => ({
          label: label.trim(),
          href: href.trim(),
          visible,
        })),
      footerColumns: footerColumns.map((col) => ({
        title: col.title.trim(),
        links: col.links.map(({ label, href, visible }) => ({
          label: label.trim(),
          href: href.trim(),
          visible,
        })),
      })),
    });
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Navigation & Footer"
        subtitle={
          data?.isDefault
            ? "Showing defaults derived from your categories — save to take manual control."
            : "Header links, footer columns, and socials."
        }
        action={
          canManage ? (
            <AdminButton
              onClick={save}
              disabled={saveNavigation.isPending}
              leftIcon={<SaveRounded className="text-[16px]" />}
            >
              {saveNavigation.isPending ? "Saving…" : "Save"}
            </AdminButton>
          ) : null
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <AdminPanel
          title={`Header links (${headerLinks.length}/${maxHeaderLinks})`}
          action={
            canManage ? (
              <AdminButton
                size="sm"
                variant="ghost"
                disabled={atHeaderLimit}
                leftIcon={<AddRounded className="text-[14px]" />}
                onClick={() =>
                  setHeaderLinks((prev) =>
                    prev.length >= maxHeaderLinks
                      ? prev
                      : [
                          ...prev,
                          {
                            id: `h-new-${prev.length}`,
                            label: "New link",
                            href: "/",
                            visible: true,
                          },
                        ]
                  )
                }
              >
                Add
              </AdminButton>
            ) : null
          }
        >
          {isLoading ? (
            <div className="p-5">
              <PanelListSkeleton rows={4} />
            </div>
          ) : (
            <div className="space-y-3 p-5">
              <p className="text-xs text-muted-soft">
                The header holds at most {maxHeaderLinks} links so the row
                doesn&apos;t wrap into the search and Subscribe controls.
                Everything else stays reachable from{" "}
                <span className="text-ink-secondary">/categories</span> and the
                mobile menu.
              </p>
              {headerLinks.map((link, index) => (
                <div key={link.id} className="space-y-2 border border-border p-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <AdminField label="Label">
                      <AdminInput
                        value={link.label}
                        disabled={!canManage}
                        onChange={(e) =>
                          setHeaderLinks((prev) =>
                            prev.map((row, i) =>
                              i === index ? { ...row, label: e.target.value } : row
                            )
                          )
                        }
                      />
                    </AdminField>
                    <AdminField label="URL">
                      <AdminInput
                        value={link.href}
                        disabled={!canManage}
                        onChange={(e) =>
                          setHeaderLinks((prev) =>
                            prev.map((row, i) =>
                              i === index ? { ...row, href: e.target.value } : row
                            )
                          )
                        }
                      />
                    </AdminField>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <AdminCheckboxRow
                      label="Visible"
                      checked={link.visible}
                      disabled={!canManage}
                      onChange={(e) =>
                        setHeaderLinks((prev) =>
                          prev.map((row, i) =>
                            i === index ? { ...row, visible: e.target.checked } : row
                          )
                        )
                      }
                    />
                    {canManage ? (
                      <AdminButton
                        size="sm"
                        variant="ghost"
                        leftIcon={<DeleteOutlineRounded className="text-[14px]" />}
                        onClick={() =>
                          setHeaderLinks((prev) => prev.filter((_, i) => i !== index))
                        }
                      >
                        Remove
                      </AdminButton>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminPanel>

        <AdminPanel title="Footer columns">
          {isLoading ? (
            <div className="p-5">
              <PanelListSkeleton rows={3} />
            </div>
          ) : (
            <div className="space-y-4 p-5">
              {footerColumns.map((col, colIndex) => (
                <div key={col.id} className="border border-border p-3">
                  <AdminField label="Column title" className="mb-3">
                    <AdminInput
                      value={col.title}
                      disabled={!canManage}
                      onChange={(e) =>
                        setFooterColumns((prev) =>
                          prev.map((c, i) =>
                            i === colIndex ? { ...c, title: e.target.value } : c
                          )
                        )
                      }
                    />
                  </AdminField>
                  <div className="space-y-2">
                    {col.links.map((link, linkIndex) => (
                      <div
                        key={link.id}
                        className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
                      >
                        <AdminInput
                          value={link.label}
                          disabled={!canManage}
                          onChange={(e) =>
                            setFooterColumns((prev) =>
                              prev.map((c, i) =>
                                i === colIndex
                                  ? {
                                      ...c,
                                      links: c.links.map((l, j) =>
                                        j === linkIndex
                                          ? { ...l, label: e.target.value }
                                          : l
                                      ),
                                    }
                                  : c
                              )
                            )
                          }
                          placeholder="Label"
                        />
                        <AdminInput
                          value={link.href}
                          disabled={!canManage}
                          onChange={(e) =>
                            setFooterColumns((prev) =>
                              prev.map((c, i) =>
                                i === colIndex
                                  ? {
                                      ...c,
                                      links: c.links.map((l, j) =>
                                        j === linkIndex
                                          ? { ...l, href: e.target.value }
                                          : l
                                      ),
                                    }
                                  : c
                              )
                            )
                          }
                          placeholder="URL"
                        />
                        <AdminSelect
                          value={link.visible ? "1" : "0"}
                          disabled={!canManage}
                          onChange={(e) =>
                            setFooterColumns((prev) =>
                              prev.map((c, i) =>
                                i === colIndex
                                  ? {
                                      ...c,
                                      links: c.links.map((l, j) =>
                                        j === linkIndex
                                          ? { ...l, visible: e.target.value === "1" }
                                          : l
                                      ),
                                    }
                                  : c
                              )
                            )
                          }
                        >
                          <option value="1">On</option>
                          <option value="0">Off</option>
                        </AdminSelect>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminPanel>
      </div>

      <AdminPanel title="Social links">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 text-sm text-muted">
          <p>
            {socialCount > 0
              ? `${socialCount} social link${socialCount === 1 ? "" : "s"} configured in Settings.`
              : "No social links yet — add them in Settings so the header rail and footer Follow column appear."}
          </p>
          <Link href={AdminRoutes.settings}>
            <AdminButton size="sm" variant="secondary">
              Open Settings
            </AdminButton>
          </Link>
        </div>
      </AdminPanel>
    </div>
  );
}
