"use client";

import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CheckOutlined from "@mui/icons-material/CheckOutlined";
import ExpandLessRounded from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import LockOutlined from "@mui/icons-material/LockOutlined";
import RateReviewOutlined from "@mui/icons-material/RateReviewOutlined";
import RefreshOutlined from "@mui/icons-material/RefreshOutlined";
import SaveRounded from "@mui/icons-material/SaveRounded";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ApiMethods } from "../../../../../types/service";
import { AdminRoutes } from "@/routes/admin.routes";
import { AdminChipSelect } from "@/modules/admin/components/AdminUi";
import {
  AdminButton,
  AdminCheckboxRow,
  AdminField,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
  AdminTextarea,
} from "@/modules/admin/components/ui/AdminPrimitives";
import { PanelListSkeleton } from "@/modules/admin/components/ui/AdminSkeletons";
import { AdminRichTextEditor } from "@/modules/admin/components/AdminRichTextEditor";
import { MediaPicker } from "@/modules/admin/components/MediaPicker";
import {
  PublishChecklistDialog,
  type ChecklistItem,
} from "@/modules/admin/components/PublishChecklist";
import { useKiribeToast } from "@/modules/shared/components/feedback/KiribeSnackbar";
import { usePermissions } from "@/modules/admin/hooks/usePermissions";
import { useAutosave } from "@/modules/admin/hooks/useAutosave";
import { useUnsavedChangesGuard } from "@/modules/admin/hooks/useUnsavedChangesGuard";
import { useQueryClient } from "@tanstack/react-query";
import { useQueryService } from "@/utils/hooks/useQueryService";
import client from "@/utils/client";
import { unwrapApiData } from "@/lib/api/unwrap";
import { slugify } from "@/utils/helper";
import { ARTICLE_AUTOSAVE_DEBOUNCE_MS, DEFAULT_DEBOUNCE_MS } from "@/constants";
import type { AdminMediaRef } from "@/server/modules";
import {
  normalizeLexicalBody,
  textToLexical,
} from "@/server/shared/text-to-lexical";

type Category = { id: string; name: string; brandColor?: string | null };
type Tag = { id: string; name: string; brandColor?: string | null };
type MediaRef = { id: string; url?: string; alt?: string };
type ArticleDoc = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  body: Record<string, unknown>;
  status: string;
  publishedAt?: string;
  featured?: boolean;
  featuredPriority?: number;
  categories?: Category[];
  tags?: Tag[];
  heroImage?: MediaRef | string;
  author?: { id: string | number; name?: string | null } | string | null;
  seo?: {
    title?: string;
    description?: string;
    ogImage?: MediaRef | string;
  };
  viewCount?: number;
};

type ArticleEditorPageProps = { articleId?: string };

/**
 * Role-scoped status options. Writers/contributors (edit-only) see just Draft
 * and "Submit for review" — the editorial-submission spine. Editors and above
 * (publish capability) see the full lifecycle so they can move a submission
 * through to scheduled/published/archived. Server enforces the same rule.
 */
const EDIT_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "in_review", label: "Submit for review" },
];

const PUBLISH_STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "in_review", label: "In review" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

/** Statuses safe to autosave — anything else is a publish-adjacent write. */
const AUTOSAVE_STATUSES = new Set(["draft", "in_review"]);

/** Statuses that gate the publish-checklist dialog. */
const PUBLISH_STATUSES = new Set(["published", "scheduled"]);

/** Shape of the outgoing save payload — matches `articleInputSchema`. */
type SavePayload = {
  title: string;
  slug?: string;
  excerpt: string;
  body: Record<string, unknown>;
  status: string;
  publishedAt: string | null;
  featured: boolean;
  featuredPriority: number;
  categoryIds: string[];
  tagIds: string[];
  heroImageId: string | null;
  authorId?: string | null;
  seo: {
    title?: string;
    description?: string;
    ogImageId: string | null;
  };
};

