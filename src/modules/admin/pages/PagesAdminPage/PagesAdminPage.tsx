"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import { useState } from "react";
import { ApiMethods } from "../../../../../types/service";
import {
  AdminButton,
  AdminField,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
  AdminTextarea,
  Pill,
  type PillTone,
} from "@/modules/admin/components/ui/AdminPrimitives";
import { TableSkeleton } from "@/modules/admin/components/ui/AdminSkeletons";
import { useKiribeToast } from "@/modules/shared/components/feedback/KiribeSnackbar";
import { useQueryService } from "@/utils/hooks/useQueryService";

type StubPage = {
  id: string;
  title: string;
  slug: string;
  status: "published" | "draft";
  updatedAt?: string;
};

type PagesList = { docs: StubPage[]; totalDocs: number };

const STATUS_TONE: Record<string, PillTone> = {
  published: "success",
  draft: "warning",
};

/**
 * Figma Make Pages panel UI. Persistence is stubbed — GET returns an empty
 * list; mutations toast until a Payload `pages` collection lands.
 */
export function PagesAdminPage() {
  const { showToast } = useKiribeToast();
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftSlug, setDraftSlug] = useState("");
  const [draftStatus, setDraftStatus] = useState<"published" | "draft">("draft");
  const [draftBody, setDraftBody] = useState("");

  const { data, isLoading } = useQueryService<Record<string, never>, PagesList>({
    service: { path: "/api/admin/pages", method: ApiMethods.GET },
    options: { keys: ["admin", "pages"] },
  });

  const docs = (data?.docs ?? []).filter(
    (p) => filter === "all" || p.status === filter
  );
  const selected = docs.find((p) => p.id === selectedId) ?? null;

  const openNew = () => {
    setSelectedId("new");
    setDraftTitle("");
    setDraftSlug("");
    setDraftStatus("draft");
    setDraftBody("");
  };

  const openExisting = (page: StubPage) => {
    setSelectedId(page.id);
    setDraftTitle(page.title);
    setDraftSlug(page.slug);
    setDraftStatus(page.status);
    setDraftBody("");
  };

  const saveStub = () => {
    showToast({
      message: "Pages CMS landing soon",
      description: "This screen is UI-ready; saving will work once the pages collection ships.",
      severity: "info",
    });
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Pages"
        subtitle={`${data?.totalDocs ?? 0} pages · static marketing pages stay in code until CMS pages land`}
        action={
          <AdminButton leftIcon={<AddRounded className="text-[16px]" />} onClick={openNew}>
            New Page
          </AdminButton>
        }
      />

      <div className="flex flex-wrap gap-2">
        {(["all", "published", "draft"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`rounded-none border px-3 py-1.5 font-headline text-[0.65rem] font-semibold uppercase tracking-widest transition-colors ${
              filter === key
                ? "border-admin-primary bg-admin-primary text-white"
                : "border-border bg-surface text-muted hover:border-admin-primary hover:text-admin-primary"
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <AdminPanel title="All pages" className="lg:col-span-2">
          {isLoading ? (
            <div className="p-5">
              <TableSkeleton rows={4} />
            </div>
          ) : docs.length === 0 ? (
            <p className="p-5 text-sm text-muted">
              No CMS pages yet. About, Contact, Privacy, and Terms still ship as
              React pages.
            </p>
          ) : (
            <ul className="divide-y divide-border-soft">
              {docs.map((page) => (
                <li key={page.id}>
                  <button
                    type="button"
                    onClick={() => openExisting(page)}
                    className={`flex w-full items-center justify-between gap-3 px-5 py-3 text-left hover:bg-surface-muted ${
                      selectedId === page.id ? "bg-surface-muted" : ""
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-ink">
                        {page.title}
                      </span>
                      <span className="text-xs text-muted">/{page.slug}</span>
                    </span>
                    <Pill tone={STATUS_TONE[page.status]}>{page.status}</Pill>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>

        <AdminPanel
          title={selectedId === "new" ? "New page" : selected ? "Edit page" : "Editor"}
          className="lg:col-span-3"
        >
          {!selectedId ? (
            <p className="p-5 text-sm text-muted">Select a page or create a new one.</p>
          ) : (
            <div className="space-y-4 p-5">
              <AdminField label="Title" htmlFor="page-title" required>
                <AdminInput
                  id="page-title"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                />
              </AdminField>
              <AdminField label="Slug" htmlFor="page-slug">
                <AdminInput
                  id="page-slug"
                  value={draftSlug}
                  onChange={(e) => setDraftSlug(e.target.value)}
                />
              </AdminField>
              <AdminField label="Status" htmlFor="page-status">
                <AdminSelect
                  id="page-status"
                  value={draftStatus}
                  onChange={(e) =>
                    setDraftStatus(e.target.value as "published" | "draft")
                  }
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </AdminSelect>
              </AdminField>
              <AdminField label="Body" htmlFor="page-body">
                <AdminTextarea
                  id="page-body"
                  rows={8}
                  value={draftBody}
                  onChange={(e) => setDraftBody(e.target.value)}
                  placeholder="Page content…"
                />
              </AdminField>
              <div className="flex justify-end gap-2">
                <AdminButton variant="secondary" onClick={() => setSelectedId(null)}>
                  Cancel
                </AdminButton>
                <AdminButton onClick={saveStub}>Save</AdminButton>
              </div>
            </div>
          )}
        </AdminPanel>
      </div>
    </div>
  );
}
