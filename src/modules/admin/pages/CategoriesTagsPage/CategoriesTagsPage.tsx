"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import CheckRounded from "@mui/icons-material/CheckRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import DragIndicatorRounded from "@mui/icons-material/DragIndicatorRounded";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import SearchRounded from "@mui/icons-material/SearchRounded";
import VisibilityOffOutlined from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlined from "@mui/icons-material/VisibilityOutlined";
import { useEffect, useMemo, useState } from "react";
import { AdminButton, AdminPanel, CategoryTag } from "@/modules/admin/components/ui/AdminPrimitives";
import { ListSkeleton, Skeleton } from "@/modules/admin/components/ui/AdminSkeletons";
import { usePermissions } from "@/modules/admin/hooks/usePermissions";
import {
  adminCategoriesService,
  adminQueryKeys,
  adminTagsService,
} from "@/services/admin.service";
import { CATEGORY_COLORS, type CategorySlug } from "@/theme/category-colors";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useQueryService } from "@/utils/hooks/useQueryService";
import type { AdminCategory } from "@/server/modules/categories/categories.types";
import type { AdminTag } from "@/server/modules/tags/tags.types";

/* ───────────────────────────────────────────────────────────── Helpers */

function categoryColor(cat: Pick<AdminCategory, "slug" | "brandColor">): string {
  return CATEGORY_COLORS[cat.slug as CategorySlug]?.bg ?? cat.brandColor ?? "#4b5563";
}

/** Badge-color palette for the create-category form (2×4 swatch grid). */
const COLOR_SWATCHES = [
  "#7f0400",
  "#e6a313",
  "#64748b",
  "#4f6ef7",
  "#9333ea",
  "#4e9a93",
  "#5e9c6e",
  "#d45d87",
] as const;

const INPUT_CLASS =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted-soft transition-colors focus:border-burgundy focus:outline-none focus:ring-2 focus:ring-burgundy/20";

const LABEL_CLASS =
  "mb-1.5 block text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted";

/** Slugify a category name: lowercase, dashes for spaces, strip invalid chars. */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");
}

/* ───────────────────────────────────────────────────────────── Page */