function nowHhMm(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * The editor is a big form; splitting the state into sub-components would
 * fight React Query's cache eviction and MediaPicker's parent-controlled
 * shape. Individual helpers are extracted where they earn their keep
 * (checklist, hooks); orchestration lives here.
 */
export function ArticleEditorPage({ articleId }: ArticleEditorPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = Boolean(articleId);
  const { can, me } = usePermissions();
  const { showToast } = useKiribeToast();

  const canPublish = can("articles:publish");
  const canManageUsers = can("users:manage");
  const canPickAuthor = canPublish || canManageUsers;

  /* ── Form state ── */

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState<Record<string, unknown>>(() => textToLexical(""));
  const [editorReady, setEditorReady] = useState(!articleId);
  const [loading, setLoading] = useState(Boolean(articleId));
  const [status, setStatus] = useState("draft");
  const [publishedAt, setPublishedAt] = useState("");
  const [featured, setFeatured] = useState(false);
  const [featuredPriority, setFeaturedPriority] = useState(0);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [heroImage, setHeroImage] = useState<AdminMediaRef | null>(null);
  const [authorId, setAuthorId] = useState<string>("");
  const [seoOpen, setSeoOpen] = useState(false);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoOgImage, setSeoOgImage] = useState<AdminMediaRef | null>(null);
  const [viewCount, setViewCount] = useState<number | null>(null);

  /* ── Save orchestration state ── */

  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [pendingPublish, setPendingPublish] = useState<
    { targetStatus: "published" | "scheduled"; closeAfter: boolean } | null
  >(null);

  // Dirty tracking. `dirtyCount` increments on every edit — the save flow
  // snapshots it before the await and only clears `dirty` when the snapshot
  // still matches on return, so a save that lands mid-edit doesn't drop the
  // "unsaved" indicator.
  const [dirty, setDirty] = useState(false);
  const dirtyCount = useRef(0);
  const bumpDirty = useCallback(() => {
    dirtyCount.current += 1;
    setDirty(true);
  }, []);

  /* ── Load taxonomies ── */

  const { data: categories } = useQueryService<
    Record<string, never>,
    { docs: Category[] }
  >({
    service: { path: "/api/admin/categories", method: ApiMethods.GET },
    options: { keys: ["admin", "categories"] },
  });

  const { data: tags } = useQueryService<Record<string, never>, { docs: Tag[] }>({
    service: { path: "/api/admin/tags", method: ApiMethods.GET },
    options: { keys: ["admin", "tags"] },
  });

  const { data: authorList } = useQueryService<
    Record<string, never>,
    { docs: Array<{ id: string; name: string }> }
  >({
    service: { path: "/api/admin/articles/authors", method: ApiMethods.GET },
    options: {
      keys: ["admin", "articles", "authors"],
      // Only fetch when the picker will render — avoids a 403 for writers.
      enabled: canPickAuthor,
    },
  });

  /* ── Hydrate existing doc ── */

  useEffect(() => {
    if (!articleId) return;
    void (async () => {
      try {
        const res = await client.request<never, ArticleDoc>({
          path: `/api/admin/articles/${articleId}`,
          method: ApiMethods.GET,
        });
        const doc = unwrapApiData(res);
        setTitle(doc.title);
        setSlug(doc.slug);
        // Hydrating from an existing slug counts as user-authored — don't
        // let the auto-from-title reformat it on the next title keystroke.
        setSlugTouched(true);
        setExcerpt(doc.excerpt ?? "");
        setBody(normalizeLexicalBody(doc.body));
        setEditorReady(true);
        setStatus(doc.status);
        setPublishedAt(doc.publishedAt ? doc.publishedAt.slice(0, 16) : "");
        setFeatured(Boolean(doc.featured));
        setFeaturedPriority(doc.featuredPriority ?? 0);
        setCategoryIds((doc.categories ?? []).map((c) => String(c.id)));
        setTagIds((doc.tags ?? []).map((t) => String(t.id)));
        const hero = doc.heroImage;
        if (hero && typeof hero === "object") {
          setHeroImage({ id: String(hero.id), url: hero.url, alt: hero.alt });
        }
        const author = doc.author;
        if (author && typeof author === "object") {
          setAuthorId(String(author.id));
        } else if (typeof author === "string") {
          setAuthorId(author);
        }
        setSeoTitle(doc.seo?.title ?? "");
        setSeoDescription(doc.seo?.description ?? "");
        const og = doc.seo?.ogImage;
        if (og && typeof og === "object") {
          setSeoOgImage({ id: String(og.id), url: og.url, alt: og.alt });
        }
        setViewCount(doc.viewCount ?? null);
      } finally {
        setLoading(false);
      }
    })();
  }, [articleId]);

  // On a new article, default authorId to the current user once /me loads.
  useEffect(() => {
    if (isEdit) return;
    if (authorId) return;
    if (me?.id) setAuthorId(String(me.id));
  }, [isEdit, authorId, me?.id]);

  // Keep slug in sync with title until the user touches it manually.
  useEffect(() => {
    if (slugTouched) return;
    setSlug(slugify(title));
  }, [title, slugTouched]);

  /* ── Slug rules & uniqueness check ── */

  // Once published, the slug is a live URL — locking it in the UI prevents
  // silent link rot. Editors can still manually change the DB row via the
  // Payload studio if they truly need to, but the custom admin won't do it.
  const slugReadOnly = status === "published";

  useEffect(() => {
    setSlugError(null);
    if (slugReadOnly) return;
    const candidate = slug.trim();
    if (!candidate) return;
    if (!/^[a-z0-9-]+$/.test(candidate)) {
      setSlugError(
        "Slug may only contain lowercase letters, numbers, and dashes."
      );
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const qs = new URLSearchParams({ slug: candidate });
        if (articleId) qs.set("excludeId", articleId);
        const res = await client.request<never, { available: boolean }>({
          path: `/api/admin/articles/slug-check?${qs.toString()}`,
          method: ApiMethods.GET,
        });
        if (cancelled) return;
        const available = unwrapApiData(res).available;
        setSlugError(available ? null : "This slug is already taken.");
      } catch {
        // Silent fail — the server's unique constraint will catch it on save,
        // and a transient network hiccup shouldn't block editing.
      }
    }, DEFAULT_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [slug, articleId, slugReadOnly]);

  /* ── Payload builder ── */

  const buildPayload = useCallback((): SavePayload => ({
    title,
    // Only send slug when the user has authored it (or it was hydrated on
    // edit). New articles without a touched slug let the server derive
    // one from the title via `slugField`.
    slug: slug.trim() || undefined,
    excerpt,
    body,
    status,
    publishedAt: publishedAt || null,
    featured,
    featuredPriority,
    categoryIds,
    tagIds,
    heroImageId: heroImage?.id ?? null,
    // Only include authorId when the picker was rendered — a writer's editor
    // never sends the field, so their save can't overwrite an editor-assigned
    // byline. New articles fall through to the server default (the actor).
    authorId: canPickAuthor && authorId ? authorId : undefined,
    seo: {
      title: seoTitle || undefined,
      description: seoDescription || undefined,
      ogImageId: seoOgImage?.id ?? null,
    },
  }), [
    title,
    slug,
    excerpt,
    body,
    status,
    publishedAt,
    featured,
    featuredPriority,
    categoryIds,
    tagIds,
    heroImage?.id,
    authorId,
    canPickAuthor,
    seoTitle,
    seoDescription,
    seoOgImage?.id,
  ]);

  /* ── Core save routine ── */

  const persist = useCallback(
    async (
      overrideStatus?: string,
      opts?: { silent?: boolean; closeAfter?: boolean }
    ): Promise<{ id: string } | null> => {
      const snapshot = dirtyCount.current;
      const basePayload = buildPayload();
      const payload = overrideStatus
        ? { ...basePayload, status: overrideStatus }
        : basePayload;

      const path = isEdit
        ? `/api/admin/articles/${articleId}`
        : "/api/admin/articles";
      const method = isEdit ? ApiMethods.PATCH : ApiMethods.POST;

      setSaving(true);
      try {
        // Payload's Postgres adapter returns numeric ids; the route wraps in
        // apiSuccess but the id shape stays as-is. Accept both so the
        // hydration + redirect paths are type-safe.
        const res = await client.request<SavePayload, { id: string | number }>({
          path,
          method,
          data: payload,
        });
        const raw = unwrapApiData(res);
        const saved = { id: String(raw.id) };
        // Snapshot guard: if edits landed while the request was in flight,
        // leave `dirty` alone — otherwise the indicator would clear even
        // though the on-screen form has drifted from what's persisted.
        if (dirtyCount.current === snapshot) {
          setDirty(false);
        }
        setLastSavedAt(nowHhMm());
        if (!opts?.silent) {
          showToast({
            message: "Article saved",
            severity: "success",
          });
        }
        // Any successful save mutates the server's article list — invalidate
        // so the list and dashboard tiles refetch when the user navigates
        // back. React Query dedupes concurrent refetches so this is cheap.
        queryClient.invalidateQueries({ queryKey: ["admin", "articles"] });
        queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });

        if (opts?.closeAfter) {
          // Use navigateSafely — dirty may still be true in state even though
          // we called setDirty(false) synchronously above (React batches),
          // so the router.push is likely still guarded on this tick.
          navigateSafely(AdminRoutes.articles, "push");
        } else if (!isEdit && saved.id) {
          // Same reasoning for the new-article auto-redirect: without the
          // bypass the user gets a "Leave without saving?" prompt on the
          // very save that cleared the dirty flag.
          navigateSafely(`${AdminRoutes.articles}/${saved.id}`, "replace");
        }
        return saved;
      } catch (error) {
        const err = error as { message?: string; status?: number };
        if (!opts?.silent) {
          showToast({
            message: "Could not save article",
            description: err?.message ?? "Please try again.",
            severity: "error",
          });
        }
        return null;
      } finally {
        setSaving(false);
      }
    },
    [articleId, buildPayload, isEdit, router, showToast]
  );

  /* ── Autosave ── */

  const autosaveSignature = useMemo(
    () =>
      JSON.stringify({
        title,
        slug,
        excerpt,
        status,
        publishedAt,
        featured,
        featuredPriority,
        categoryIds,
        tagIds,
        heroId: heroImage?.id ?? null,
        authorId,
        seoTitle,
        seoDescription,
        ogId: seoOgImage?.id ?? null,
        // Cheap surrogate for body changes — the Lexical tree can be large;
        // stringifying it every keystroke would be wasteful. Length of the
        // root children array plus JSON size gives us a debounce trigger
        // without the full stringify cost.
        bodyKey:
          (body as { root?: { children?: unknown[] } })?.root?.children?.length ??
          0,
      }),
    [
      title,
      slug,
      excerpt,
      status,
      publishedAt,
      featured,
      featuredPriority,
      categoryIds,
      tagIds,
      heroImage?.id,
      authorId,
      seoTitle,
      seoDescription,
      seoOgImage?.id,
      body,
    ]
  );

  // Autosave only fires when: (a) editing an existing article (POST needs a
  // deliberate first save), (b) status is draft or in_review (never publish),
  // (c) form is dirty, (d) not currently saving, (e) no slug error.
  const autosaveEnabled =
    isEdit && AUTOSAVE_STATUSES.has(status) && dirty && !saving && !slugError;

  useAutosave(
    autosaveEnabled,
    autosaveSignature,
    () => {
      // Fire-and-forget — the persist call updates its own state; we don't
      // want to hold the timer's caller open.
      void persist(undefined, { silent: true });
    },
    ARTICLE_AUTOSAVE_DEBOUNCE_MS
  );

  /* ── Unsaved changes guard (beforeunload + in-app nav) ── */

  const { navigateSafely } = useUnsavedChangesGuard(dirty && !saving);

  /* ── Status picker ── */

  const statusOptions = useMemo(() => {
    const base = canPublish ? PUBLISH_STATUS_OPTIONS : EDIT_STATUS_OPTIONS;
    if (base.some((o) => o.value === status)) return base;
    return [...base, { value: status, label: `${status} (locked)` }];
  }, [canPublish, status]);

  /* ── Publish checklist ── */

  const checklistItems = useMemo<ChecklistItem[]>(() => {
    return [
      { key: "hero", label: "Hero image", ok: Boolean(heroImage), hard: true },
      {
        key: "heroAlt",
        label: "Hero image alt text",
        ok: Boolean(heroImage && heroImage.alt?.trim()),
        hard: true,
      },
      {
        key: "excerpt",
        label: "Excerpt",
        ok: excerpt.trim().length > 0,
        hard: true,
      },
      {
        key: "category",
        label: "At least one category",
        ok: categoryIds.length > 0,
        hard: true,
      },
      {
        key: "seoTitle",
        label: "SEO title (recommended)",
        ok: seoTitle.trim().length > 0,
        hard: false,
      },
      {
        key: "seoDescription",
        label: "SEO description (recommended)",
        ok: seoDescription.trim().length > 0,
        hard: false,
      },
    ];
  }, [heroImage, excerpt, categoryIds.length, seoTitle, seoDescription]);

  const publishBlocked = checklistItems.some((item) => item.hard && !item.ok);

  /* ── Submit handlers ── */

  const commonSaveGuards = (): boolean => {
    if (slugError) {
      showToast({
        message: "Fix the slug before saving",
        severity: "error",
      });
      return false;
    }
    if (!title.trim()) {
      showToast({ message: "Title is required", severity: "error" });
      return false;
    }
    return true;
  };

  const handleSave = async (closeAfter: boolean) => {
    if (!commonSaveGuards()) return;

    // Publishing/scheduling goes through the checklist first so the editor
    // can't ship a piece missing a hero or excerpt in one click.
    if (PUBLISH_STATUSES.has(status)) {
      setPendingPublish({
        targetStatus: status as "published" | "scheduled",
        closeAfter,
      });
      return;
    }
    await persist(undefined, { closeAfter });
  };

  const handleConfirmPublish = async () => {
    if (!pendingPublish) return;
    const { targetStatus, closeAfter } = pendingPublish;
    const result = await persist(targetStatus, { closeAfter });
    if (result) {
      setPendingPublish(null);
    }
  };

  const handleCancel = () => {
    // The unsaved-changes guard handles the confirm on dirty state; a clean
    // form goes straight back to the list.
    router.push(AdminRoutes.articles);
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <AdminPanel>
          <PanelListSkeleton rows={4} />
        </AdminPanel>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e: React.FormEvent) => {
        e.preventDefault();
        void handleSave(false);
      }}
      className="space-y-5"
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-xs text-muted-soft">
        <NextLink
          href={AdminRoutes.articles}
          className="hover:text-ink-secondary hover:underline"
        >
          Articles
        </NextLink>
        <ChevronRightIcon sx={{ fontSize: 14 }} className="text-muted-soft" />
        <span className="text-ink-secondary">
          {isEdit ? "Edit article" : "New article"}
        </span>
      </div>

      <AdminPageHeader
        title={isEdit ? "Edit article" : "New article"}
        action={
          <div className="flex items-center gap-3">
            {isEdit && viewCount !== null ? (
              <span className="text-xs text-muted">
                {viewCount.toLocaleString()} views
              </span>
            ) : null}
            <SavedIndicator saving={saving} dirty={dirty} lastSavedAt={lastSavedAt} />
          </div>
        }
      />

      {isEdit && status === "in_review" ? (
        <div className="flex items-start gap-3 rounded-lg border border-[#F3D7CB] bg-[#FDF3EF] px-4 py-3 text-sm text-burgundy">
          <RateReviewOutlined sx={{ fontSize: 20 }} className="mt-0.5 shrink-0" />
          <p className="min-w-0">
            {canPublish
              ? "This article is awaiting your review. Move it to Published or Scheduled when it’s ready — or back to Draft to send it for more work."
              : "This article has been submitted for review. An editor will take it from here."}
          </p>
        </div>
      ) : null}

      {/* Two-column layout: body left, sidebar right. Stacks on mobile. */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] lg:items-start">
        {/* Body column */}
        <div className="space-y-5">
          <AdminPanel title="Article">
            <div className="space-y-4 p-5">
              <AdminField label="Title" htmlFor="ae-title" required>
                <AdminInput
                  id="ae-title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    bumpDirty();
                  }}
                  placeholder="Working title — shape it after the piece lands."
                />
              </AdminField>

              <AdminField
                label="Excerpt"
                htmlFor="ae-excerpt"
                hint="Short standfirst shown on article cards and OG previews."
              >
                <AdminTextarea
                  id="ae-excerpt"
                  value={excerpt}
                  onChange={(e) => {
                    setExcerpt(e.target.value);
                    bumpDirty();
                  }}
                  rows={2}
                />
              </AdminField>
            </div>
          </AdminPanel>

          {editorReady ? (
            <AdminPanel title="Body">
              <div className="p-5">
                <AdminRichTextEditor
                  key={articleId ?? "new"}
                  label="Body"
                  value={body}
                  onChange={(next) => {
                    setBody(next);
                    bumpDirty();
                  }}
                  required
                />
              </div>
            </AdminPanel>
          ) : null}

          <AdminPanel>
            <button
              type="button"
              onClick={() => setSeoOpen(!seoOpen)}
              className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-surface-alt"
            >
              <h2 className="relative pb-1 font-headline text-[0.8125rem] font-bold uppercase tracking-[0.12em] text-burgundy after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-8 after:bg-mustard after:content-['']">
                SEO &amp; metadata
              </h2>
              {seoOpen ? (
                <ExpandLessRounded sx={{ fontSize: 20 }} className="text-muted" />
              ) : (
                <ExpandMoreRounded sx={{ fontSize: 20 }} className="text-muted" />
              )}
            </button>
            {seoOpen && (
              <div className="space-y-4 border-t border-border-soft p-5">
                <AdminField
                  label="SEO title"
                  htmlFor="ae-seo-title"
                  hint="Overrides the article title in search results and social cards."
                >
                  <AdminInput
                    id="ae-seo-title"
                    value={seoTitle}
                    onChange={(e) => {
                      setSeoTitle(e.target.value);
                      bumpDirty();
                    }}
                  />
                </AdminField>
                <AdminField label="SEO description" htmlFor="ae-seo-desc">
                  <AdminTextarea
                    id="ae-seo-desc"
                    value={seoDescription}
                    onChange={(e) => {
                      setSeoDescription(e.target.value);
                      bumpDirty();
                    }}
                    rows={3}
                  />
                </AdminField>
                <MediaPicker
                  label="OG image"
                  value={seoOgImage}
                  onChange={(next) => {
                    setSeoOgImage(next);
                    bumpDirty();
                  }}
                />
              </div>
            )}
          </AdminPanel>
        </div>

        {/* Sidebar column */}
        <aside className="space-y-5">
          <AdminPanel title="Publish">
            <div className="space-y-4 p-5">
              <AdminField
                label="Status"
                htmlFor="ae-status"
                required
                hint={
                  !canPublish
                    ? "Submit for review to send this piece to an editor."
                    : undefined
                }
              >
                <AdminSelect
                  id="ae-status"
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    bumpDirty();
                  }}
                >
                  {statusOptions.map((s) => (
                    <option
                      key={s.value}
                      value={s.value}
                      disabled={s.label.endsWith("(locked)")}
                    >
                      {s.label}
                    </option>
                  ))}
                </AdminSelect>
              </AdminField>

              <AdminField label="Publish date" htmlFor="ae-publish-date">
                <AdminInput
                  id="ae-publish-date"
                  type="datetime-local"
                  value={publishedAt}
                  onChange={(e) => {
                    setPublishedAt(e.target.value);
                    bumpDirty();
                  }}
                />
              </AdminField>

              <AdminField
                label="URL slug"
                htmlFor="ae-slug"
                error={slugError ?? undefined}
                hint={
                  slugReadOnly
                    ? "The slug is locked once an article is published."
                    : slugTouched
                      ? "Lowercase letters, numbers, and dashes."
                      : "Autofilled from the title until you edit it."
                }
              >
                <div className="relative">
                  <AdminInput
                    id="ae-slug"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setSlugTouched(true);
                      bumpDirty();
                    }}
                    disabled={slugReadOnly}
                    invalid={Boolean(slugError)}
                    className={slugReadOnly ? "pr-9" : ""}
                  />
                  {slugReadOnly ? (
                    <LockOutlined
                      sx={{ fontSize: 16 }}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-soft"
                    />
                  ) : null}
                </div>
              </AdminField>

              {canPickAuthor ? (
                <AdminField
                  label="Author"
                  htmlFor="ae-author"
                  hint="Byline shown on the article and used for author stats."
                >
                  <AdminSelect
                    id="ae-author"
                    value={authorId}
                    onChange={(e) => {
                      setAuthorId(e.target.value);
                      bumpDirty();
                    }}
                  >
                    {(authorList?.docs ?? []).map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                    {/* Keep the current selection visible even if it's not in
                        the picker list (e.g. an inactive user still bylined) */}
                    {authorId &&
                    !(authorList?.docs ?? []).some((u) => u.id === authorId) ? (
                      <option value={authorId}>(current author)</option>
                    ) : null}
                  </AdminSelect>
                </AdminField>
              ) : null}
            </div>
          </AdminPanel>

          <AdminPanel title="Homepage">
            <div className="space-y-3 p-5">
              <AdminCheckboxRow
                label="Featured"
                hint="Show on homepage featured modules"
                checked={featured}
                onChange={(e) => {
                  setFeatured(e.target.checked);
                  bumpDirty();
                }}
              />
              {featured && (
                <AdminField label="Featured priority" htmlFor="ae-featured-priority">
                  <AdminInput
                    id="ae-featured-priority"
                    type="number"
                    value={featuredPriority}
                    onChange={(e) => {
                      setFeaturedPriority(Number(e.target.value));
                      bumpDirty();
                    }}
                  />
                </AdminField>
              )}
            </div>
          </AdminPanel>

          <AdminPanel title="Hero image">
            <div className="p-5">
              <MediaPicker
                label="Hero image"
                value={heroImage}
                onChange={(next) => {
                  setHeroImage(next);
                  bumpDirty();
                }}
              />
            </div>
          </AdminPanel>

          <AdminPanel title="Taxonomy">
            <div className="space-y-4 p-5">
              <AdminChipSelect
                label="Categories"
                options={categories?.docs ?? []}
                value={categoryIds}
                onChange={(next) => {
                  setCategoryIds(next);
                  bumpDirty();
                }}
                getColor={(o) => o.brandColor ?? "#6B1D2A"}
              />

              <AdminChipSelect
                label="Tags"
                options={tags?.docs ?? []}
                value={tagIds}
                onChange={(next) => {
                  setTagIds(next);
                  bumpDirty();
                }}
                getColor={(o) => o.brandColor ?? "#C9A227"}
              />
            </div>
          </AdminPanel>
        </aside>
      </div>

      {/* Action bar */}
      <div className="flex flex-col gap-2 border-t border-border-soft pt-4 sm:flex-row sm:items-center">
        <AdminButton
          type="submit"
          disabled={saving}
          leftIcon={<SaveRounded sx={{ fontSize: 16 }} />}
        >
          {saving ? "Saving…" : "Save"}
        </AdminButton>
        <AdminButton
          type="button"
          variant="secondary"
          onClick={() => void handleSave(true)}
          disabled={saving}
        >
          Save and close
        </AdminButton>
        <AdminButton type="button" variant="ghost" onClick={handleCancel}>
          Cancel
        </AdminButton>
        {publishBlocked && PUBLISH_STATUSES.has(status) ? (
          <span className="text-xs text-muted-soft sm:ml-2">
            A few required fields are missing for publish (see checklist).
          </span>
        ) : null}
      </div>

      <PublishChecklistDialog
        open={Boolean(pendingPublish)}
        items={checklistItems}
        targetStatus={pendingPublish?.targetStatus ?? "published"}
        onCancel={() => setPendingPublish(null)}
        onConfirm={() => void handleConfirmPublish()}
        isPending={saving}
      />
    </form>
  );
}

/**
 * Compact "unsaved / saving / saved · HH:MM" indicator for the editor header.
 * Kept as an internal helper so it can read directly off the parent state
 * without the churn of a full props contract.
 */
function SavedIndicator({
  saving,
  dirty,
  lastSavedAt,
}: {
  saving: boolean;
  dirty: boolean;
  lastSavedAt: string | null;
}) {
  if (saving) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted">
        <RefreshOutlined
          sx={{ fontSize: 14, animation: "spin 1s linear infinite" }}
        />
        Saving…
      </span>
    );
  }
  if (dirty) {
    return <span className="text-xs text-muted">Unsaved changes</span>;
  }
  if (lastSavedAt) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted">
        <CheckOutlined sx={{ fontSize: 14 }} className="text-[#15803d]" />
        Saved · {lastSavedAt}
      </span>
    );
  }
  return null;
}
