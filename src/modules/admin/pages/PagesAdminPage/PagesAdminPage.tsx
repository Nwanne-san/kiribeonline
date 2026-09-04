"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import OpenInNewRounded from "@mui/icons-material/OpenInNewRounded";
import { useEffect, useState } from "react";
import {
  AdminButton,
  AdminCheckboxRow,
  AdminField,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
  AdminSearchableSelect,
  AdminTextarea,
  Pill,
  type PillTone,
} from "@/modules/admin/components/ui/AdminPrimitives";
import { AdminRichTextEditor } from "@/modules/admin/components/AdminRichTextEditor";
import { TableSkeleton } from "@/modules/admin/components/ui/AdminSkeletons";
import { usePermissions } from "@/modules/admin/hooks/usePermissions";
import { adminPagesService, adminQueryKeys } from "@/services/admin.service";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { slugify } from "@/utils/helper";

type PageStatus = "published" | "draft";

type PageSummary = {
  id: string;
  title: string;
  slug: string;
  status: PageStatus;
  showInFooter: boolean;
  updatedAt?: string | null;
};

type PageDetail = PageSummary & {
  excerpt?: string | null;
  body?: Record<string, unknown> | null;
};

type PagesList = { docs: PageSummary[]; totalDocs: number };

const STATUS_TONE: Record<PageStatus, PillTone> = {
  published: "success",
  draft: "warning",
};

const NEW_PAGE = "new";

type Draft = {
  title: string;
  slug: string;
  status: PageStatus;
  excerpt: string;
  showInFooter: boolean;
  body: Record<string, unknown> | null;
};

const EMPTY_DRAFT: Draft = {
  title: "",
  slug: "",
  status: "draft",
  excerpt: "",
  showInFooter: false,
  body: null,
};

/**
 * Pages CMS — list + editor for standalone `/<slug>` pages.
 *
 * The hand-built marketing routes (About, Contact, Privacy, Terms) stay in
 * code; Next resolves those static segments first, so a CMS page can never
 * shadow one. Writes require `settings:manage`, matching the API.
 */