export function CategoriesTagsPage() {
  const { can } = usePermissions();
  const canManage = can("taxonomy:manage");

  const { data: catData, isLoading: categoriesLoading } = useQueryService<
    Record<string, never>,
    { docs: AdminCategory[] }
  >({
    service: adminCategoriesService.list,
    options: { keys: [adminQueryKeys.categories] },
  });
  const { data: tagData, isLoading: tagsLoading } = useQueryService<
    Record<string, never>,
    { docs: AdminTag[] }
  >({
    service: adminTagsService.list,
    options: { keys: [adminQueryKeys.tags] },
  });

  const categories = useMemo(() => catData?.docs ?? [], [catData]);
  const tags = tagData?.docs ?? [];

  /* Local, optimistic order for drag-to-reorder; resynced from the query. */
  const [order, setOrder] = useState<AdminCategory[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  useEffect(() => {
    setOrder(categories);
  }, [categories]);

  const [showCreate, setShowCreate] = useState(false);

  /* ───────────────────────────────────────── Mutations */

  const createCategory = useMutationService<{
    name: string;
    slug: string;
    description?: string;
    brandColor: string;
    showInNav: boolean;
  }>({
    service: adminCategoriesService.create,
    options: {
      invalidateKeys: [adminQueryKeys.categories],
      successMessage: "Category created.",
      onSuccess: () => setShowCreate(false),
    },
  });

  const reorderCategories = useMutationService<{ ids: string[] }>({
    service: adminCategoriesService.reorder,
    options: { invalidateKeys: [adminQueryKeys.categories] },
  });

  const toggleVisibility = useMutationService<{ id: string; showInNav: boolean }>({
    // Body carries { id, showInNav }; the partial update schema strips `id`.
    service: (vars) => adminCategoriesService.update(vars.id),
    options: { invalidateKeys: [adminQueryKeys.categories] },
  });

  const createTag = useMutationService<{ name: string }>({
    service: adminTagsService.create,
    options: {
      invalidateKeys: [adminQueryKeys.tags],
      successMessage: "Tag created.",
    },
  });

  const deleteTag = useMutationService<{ id: string }>({
    service: (vars) => adminTagsService.remove(vars.id),
    options: { invalidateKeys: [adminQueryKeys.tags] },
  });

  /* ───────────────────────────────────────── Drag reorder */

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) return setDragId(null);
    const from = order.findIndex((c) => c.id === dragId);
    const to = order.findIndex((c) => c.id === targetId);
    if (from === -1 || to === -1) return setDragId(null);
    const next = [...order];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setOrder(next);
    setDragId(null);
    reorderCategories.mutate({ ids: next.map((c) => c.id) });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="relative inline-block pb-2 font-headline text-2xl font-bold text-burgundy after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-12 after:bg-mustard after:content-['']">
            Categories &amp; Tags
          </h1>
          <p className="mt-2 text-sm text-muted">
            {categories.length} categor{categories.length === 1 ? "y" : "ies"} · {tags.length} tag
            {tags.length === 1 ? "" : "s"}
          </p>
        </div>
        {canManage && (
          <AdminButton
            variant="primary"
            leftIcon={<AddRounded sx={{ fontSize: 16 }} />}
            onClick={() => setShowCreate((v) => !v)}
            className="self-start"
          >
            Add Category
          </AdminButton>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
        {/* ── Categories ── */}
        <AdminPanel
          title="Categories"
          action={
            canManage ? (
              <AdminButton
                variant="ghost"
                size="sm"
                leftIcon={<AddRounded sx={{ fontSize: 14 }} />}
                onClick={() => setShowCreate((v) => !v)}
              >
                Add New
              </AdminButton>
            ) : undefined
          }
        >
          <div>
            {categoriesLoading && <ListSkeleton rows={6} />}
            {!categoriesLoading &&
              order.map((cat) => (
              <div
                key={cat.id}
                draggable={canManage}
                onDragStart={() => canManage && setDragId(cat.id)}
                onDragOver={(e) => canManage && e.preventDefault()}
                onDrop={() => canManage && handleDrop(cat.id)}
                onDragEnd={() => setDragId(null)}
                className={`flex items-center gap-3 border-b border-border-soft px-5 py-3.5 transition-colors last:border-0 hover:bg-surface-alt ${
                  dragId === cat.id ? "opacity-50" : ""
                }`}
              >
                {canManage && (
                  <DragIndicatorRounded
                    sx={{ fontSize: 18 }}
                    className="shrink-0 cursor-grab text-muted-soft active:cursor-grabbing"
                    aria-hidden
                  />
                )}
                <CategoryTag label={cat.name} color={categoryColor(cat)} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate text-sm text-ink-secondary">
                  {cat.description || "—"}
                </span>
                <span className="shrink-0 whitespace-nowrap text-xs text-muted">
                  {cat.articleCount} article{cat.articleCount === 1 ? "" : "s"}
                </span>
                {canManage ? (
                  <button
                    type="button"
                    onClick={() => toggleVisibility.mutate({ id: cat.id, showInNav: !cat.showInNav })}
                    disabled={toggleVisibility.isPending}
                    aria-label={
                      cat.showInNav === false
                        ? `Show ${cat.name} in navigation`
                        : `Hide ${cat.name} from navigation`
                    }
                    className="shrink-0 rounded p-1 text-muted-soft transition-colors hover:bg-surface-muted hover:text-ink"
                  >
                    {cat.showInNav === false ? (
                      <VisibilityOffOutlined sx={{ fontSize: 16 }} />
                    ) : (
                      <VisibilityOutlined sx={{ fontSize: 16 }} />
                    )}
                  </button>
                ) : (
                  <span className="shrink-0 p-1 text-muted-soft" aria-hidden>
                    <VisibilityOutlined sx={{ fontSize: 16 }} />
                  </span>
                )}
              </div>
            ))}
            {!categoriesLoading && order.length === 0 && (
              <div className="px-5 py-10 text-center text-sm text-muted-soft">No categories yet.</div>
            )}
          </div>
        </AdminPanel>

        {/* ── New Category (replaces Tags while creating) ── */}
        {showCreate && canManage ? (
          <CreateCategoryPanel
            pending={createCategory.isPending}
            onClose={() => setShowCreate(false)}
            onSubmit={(payload) => createCategory.mutate(payload)}
          />
        ) : (
        <AdminPanel title={`Tags (${tags.length})`}>
          <div className="space-y-4 p-5">
            {canManage && (
              <TagControls
                pending={createTag.isPending}
                onCreate={(name) => createTag.mutate({ name })}
              >
                {(search) =>
                  tagsLoading ? (
                    <TagChipsSkeleton />
                  ) : (
                    <TagList
                      tags={tags}
                      search={search}
                      canManage={canManage}
                      deleting={deleteTag.isPending}
                      onDelete={(id) => deleteTag.mutate({ id })}
                    />
                  )
                }
              </TagControls>
            )}
            {!canManage &&
              (tagsLoading ? (
                <TagChipsSkeleton />
              ) : (
                <TagList tags={tags} search="" canManage={false} deleting={false} onDelete={() => {}} />
              ))}
          </div>
        </AdminPanel>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────── Sub-components */

/** Chip-shaped placeholders shown while the tag list loads. */
function TagChipsSkeleton() {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-7 w-24 rounded-md" />
      ))}
    </div>
  );
}

function CreateCategoryPanel({
  pending,
  onClose,
  onSubmit,
}: {
  pending: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    slug: string;
    description?: string;
    brandColor: string;
    showInNav: boolean;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [brandColor, setBrandColor] = useState<string>(COLOR_SWATCHES[0]);
  const [showInNav, setShowInNav] = useState(true);

  function handleName(value: string) {
    setName(value);
    if (!slugEdited) setSlug(slugify(value));
  }

  function handleSlug(value: string) {
    setSlugEdited(true);
    setSlug(slugify(value));
  }

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit({
      name: trimmed,
      slug: slug.trim() || slugify(trimmed),
      description: description.trim() || undefined,
      brandColor,
      showInNav,
    });
  }

  return (
    <AdminPanel
      title="New Category"
      action={
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid h-8 w-8 place-items-center rounded-lg text-muted-soft transition-colors hover:bg-surface-muted hover:text-ink"
        >
          <CloseRounded sx={{ fontSize: 18 }} />
        </button>
      }
    >
      <div className="space-y-4 p-5">
        {/* Category name */}
        <div>
          <label className={LABEL_CLASS} htmlFor="new-category-name">
            Category Name
          </label>
          <input
            id="new-category-name"
            className={INPUT_CLASS}
            value={name}
            onChange={(e) => handleName(e.target.value)}
            placeholder="e.g. Documentary"
            onKeyDown={(e) => e.key === "Enter" && submit()}
            autoFocus
          />
        </div>

        {/* Slug */}
        <div>
          <label className={LABEL_CLASS} htmlFor="new-category-slug">
            Slug
          </label>
          <div className="relative">
            <span
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-soft"
              aria-hidden
            >
              /
            </span>
            <input
              id="new-category-slug"
              className={`${INPUT_CLASS} pl-7`}
              value={slug}
              onChange={(e) => handleSlug(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="/"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className={LABEL_CLASS} htmlFor="new-category-description">
            Description
          </label>
          <textarea
            id="new-category-description"
            rows={3}
            className={`${INPUT_CLASS} resize-none`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description…"
          />
        </div>

        {/* Badge color */}
        <div>
          <span className={LABEL_CLASS}>Badge Color</span>
          <div className="grid grid-cols-4 gap-2">
            {COLOR_SWATCHES.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setBrandColor(color)}
                aria-label={`Badge color ${color}`}
                aria-pressed={brandColor === color}
                className={`grid h-11 w-full place-items-center rounded-md transition-transform hover:scale-105 ${
                  brandColor === color
                    ? "ring-2 ring-ink/30 ring-offset-2 ring-offset-surface"
                    : ""
                }`}
                style={{ backgroundColor: color }}
              >
                {brandColor === color && (
                  <CheckRounded sx={{ fontSize: 18 }} className="text-white" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Visibility */}
        <div className="flex items-center justify-between">
          <span className={`${LABEL_CLASS} mb-0`}>Visibility</span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              role="switch"
              aria-checked={showInNav}
              aria-label="Show in navigation"
              onClick={() => setShowInNav((v) => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-burgundy/30 ${
                showInNav ? "bg-[#7f0400]" : "bg-border"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  showInNav ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-sm text-ink-secondary">Show in navigation</span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-1">
          <AdminButton
            variant="primary"
            leftIcon={<SaveOutlined sx={{ fontSize: 16 }} />}
            onClick={submit}
            disabled={pending || !name.trim()}
            className="w-full"
          >
            {pending ? "Creating…" : "Create Category"}
          </AdminButton>
        </div>
      </div>
    </AdminPanel>
  );
}

function TagControls({
  pending,
  onCreate,
  children,
}: {
  pending: boolean;
  onCreate: (name: string) => void;
  children: (search: string) => React.ReactNode;
}) {
  const [search, setSearch] = useState("");
  const [newTag, setNewTag] = useState("");

  function add() {
    const trimmed = newTag.trim();
    if (!trimmed) return;
    onCreate(trimmed);
    setNewTag("");
  }

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <SearchRounded
            sx={{ fontSize: 16 }}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-soft"
            aria-hidden
          />
          <input
            className={`${INPUT_CLASS} pl-9`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tags…"
            aria-label="Search tags"
          />
        </div>
        <div className="flex gap-2">
          <input
            className={`${INPUT_CLASS} sm:w-40`}
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="New tag name…"
            aria-label="New tag name"
          />
          <AdminButton
            variant="primary"
            size="sm"
            onClick={add}
            disabled={pending || !newTag.trim()}
            aria-label="Add tag"
            leftIcon={<AddRounded sx={{ fontSize: 18 }} />}
            className="self-stretch"
          >
            <span className="sr-only">Add tag</span>
          </AdminButton>
        </div>
      </div>
      {children(search)}
    </>
  );
}

function TagList({
  tags,
  search,
  canManage,
  deleting,
  onDelete,
}: {
  tags: AdminTag[];
  search: string;
  canManage: boolean;
  deleting: boolean;
  onDelete: (id: string) => void;
}) {
  const q = search.trim().toLowerCase();
  const filtered = q ? tags.filter((t) => t.name.toLowerCase().includes(q)) : tags;

  if (filtered.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-soft">
        {tags.length === 0 ? "No tags yet." : "No tags match your search."}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {filtered.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1 text-[0.8125rem] transition-colors hover:border-border-soft"
        >
          <span className="font-medium text-ink">{tag.name}</span>
          <span className="text-muted-soft">({tag.articleCount})</span>
          {canManage && (
            <button
              type="button"
              onClick={() => onDelete(tag.id)}
              disabled={deleting}
              aria-label={`Delete tag ${tag.name}`}
              className="ml-0.5 grid h-4 w-4 place-items-center rounded-full text-muted-soft transition-colors hover:bg-[#fee4e2] hover:text-[#b42318] disabled:opacity-50"
            >
              <CloseRounded sx={{ fontSize: 12 }} />
            </button>
          )}
        </span>
      ))}
    </div>
  );
}
