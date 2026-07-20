"use client";

import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import RateReviewOutlined from "@mui/icons-material/RateReviewOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ApiMethods } from "../../../../../types/service";
import { AdminRoutes } from "@/routes/admin.routes";
import {
  AdminCard,
  AdminChipSelect,
  AdminFieldLabel,
  AdminPageHeader,
} from "@/modules/admin/components/AdminUi";
import { AdminRichTextEditor } from "@/modules/admin/components/AdminRichTextEditor";
import { MediaPicker } from "@/modules/admin/components/MediaPicker";
import { KiribeButton, KiribeTextField } from "@/modules/shared/components/ui";
import { KiribeLoader } from "@/modules/shared/components/brand";
import { usePermissions } from "@/modules/admin/hooks/usePermissions";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useQueryService } from "@/utils/hooks/useQueryService";
import client from "@/utils/client";
import { unwrapApiData } from "@/lib/api/unwrap";
import type { AdminMediaRef } from "@/server/modules";
import { normalizeLexicalBody, textToLexical } from "@/server/shared/text-to-lexical";

type Category = { id: string; name: string; brandColor?: string | null };
type Tag = { id: string; name: string; brandColor?: string | null };
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
  heroImage?: { id: string; url?: string; alt?: string } | string;
  seo?: {
    title?: string;
    description?: string;
    ogImage?: { id: string; url?: string; alt?: string } | string;
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

export function ArticleEditorPage({ articleId }: ArticleEditorPageProps) {
  const router = useRouter();
  const isEdit = Boolean(articleId);
  const { can } = usePermissions();

  const [title, setTitle] = useState("");
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
  const [seoOpen, setSeoOpen] = useState(false);
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoOgImage, setSeoOgImage] = useState<AdminMediaRef | null>(null);
  const [viewCount, setViewCount] = useState<number | null>(null);

  const { data: categories } = useQueryService<Record<string, never>, { docs: Category[] }>({
    service: { path: "/api/admin/categories", method: ApiMethods.GET },
    options: { keys: ["admin", "categories"] },
  });

  const { data: tags } = useQueryService<Record<string, never>, { docs: Tag[] }>({
    service: { path: "/api/admin/tags", method: ApiMethods.GET },
    options: { keys: ["admin", "tags"] },
  });

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
        setSeoTitle(doc.seo?.title ?? "");
        setSeoDescription(doc.seo?.description ?? "");
        // Rehydrate the stored OG image so it survives an edit that doesn't
        // touch SEO — otherwise `seoOgImage` stays null and save strips it.
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

  const { mutate, isPending } = useMutationService({
    service: (payload) => ({
      path: isEdit ? `/api/admin/articles/${articleId}` : "/api/admin/articles",
      method: isEdit ? ApiMethods.PATCH : ApiMethods.POST,
      data: payload,
    }),
    options: {
      keys: ["admin", "articles"],
      successTitle: "Article saved",
      // Surfaces server rejections (e.g. a 403 when a writer/contributor tries
      // to publish or feature without articles:publish) as an error toast
      // rather than a silent no-op.
      errorTitle: "Could not save article",
      onSuccess: () => router.push(AdminRoutes.articles),
    },
  });

  const canPublish = can("articles:publish");

  /**
   * Only publish-holders may set publish/scheduled/archived. Writers/
   * contributors get Draft ↔ In review; if the article is already in a
   * publish-only state (e.g. an editor archived a piece before a writer
   * reopened it), we surface the current value as disabled so the select
   * stays honest and never silently downgrades on save.
   */
  const statusOptions = useMemo(() => {
    const base = canPublish ? PUBLISH_STATUS_OPTIONS : EDIT_STATUS_OPTIONS;
    if (base.some((o) => o.value === status)) return base;
    return [
      ...base,
      { value: status, label: `${status} (locked)` },
    ];
  }, [canPublish, status]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({
      title,
      excerpt,
      body,
      status,
      publishedAt: publishedAt || null,
      featured,
      featuredPriority,
      categoryIds,
      tagIds,
      heroImageId: heroImage?.id ?? null,
      seo: {
        title: seoTitle || undefined,
        description: seoDescription || undefined,
        ogImageId: seoOgImage?.id ?? null,
      },
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <KiribeLoader size="sm" label="Loading article" />
      </Box>
    );
  }

  return (
    <Stack component="form" onSubmit={onSubmit} spacing={2}>
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Typography component={NextLink} href={AdminRoutes.articles} variant="caption" color="text.secondary" sx={{ textDecoration: "none" }}>
          Articles
        </Typography>
        <ChevronRightIcon sx={{ fontSize: 14, color: "text.disabled" }} />
        <Typography variant="caption">{isEdit ? "Edit article" : "New article"}</Typography>
      </Stack>

      <AdminPageHeader
        title={isEdit ? "Edit article" : "New article"}
        action={
          isEdit && viewCount !== null ? (
            <Typography variant="caption" color="text.secondary">
              {viewCount.toLocaleString()} views
            </Typography>
          ) : undefined
        }
      />

      {isEdit && status === "in_review" ? (
        <Alert
          icon={<RateReviewOutlined fontSize="small" />}
          severity="info"
          sx={{
            // Kiribé brand tint (same palette as the `brand` Pill tone) so
            // the banner reads as an editorial signal rather than a generic
            // MUI info state.
            bgcolor: "#FDF3EF",
            color: "#7F0400",
            border: "1px solid #F3D7CB",
            "& .MuiAlert-icon": { color: "#7F0400" },
          }}
        >
          {canPublish
            ? "This article is awaiting your review. Move it to Published or Scheduled when it’s ready — or back to Draft to send it for more work."
            : "This article has been submitted for review. An editor will take it from here."}
        </Alert>
      ) : null}

      <Grid container spacing={2.5} alignItems="flex-start">
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={2}>
            <AdminCard sx={{ p: 2.5 }}>
              <KiribeTextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required fullWidth />
            </AdminCard>
            <AdminCard sx={{ p: 2.5 }}>
              <KiribeTextField label="Excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} fullWidth multiline rows={2} />
            </AdminCard>
            {editorReady ? (
              <AdminRichTextEditor key={articleId ?? "new"} label="Body" value={body} onChange={setBody} required />
            ) : null}
            <AdminCard sx={{ p: 0 }}>
              <Box
                component="button"
                type="button"
                onClick={() => setSeoOpen(!seoOpen)}
                sx={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  p: 2,
                  border: "none",
                  bgcolor: "transparent",
                  cursor: "pointer",
                }}
              >
                <Typography variant="subtitle2" fontWeight={600}>
                  SEO & metadata
                </Typography>
              </Box>
              {seoOpen && (
                <Stack spacing={2} sx={{ px: 2.5, pb: 2.5, borderTop: "1px solid", borderColor: "divider", pt: 2 }}>
                  <KiribeTextField label="SEO title" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} fullWidth />
                  <KiribeTextField label="SEO description" value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} fullWidth multiline rows={3} />
                  <MediaPicker label="OG image" value={seoOgImage} onChange={setSeoOgImage} />
                </Stack>
              )}
            </AdminCard>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={2}>
            <AdminCard sx={{ p: 2 }}>
              <KiribeTextField
                select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                fullWidth
                required
                helperText={
                  !canPublish
                    ? "Submit for review to send this piece to an editor."
                    : undefined
                }
              >
                {statusOptions.map((s) => (
                  <MenuItem
                    key={s.value}
                    value={s.value}
                    disabled={s.label.endsWith("(locked)")}
                  >
                    {s.label}
                  </MenuItem>
                ))}
              </KiribeTextField>
              <Box sx={{ mt: 2 }}>
                <AdminFieldLabel label="Publish date" />
                <KiribeTextField
                  type="datetime-local"
                  value={publishedAt}
                  onChange={(e) => setPublishedAt(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            </AdminCard>

            <AdminCard sx={{ p: 2 }}>
              <FormControlLabel
                control={<Checkbox checked={featured} onChange={(e) => setFeatured(e.target.checked)} />}
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      Featured
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Show on homepage featured modules
                    </Typography>
                  </Box>
                }
              />
              {featured && (
                <Box sx={{ mt: 1.5 }}>
                  <KiribeTextField
                    label="Featured priority"
                    type="number"
                    value={featuredPriority}
                    onChange={(e) => setFeaturedPriority(Number(e.target.value))}
                    fullWidth
                  />
                </Box>
              )}
            </AdminCard>

            <AdminCard sx={{ p: 2 }}>
              <MediaPicker label="Hero image" value={heroImage} onChange={setHeroImage} />
            </AdminCard>

            <AdminChipSelect
              label="Categories"
              options={categories?.docs ?? []}
              value={categoryIds}
              onChange={setCategoryIds}
              getColor={(o) => o.brandColor ?? "#6B1D2A"}
            />

            <AdminChipSelect
              label="Tags"
              options={tags?.docs ?? []}
              value={tagIds}
              onChange={setTagIds}
              getColor={(o) => o.brandColor ?? "#C9A227"}
            />
          </Stack>
        </Grid>
      </Grid>

      <Stack direction="row" spacing={2} sx={{ pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
        <KiribeButton type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save"}
        </KiribeButton>
        <KiribeButton variant="outlined" onClick={() => router.push(AdminRoutes.articles)}>
          Cancel
        </KiribeButton>
      </Stack>
    </Stack>
  );
}