export function PagesAdminPage() {
  const { can } = usePermissions();
  const canManage = can("settings:manage");

  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [slugTouched, setSlugTouched] = useState(false);

  const { data, isLoading } = useQueryService<Record<string, never>, PagesList>({
    service: adminPagesService.list,
    options: { keys: [adminQueryKeys.pages] },
  });

  // The list is summary-only (no body), so the editor loads the full record
  // once a row is selected.
  const { data: detail } = useQueryService<Record<string, never>, PageDetail>({
    service: adminPagesService.detail(selectedId ?? ""),
    options: {
      keys: [adminQueryKeys.page, selectedId ?? ""],
      enabled: Boolean(selectedId) && selectedId !== NEW_PAGE,
    },
  });

  useEffect(() => {
    if (!detail || selectedId === NEW_PAGE) return;
    setDraft({
      title: detail.title,
      slug: detail.slug,
      status: detail.status,
      excerpt: detail.excerpt ?? "",
      showInFooter: detail.showInFooter,
      body: (detail.body as Record<string, unknown> | null) ?? null,
    });
    setSlugTouched(true);
  }, [detail, selectedId]);

  const docs = (data?.docs ?? []).filter(
    (p) => filter === "all" || p.status === filter
  );

  const resetEditor = () => {
    setSelectedId(null);
    setDraft(EMPTY_DRAFT);
    setSlugTouched(false);
  };

  const createPage = useMutationService<Record<string, unknown>, PageDetail>({
    service: adminPagesService.create,
    options: {
      successTitle: "Page created",
      invalidateKeys: [adminQueryKeys.pages],
      onSuccess: (page) => setSelectedId(page.id),
    },
  });

  const updatePage = useMutationService<
    { id: string } & Record<string, unknown>,
    PageDetail
  >({
    // Body carries { id, ...fields }; the partial update schema strips `id`.
    service: ({ id }) => adminPagesService.update(id),
    options: {
      successTitle: "Page saved",
      invalidateKeys: [adminQueryKeys.pages, adminQueryKeys.page],
    },
  });

  const deletePage = useMutationService<{ id: string }>({
    service: ({ id }) => adminPagesService.remove(id),
    options: {
      successTitle: "Page deleted",
      invalidateKeys: [adminQueryKeys.pages],
      onSuccess: () => resetEditor(),
    },
  });

  const openNew = () => {
    setSelectedId(NEW_PAGE);
    setDraft(EMPTY_DRAFT);
    setSlugTouched(false);
  };

  const openExisting = (page: PageSummary) => {
    setSelectedId(page.id);
    // Seed from the summary so the fields aren't blank while the detail loads.
    setDraft({
      title: page.title,
      slug: page.slug,
      status: page.status,
      excerpt: "",
      showInFooter: page.showInFooter,
      body: null,
    });
    setSlugTouched(true);
  };

  const setTitle = (title: string) =>
    setDraft((prev) => ({
      ...prev,
      title,
      // Mirror the article editor: the slug tracks the title until an editor
      // types their own, then it stops moving under them.
      slug: slugTouched ? prev.slug : slugify(title),
    }));

  const save = () => {
    const payload = {
      title: draft.title.trim(),
      slug: draft.slug.trim() || slugify(draft.title),
      status: draft.status,
      excerpt: draft.excerpt.trim(),
      showInFooter: draft.showInFooter,
      body: draft.body,
    };
    if (selectedId === NEW_PAGE) {
      createPage.mutate(payload);
    } else if (selectedId) {
      updatePage.mutate({ id: selectedId, ...payload });
    }
  };

  const isSaving = createPage.isPending || updatePage.isPending;
  const canSave = canManage && draft.title.trim().length > 0 && !isSaving;

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Pages"
        subtitle={`${data?.totalDocs ?? 0} pages · standalone content pages published at /slug`}
        action={
          canManage ? (
            <AdminButton
              leftIcon={<AddRounded className="text-[16px]" />}
              onClick={openNew}
            >
              New Page
            </AdminButton>
          ) : null
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
          title={
            selectedId === NEW_PAGE
              ? "New page"
              : selectedId
                ? "Edit page"
                : "Editor"
          }
          className="lg:col-span-3"
          action={
            selectedId && selectedId !== NEW_PAGE && draft.status === "published" ? (
              <a
                href={`/${draft.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-muted hover:text-admin-primary"
              >
                View <OpenInNewRounded className="text-[13px]" />
              </a>
            ) : null
          }
        >
          {!selectedId ? (
            <p className="p-5 text-sm text-muted">
              Select a page or create a new one.
            </p>
          ) : (
            <div className="space-y-4 p-5">
              <AdminField label="Title" htmlFor="page-title" required>
                <AdminInput
                  id="page-title"
                  value={draft.title}
                  disabled={!canManage}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </AdminField>

              <AdminField
                label="Slug"
                htmlFor="page-slug"
                hint={`Published at /${draft.slug || "…"}`}
              >
                <AdminInput
                  id="page-slug"
                  value={draft.slug}
                  disabled={!canManage}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setDraft((prev) => ({ ...prev, slug: e.target.value }));
                  }}
                />
              </AdminField>

              <AdminField label="Status" htmlFor="page-status">
                <AdminSearchableSelect
                  id="page-status"
                  value={draft.status}
                  disabled={!canManage}
                  onChange={(val) =>
                    setDraft((prev) => ({
                      ...prev,
                      status: val as PageStatus,
                    }))
                  }
                  options={[
                    { value: "draft", label: "Draft" },
                    { value: "published", label: "Published" },
                  ]}
                  searchable={false}
                />
              </AdminField>

              <AdminField
                label="Excerpt"
                htmlFor="page-excerpt"
                hint="Used as the page meta description."
              >
                <AdminTextarea
                  id="page-excerpt"
                  rows={3}
                  value={draft.excerpt}
                  disabled={!canManage}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, excerpt: e.target.value }))
                  }
                />
              </AdminField>

              {/*
                Lexical owns its editor state internally, so switching rows has
                to remount it — without the key the previous page's body would
                stay on screen after selecting a different one. Keyed on the
                loaded detail so it also remounts once the body arrives.
              */}
              <AdminRichTextEditor
                key={`${selectedId}-${detail?.id ?? "pending"}`}
                label="Body"
                value={draft.body}
                onChange={(body) => setDraft((prev) => ({ ...prev, body }))}
              />

              <AdminCheckboxRow
                label="Offer in the Navigation & Footer link picker"
                checked={draft.showInFooter}
                disabled={!canManage}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    showInFooter: e.target.checked,
                  }))
                }
              />

              <div className="flex justify-between gap-2">
                {selectedId !== NEW_PAGE && canManage ? (
                  <AdminButton
                    variant="danger"
                    leftIcon={<DeleteOutlineRounded className="text-[16px]" />}
                    disabled={deletePage.isPending}
                    onClick={() => deletePage.mutate({ id: selectedId })}
                  >
                    Delete
                  </AdminButton>
                ) : (
                  <span />
                )}
                <div className="flex gap-2">
                  <AdminButton variant="secondary" onClick={resetEditor}>
                    Cancel
                  </AdminButton>
                  <AdminButton onClick={save} disabled={!canSave}>
                    {isSaving ? "Saving…" : "Save"}
                  </AdminButton>
                </div>
              </div>
            </div>
          )}
        </AdminPanel>
      </div>
    </div>
  );
}
