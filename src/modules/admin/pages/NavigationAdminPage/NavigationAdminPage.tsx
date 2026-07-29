"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import SaveRounded from "@mui/icons-material/SaveRounded";
import { useEffect, useState } from "react";
import { ApiMethods } from "../../../../../types/service";
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
import { useKiribeToast } from "@/modules/shared/components/feedback/KiribeSnackbar";
import { usePermissions } from "@/modules/admin/hooks/usePermissions";
import { useSiteSettings } from "@/modules/admin/hooks/useSiteSettings";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { AdminRoutes } from "@/routes/admin.routes";
import Link from "next/link";

type NavLinkRow = { id: string; label: string; href: string; visible: boolean };
type FooterColumn = { id: string; title: string; links: NavLinkRow[] };

type NavigationChrome = {
  headerLinks: NavLinkRow[];
  footerColumns: FooterColumn[];
};

/**
 * Figma Make Navigation & Footer panel.
 * Category visibility continues to live on Categories (`showInNav`) — this
 * screen edits chrome link lists only. Persist is stubbed until SiteSettings
 * gains header/footer fields.
 */
export function NavigationAdminPage() {
  const { can } = usePermissions();
  const canManage = can("settings:manage");
  const { showToast } = useKiribeToast();
  const { data: settings } = useSiteSettings();

  const { data, isLoading } = useQueryService<Record<string, never>, NavigationChrome>({
    service: { path: "/api/admin/navigation", method: ApiMethods.GET },
    options: { keys: ["admin", "navigation"] },
  });

  const [headerLinks, setHeaderLinks] = useState<NavLinkRow[]>([]);
  const [footerColumns, setFooterColumns] = useState<FooterColumn[]>([]);

  useEffect(() => {
    if (!data) return;
    setHeaderLinks(data.headerLinks ?? []);
    setFooterColumns(data.footerColumns ?? []);
  }, [data]);

  const socialCount = settings?.socialLinks?.filter((l) => l?.url).length ?? 0;

  const saveStub = () => {
    showToast({
      message: "Navigation persistence landing soon",
      description:
        "UI matches Make. Category showInNav still controls which categories appear in the public header.",
      severity: "info",
    });
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Navigation & Footer"
        subtitle="Header links, footer columns, and socials. Category nav visibility is managed under Categories & Tags."
        action={
          canManage ? (
            <AdminButton
              onClick={saveStub}
              leftIcon={<SaveRounded className="text-[16px]" />}
            >
              Save
            </AdminButton>
          ) : null
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <AdminPanel
          title="Header links"
          action={
            <AdminButton
              size="sm"
              variant="ghost"
              leftIcon={<AddRounded className="text-[14px]" />}
              onClick={() =>
                setHeaderLinks((prev) => [
                  ...prev,
                  {
                    id: `h-${Date.now()}`,
                    label: "New link",
                    href: "/",
                    visible: true,
                  },
                ])
              }
            >
              Add
            </AdminButton>
          }
        >
          {isLoading ? (
            <div className="p-5">
              <PanelListSkeleton rows={4} />
            </div>
          ) : (
            <div className="space-y-3 p-5">
              {headerLinks.map((link, index) => (
                <div
                  key={link.id}
                  className="space-y-2 border border-border p-3"
                >
                  <div className="grid gap-2 sm:grid-cols-2">
                    <AdminField label="Label">
                      <AdminInput
                        value={link.label}
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
                      onChange={(e) =>
                        setHeaderLinks((prev) =>
                          prev.map((row, i) =>
                            i === index ? { ...row, visible: e.target.checked } : row
                          )
                        )
                      }
                    />
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
                      <div key={link.id} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                        <AdminInput
                          value={link.label}
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
