"use client";

import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { ApiMethods } from "../../../../../types/service";
import { AdminCard, AdminPageHeader } from "@/modules/admin/components/AdminUi";
import { KiribeButton, KiribeTextField } from "@/modules/shared/components/ui";
import { KiribeLoader } from "@/modules/shared/components/brand";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useQueryService } from "@/utils/hooks/useQueryService";
import client from "@/utils/client";
import { unwrapApiData } from "@/lib/api/unwrap";

type Article = { id: string; title: string };
type Category = { id: string; name: string };
type Creator = { id: string; name: string };
type Reel = { id: string; title: string };

type ModuleRow = {
  categoryId: string;
  sectionTitle: string;
  layout: string;
  maxItems: number;
  enabled: boolean;
  sortOrder: number;
};

type PickRow = { articleId: string; sortOrder: number };

export function HomepageBuilderPage() {
  const [tab, setTab] = useState(0);
  const [heroArticleId, setHeroArticleId] = useState("");
  const [picks, setPicks] = useState<PickRow[]>([]);
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [spotlightCreatorId, setSpotlightCreatorId] = useState("");
  const [featuredCreatorIds, setFeaturedCreatorIds] = useState<string[]>([]);
  const [reelIds, setReelIds] = useState<string[]>([]);
  const [reelsEnabled, setReelsEnabled] = useState(true);
  const [archiveCtaEnabled, setArchiveCtaEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  const { data: articles } = useQueryService<Record<string, never>, { docs: Article[] }>({
    service: { path: "/api/admin/articles?status=published", method: ApiMethods.GET },
    options: { keys: ["admin", "articles", "published"] },
  });

  const { data: categories } = useQueryService<Record<string, never>, { docs: Category[] }>({
    service: { path: "/api/admin/categories", method: ApiMethods.GET },
    options: { keys: ["admin", "categories"] },
  });

  const { data: creators } = useQueryService<Record<string, never>, { docs: Creator[] }>({
    service: { path: "/api/admin/creators", method: ApiMethods.GET },
    options: { keys: ["admin", "creators"] },
  });

  const { data: reels } = useQueryService<Record<string, never>, { docs: Reel[] }>({
    service: { path: "/api/admin/reels", method: ApiMethods.GET },
    options: { keys: ["admin", "reels"] },
  });

  useEffect(() => {
    void (async () => {
      try {
      const res = await client.request<never, Record<string, unknown>>({
        path: "/api/admin/homepage",
        method: ApiMethods.GET,
      });
      const data = unwrapApiData(res);
      const hero = data.heroArticle;
      if (hero && typeof hero === "object" && "id" in hero) {
        setHeroArticleId(String((hero as { id: string }).id));
      }
      const editorPickRows = (data.editorsPicks as Array<{ sortOrder?: number; article?: { id?: string } }>) ?? [];
      setPicks(
        editorPickRows
          .map((row, idx) => ({
            articleId: String(row.article?.id ?? ""),
            sortOrder: Number(row.sortOrder ?? idx),
          }))
          .filter((p) => p.articleId)
      );
      const rows = (data.categoryModules as Array<Record<string, unknown>>) ?? [];
      setModules(
        rows.map((row, index) => ({
          categoryId: String((row.category as { id: string })?.id ?? ""),
          sectionTitle: String(row.sectionTitle ?? ""),
          layout: String(row.layout ?? "grid-3"),
          maxItems: Number(row.maxItems ?? 3),
          enabled: row.enabled !== false,
          sortOrder: Number(row.sortOrder ?? index),
        }))
      );
      const spotlight = data.spotlightCreator;
      if (spotlight && typeof spotlight === "object" && "id" in spotlight) {
        setSpotlightCreatorId(String((spotlight as { id: string }).id));
      }
      const featured = (data.featuredCreators as Array<{ creator?: { id: string } }>) ?? [];
      setFeaturedCreatorIds(
        featured.map((row) => String(row.creator?.id ?? "")).filter(Boolean)
      );
      const reelRows = (data.reels as Array<{ id: string }>) ?? [];
      setReelIds(reelRows.map((r) => String(r.id)));
      setReelsEnabled(data.reelsEnabled !== false);
      setArchiveCtaEnabled(data.archiveCtaEnabled !== false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const { mutate, isPending } = useMutationService({
    service: (payload) => ({
      path: "/api/admin/homepage",
      method: ApiMethods.PATCH,
      data: payload,
    }),
    options: { keys: ["admin", "homepage"], successTitle: "Homepage saved" },
  });

  const moveItem = <T,>(list: T[], index: number, dir: -1 | 1): T[] => {
    const target = index + dir;
    if (target < 0 || target >= list.length) return list;
    const next = [...list];
    const tmp = next[index];
    next[index] = next[target];
    next[target] = tmp;
    return next;
  };

  const addModule = () => {
    const firstCategory = categories?.docs?.[0];
    setModules((prev) => [
      ...prev,
      {
        categoryId: firstCategory ? String(firstCategory.id) : "",
        sectionTitle: firstCategory?.name ?? "",
        layout: "grid-3",
        maxItems: 3,
        enabled: true,
        sortOrder: prev.length,
      },
    ]);
  };

  const removeModule = (index: number) => {
    setModules((prev) => prev.filter((_, i) => i !== index));
  };

  const addPick = () => {
    if (picks.length >= 5) return;
    const first = articles?.docs?.[0];
    setPicks((prev) => [
      ...prev,
      { articleId: first ? String(first.id) : "", sortOrder: prev.length },
    ]);
  };

  const removePick = (index: number) => {
    setPicks((prev) => prev.filter((_, i) => i !== index));
  };

  const save = () => {
    mutate({
      heroArticleId: heroArticleId || null,
      editorsPicks: picks
        .filter((p) => p.articleId)
        .map((pick, i) => ({ articleId: pick.articleId, sortOrder: i })),
      categoryModules: modules.map((mod, i) => ({
        categoryId: mod.categoryId,
        sectionTitle: mod.sectionTitle,
        layout: mod.layout,
        maxItems: mod.maxItems,
        enabled: mod.enabled,
        sortOrder: i,
        articleSelection: "auto",
      })),
      spotlightCreatorId: spotlightCreatorId || null,
      featuredCreators: featuredCreatorIds.map((creatorId, index) => ({
        creatorId,
        sortOrder: index,
      })),
      reelIds,
      reelsEnabled,
      archiveCtaEnabled,
    });
  };

  const toggleFeaturedCreator = (id: string) => {
    setFeaturedCreatorIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  const moveFeaturedCreator = (index: number, dir: -1 | 1) => {
    setFeaturedCreatorIds((prev) => moveItem(prev, index, dir));
  };

  const toggleReel = (id: string) => {
    setReelIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const moveReel = (index: number, dir: -1 | 1) => {
    setReelIds((prev) => moveItem(prev, index, dir));
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
        <KiribeLoader size="sm" label="Loading homepage" />
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      <AdminPageHeader
        title="Homepage builder"
        action={
          <KiribeButton onClick={save} disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </KiribeButton>
        }
      />

      <Typography variant="body2" color="text.secondary">
        Homepage section order is fixed to the editorial design. Use the tabs below
        to manage the content within each section — reorder articles in the hero
        sidebar, drag category modules, pick the spotlight, etc.
      </Typography>

      <Tabs value={tab} onChange={(_e, v) => setTab(v)}>
        <Tab label="Hero & editor's picks" />
        <Tab label="Category modules" />
        <Tab label="Spotlight & creators" />
        <Tab label="Reels & CTA" />
      </Tabs>

      {tab === 0 && (
        <AdminCard sx={{ p: 3 }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Hero article
              </Typography>
              <KiribeTextField
                select
                label="Featured story"
                value={heroArticleId}
                onChange={(e) => setHeroArticleId(e.target.value)}
                fullWidth
              >
                <MenuItem value="">None</MenuItem>
                {(articles?.docs ?? []).map((a) => (
                  <MenuItem key={a.id} value={String(a.id)}>
                    {a.title}
                  </MenuItem>
                ))}
              </KiribeTextField>
            </Box>

            <Box>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Editor&apos;s picks ({picks.length}/5)
                </Typography>
                <KiribeButton
                  variant="outlined"
                  onClick={addPick}
                  disabled={picks.length >= 5}
                >
                  Add pick
                </KiribeButton>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Sidebar list under the hero. Use the arrows to reorder.
              </Typography>
              <Stack spacing={1} sx={{ mt: 2 }}>
                {picks.map((pick, index) => (
                  <Stack
                    key={index}
                    direction="row"
                    spacing={1.5}
                    alignItems="center"
                    sx={{
                      p: 1.5,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                    }}
                  >
                    <Stack direction="row">
                      <IconButton
                        size="small"
                        aria-label="Move up"
                        disabled={index === 0}
                        onClick={() => setPicks((p) => moveItem(p, index, -1))}
                      >
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        aria-label="Move down"
                        disabled={index === picks.length - 1}
                        onClick={() => setPicks((p) => moveItem(p, index, 1))}
                      >
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                    <KiribeTextField
                      select
                      label={`Pick ${index + 1}`}
                      value={pick.articleId}
                      onChange={(e) => {
                        const next = [...picks];
                        next[index] = { ...pick, articleId: e.target.value };
                        setPicks(next);
                      }}
                      fullWidth
                    >
                      <MenuItem value="">Select article</MenuItem>
                      {(articles?.docs ?? []).map((a) => (
                        <MenuItem key={a.id} value={String(a.id)}>
                          {a.title}
                        </MenuItem>
                      ))}
                    </KiribeTextField>
                    <IconButton
                      size="small"
                      aria-label="Remove pick"
                      onClick={() => removePick(index)}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                ))}
                {picks.length === 0 && (
                  <Typography variant="caption" color="text.secondary">
                    No picks yet. Click &ldquo;Add pick&rdquo; to populate the sidebar.
                  </Typography>
                )}
              </Stack>
            </Box>
          </Stack>
        </AdminCard>
      )}

      {tab === 1 && (
        <AdminCard sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Category modules
              </Typography>
              <Typography variant="caption" color="text.secondary">
                First 3 modules render above Spotlight; remaining modules render
                below the More Creators grid. Reorder with the arrows.
              </Typography>
            </Box>
            {modules.map((mod, index) => (
              <Stack
                key={index}
                spacing={1.5}
                sx={{
                  p: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Stack direction="row">
                    <IconButton
                      size="small"
                      aria-label="Move up"
                      disabled={index === 0}
                      onClick={() => setModules((m) => moveItem(m, index, -1))}
                    >
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      aria-label="Move down"
                      disabled={index === modules.length - 1}
                      onClick={() => setModules((m) => moveItem(m, index, 1))}
                    >
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Module {index + 1} · {index < 3 ? "above Spotlight" : "below Creators"}
                  </Typography>
                  <Box sx={{ flex: 1 }} />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={mod.enabled}
                        onChange={(e) => {
                          const next = [...modules];
                          next[index] = { ...mod, enabled: e.target.checked };
                          setModules(next);
                        }}
                      />
                    }
                    label="Enabled"
                  />
                  <IconButton
                    size="small"
                    aria-label="Remove module"
                    onClick={() => removeModule(index)}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Stack>
                <KiribeTextField
                  select
                  label="Category"
                  value={mod.categoryId}
                  onChange={(e) => {
                    const next = [...modules];
                    next[index] = { ...mod, categoryId: e.target.value };
                    setModules(next);
                  }}
                  fullWidth
                >
                  {(categories?.docs ?? []).map((c) => (
                    <MenuItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </MenuItem>
                  ))}
                </KiribeTextField>
                <KiribeTextField
                  label="Section title"
                  value={mod.sectionTitle}
                  onChange={(e) => {
                    const next = [...modules];
                    next[index] = { ...mod, sectionTitle: e.target.value };
                    setModules(next);
                  }}
                  fullWidth
                />
                <Stack direction="row" spacing={1.5}>
                  <KiribeTextField
                    select
                    label="Layout"
                    value={mod.layout}
                    onChange={(e) => {
                      const next = [...modules];
                      next[index] = { ...mod, layout: e.target.value };
                      setModules(next);
                    }}
                    fullWidth
                  >
                    {["grid-3", "grid-2", "list", "hero-plus-grid"].map((layout) => (
                      <MenuItem key={layout} value={layout}>
                        {layout}
                      </MenuItem>
                    ))}
                  </KiribeTextField>
                  <KiribeTextField
                    label="Max items"
                    type="number"
                    value={mod.maxItems}
                    onChange={(e) => {
                      const next = [...modules];
                      next[index] = { ...mod, maxItems: Number(e.target.value) };
                      setModules(next);
                    }}
                    sx={{ maxWidth: 160 }}
                  />
                </Stack>
              </Stack>
            ))}
            <KiribeButton variant="outlined" onClick={addModule}>
              Add category module
            </KiribeButton>
          </Stack>
        </AdminCard>
      )}

      {tab === 2 && (
        <AdminCard sx={{ p: 3 }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Spotlight creator
              </Typography>
              <KiribeTextField
                select
                label="Featured spotlight"
                value={spotlightCreatorId}
                onChange={(e) => setSpotlightCreatorId(e.target.value)}
                fullWidth
              >
                <MenuItem value="">None</MenuItem>
                {(creators?.docs ?? []).map((c) => (
                  <MenuItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </MenuItem>
                ))}
              </KiribeTextField>
            </Box>

            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                More creators ({featuredCreatorIds.length}/4)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Tick to feature; reorder selected creators with the arrows.
              </Typography>

              {featuredCreatorIds.length > 0 && (
                <Stack spacing={1} sx={{ mt: 2 }}>
                  {featuredCreatorIds.map((id, index) => {
                    const creator = creators?.docs?.find((c) => String(c.id) === id);
                    return (
                      <Stack
                        key={id}
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{
                          p: 1,
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 1,
                        }}
                      >
                        <IconButton
                          size="small"
                          aria-label="Move up"
                          disabled={index === 0}
                          onClick={() => moveFeaturedCreator(index, -1)}
                        >
                          <ArrowUpwardIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          aria-label="Move down"
                          disabled={index === featuredCreatorIds.length - 1}
                          onClick={() => moveFeaturedCreator(index, 1)}
                        >
                          <ArrowDownwardIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="body2">{creator?.name ?? id}</Typography>
                      </Stack>
                    );
                  })}
                </Stack>
              )}

              <Stack spacing={0.5} sx={{ mt: 2 }}>
                {(creators?.docs ?? []).map((c) => (
                  <FormControlLabel
                    key={c.id}
                    control={
                      <Checkbox
                        checked={featuredCreatorIds.includes(String(c.id))}
                        onChange={() => toggleFeaturedCreator(String(c.id))}
                      />
                    }
                    label={c.name}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </AdminCard>
      )}

      {tab === 3 && (
        <AdminCard sx={{ p: 3 }}>
          <Stack spacing={3}>
            <Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={reelsEnabled}
                    onChange={(e) => setReelsEnabled(e.target.checked)}
                  />
                }
                label="Show Reels & Shorts section"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={archiveCtaEnabled}
                    onChange={(e) => setArchiveCtaEnabled(e.target.checked)}
                  />
                }
                label="Show Browse Archive CTA"
              />
            </Box>

            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Reels in carousel ({reelIds.length})
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Tick to include; reorder selected reels with the arrows.
              </Typography>

              {reelIds.length > 0 && (
                <Stack spacing={1} sx={{ mt: 2 }}>
                  {reelIds.map((id, index) => {
                    const reel = reels?.docs?.find((r) => String(r.id) === id);
                    return (
                      <Stack
                        key={id}
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{
                          p: 1,
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 1,
                        }}
                      >
                        <IconButton
                          size="small"
                          aria-label="Move up"
                          disabled={index === 0}
                          onClick={() => moveReel(index, -1)}
                        >
                          <ArrowUpwardIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          aria-label="Move down"
                          disabled={index === reelIds.length - 1}
                          onClick={() => moveReel(index, 1)}
                        >
                          <ArrowDownwardIcon fontSize="small" />
                        </IconButton>
                        <Typography variant="body2">{reel?.title ?? id}</Typography>
                      </Stack>
                    );
                  })}
                </Stack>
              )}

              <Stack spacing={0.5} sx={{ mt: 2 }}>
                {(reels?.docs ?? []).map((r) => (
                  <FormControlLabel
                    key={r.id}
                    control={
                      <Checkbox
                        checked={reelIds.includes(String(r.id))}
                        onChange={() => toggleReel(String(r.id))}
                      />
                    }
                    label={r.title}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </AdminCard>
      )}
    </Stack>
  );
}
