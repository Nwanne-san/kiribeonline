"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import ArrowDownwardRounded from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpwardRounded from "@mui/icons-material/ArrowUpwardRounded";
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

const TABS = [
  { label: "Hero & picks" },
  { label: "Category modules" },
  { label: "Spotlight & creators" },
  { label: "Reels & CTA" },
] as const;

const LAYOUT_OPTIONS = [
  { value: "grid-3", label: "3-column grid" },
  { value: "grid-2", label: "2-column grid" },
  { value: "list", label: "List" },
  { value: "hero-plus-grid", label: "Hero + grid" },
];

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
        const editorPickRows =
          (data.editorsPicks as Array<{ sortOrder?: number; article?: { id?: string } }>) ?? [];
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

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Homepage builder"
        subtitle="Section order is fixed to the editorial design. Manage what appears inside each section here."
        action={
          <AdminButton
            onClick={save}
            disabled={isPending || loading}
            leftIcon={<SaveRounded className="text-[16px]" />}
          >
            {isPending ? "Saving…" : "Save"}
          </AdminButton>
        }
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-border bg-surface p-2 shadow-card">
        {TABS.map((t, i) => (
          <button
            key={t.label}
            type="button"
            onClick={() => setTab(i)}
            className={`rounded-md px-3 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-wide transition-colors ${
              tab === i
                ? "bg-[#7f0400] text-white"
                : "border border-border text-ink-secondary hover:bg-surface-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <AdminPanel>
          <PanelListSkeleton rows={4} />
        </AdminPanel>
      ) : (
        <>
          {tab === 0 && (
            <div className="space-y-5">
              <AdminPanel title="Hero article">
                <div className="p-5">
                  <AdminField label="Featured story" htmlFor="hb-hero">
                    <AdminSelect
                      id="hb-hero"
                      value={heroArticleId}
                      onChange={(e) => setHeroArticleId(e.target.value)}
                    >
                      <option value="">None</option>
                      {(articles?.docs ?? []).map((a) => (
                        <option key={a.id} value={String(a.id)}>
                          {a.title}
                        </option>
                      ))}
                    </AdminSelect>
                  </AdminField>
                </div>
              </AdminPanel>

              <AdminPanel
                title={`Editor's picks · ${picks.length}/5`}
                action={
                  <AdminButton
                    variant="secondary"
                    size="sm"
                    onClick={addPick}
                    disabled={picks.length >= 5}
                    leftIcon={<AddRounded className="text-[14px]" />}
                  >
                    Add pick
                  </AdminButton>
                }
              >
                <div className="space-y-3 p-5">
                  <p className="text-xs text-muted-soft">
                    Sidebar list under the hero. Use the arrows to reorder.
                  </p>
                  {picks.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border bg-surface-alt px-4 py-8 text-center text-sm text-muted-soft">
                      No picks yet.
                    </div>
                  ) : (
                    picks.map((pick, index) => (
                      <div
                        key={index}
                        className="flex items-end gap-2 rounded-lg border border-border bg-surface-alt p-3"
                      >
                        <MoveButtons
                          onUp={() => setPicks((p) => moveItem(p, index, -1))}
                          onDown={() => setPicks((p) => moveItem(p, index, 1))}
                          canUp={index > 0}
                          canDown={index < picks.length - 1}
                        />
                        <div className="min-w-0 flex-1">
                          <AdminField label={`Pick ${index + 1}`} htmlFor={`hb-pick-${index}`}>
                            <AdminSelect
                              id={`hb-pick-${index}`}
                              value={pick.articleId}
                              onChange={(e) => {
                                const next = [...picks];
                                next[index] = { ...pick, articleId: e.target.value };
                                setPicks(next);
                              }}
                            >
                              <option value="">Select article</option>
                              {(articles?.docs ?? []).map((a) => (
                                <option key={a.id} value={String(a.id)}>
                                  {a.title}
                                </option>
                              ))}
                            </AdminSelect>
                          </AdminField>
                        </div>
                        <IconRoundBtn onClick={() => removePick(index)} label="Remove pick">
                          <DeleteOutlineRounded className="text-[16px]" />
                        </IconRoundBtn>
                      </div>
                    ))
                  )}
                </div>
              </AdminPanel>
            </div>
          )}

          {tab === 1 && (
            <AdminPanel
              title="Category modules"
              action={
                <AdminButton
                  variant="secondary"
                  size="sm"
                  onClick={addModule}
                  leftIcon={<AddRounded className="text-[14px]" />}
                >
                  Add module
                </AdminButton>
              }
            >
              <div className="space-y-4 p-5">
                <p className="text-xs text-muted-soft">
                  First 3 modules render above Spotlight; remaining render below the More
                  Creators grid. Reorder with the arrows.
                </p>
                {modules.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border bg-surface-alt px-4 py-8 text-center text-sm text-muted-soft">
                    No modules yet.
                  </div>
                ) : (
                  modules.map((mod, index) => (
                    <div
                      key={index}
                      className="space-y-3 rounded-lg border border-border bg-surface-alt p-3"
                    >
                      <div className="flex items-center gap-2">
                        <MoveButtons
                          onUp={() => setModules((m) => moveItem(m, index, -1))}
                          onDown={() => setModules((m) => moveItem(m, index, 1))}
                          canUp={index > 0}
                          canDown={index < modules.length - 1}
                        />
                        <span className="text-xs text-muted-soft">
                          Module {index + 1} ·{" "}
                          {index < 3 ? "above Spotlight" : "below Creators"}
                        </span>
                        <div className="flex-1" />
                        <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-ink">
                          <input
                            type="checkbox"
                            checked={mod.enabled}
                            onChange={(e) => {
                              const next = [...modules];
                              next[index] = { ...mod, enabled: e.target.checked };
                              setModules(next);
                            }}
                            className="h-4 w-4 rounded border-border text-burgundy focus:ring-2 focus:ring-burgundy/20"
                          />
                          Enabled
                        </label>
                        <IconRoundBtn onClick={() => removeModule(index)} label="Remove module">
                          <DeleteOutlineRounded className="text-[16px]" />
                        </IconRoundBtn>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <AdminField label="Category" htmlFor={`hb-cat-${index}`}>
                          <AdminSelect
                            id={`hb-cat-${index}`}
                            value={mod.categoryId}
                            onChange={(e) => {
                              const next = [...modules];
                              next[index] = { ...mod, categoryId: e.target.value };
                              setModules(next);
                            }}
                          >
                            {(categories?.docs ?? []).map((c) => (
                              <option key={c.id} value={String(c.id)}>
                                {c.name}
                              </option>
                            ))}
                          </AdminSelect>
                        </AdminField>
                        <AdminField label="Section title" htmlFor={`hb-title-${index}`}>
                          <AdminInput
                            id={`hb-title-${index}`}
                            value={mod.sectionTitle}
                            onChange={(e) => {
                              const next = [...modules];
                              next[index] = { ...mod, sectionTitle: e.target.value };
                              setModules(next);
                            }}
                          />
                        </AdminField>
                        <AdminField label="Layout" htmlFor={`hb-layout-${index}`}>
                          <AdminSelect
                            id={`hb-layout-${index}`}
                            value={mod.layout}
                            onChange={(e) => {
                              const next = [...modules];
                              next[index] = { ...mod, layout: e.target.value };
                              setModules(next);
                            }}
                          >
                            {LAYOUT_OPTIONS.map((l) => (
                              <option key={l.value} value={l.value}>
                                {l.label}
                              </option>
                            ))}
                          </AdminSelect>
                        </AdminField>
                        <AdminField label="Max items" htmlFor={`hb-max-${index}`}>
                          <AdminInput
                            id={`hb-max-${index}`}
                            type="number"
                            min={1}
                            max={12}
                            value={mod.maxItems}
                            onChange={(e) => {
                              const next = [...modules];
                              next[index] = { ...mod, maxItems: Number(e.target.value) };
                              setModules(next);
                            }}
                          />
                        </AdminField>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </AdminPanel>
          )}

          {tab === 2 && (
            <div className="space-y-5">
              <AdminPanel title="Spotlight creator">
                <div className="p-5">
                  <AdminField label="Featured spotlight" htmlFor="hb-spotlight">
                    <AdminSelect
                      id="hb-spotlight"
                      value={spotlightCreatorId}
                      onChange={(e) => setSpotlightCreatorId(e.target.value)}
                    >
                      <option value="">None</option>
                      {(creators?.docs ?? []).map((c) => (
                        <option key={c.id} value={String(c.id)}>
                          {c.name}
                        </option>
                      ))}
                    </AdminSelect>
                  </AdminField>
                </div>
              </AdminPanel>

              <AdminPanel title={`More creators · ${featuredCreatorIds.length}/4`}>
                <div className="space-y-4 p-5">
                  <p className="text-xs text-muted-soft">
                    Tick to feature; reorder selected creators with the arrows.
                  </p>

                  {featuredCreatorIds.length > 0 && (
                    <div className="space-y-2">
                      {featuredCreatorIds.map((id, index) => {
                        const creator = creators?.docs?.find((c) => String(c.id) === id);
                        return (
                          <div
                            key={id}
                            className="flex items-center gap-2 rounded-lg border border-border bg-surface-alt px-3 py-2"
                          >
                            <MoveButtons
                              onUp={() => moveFeaturedCreator(index, -1)}
                              onDown={() => moveFeaturedCreator(index, 1)}
                              canUp={index > 0}
                              canDown={index < featuredCreatorIds.length - 1}
                            />
                            <span className="text-sm text-ink">{creator?.name ?? id}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    {(creators?.docs ?? []).map((c) => (
                      <AdminCheckboxRow
                        key={c.id}
                        label={c.name}
                        checked={featuredCreatorIds.includes(String(c.id))}
                        onChange={() => toggleFeaturedCreator(String(c.id))}
                      />
                    ))}
                  </div>
                </div>
              </AdminPanel>
            </div>
          )}

          {tab === 3 && (
            <div className="space-y-5">
              <AdminPanel title="Section toggles">
                <div className="space-y-2 p-5">
                  <AdminCheckboxRow
                    label="Show Reels & Shorts section"
                    hint="The video row rendered right under the hero."
                    checked={reelsEnabled}
                    onChange={(e) => setReelsEnabled(e.target.checked)}
                  />
                  <AdminCheckboxRow
                    label="Show Browse Archive CTA"
                    hint="Full-bleed CTA band above the newsletter block."
                    checked={archiveCtaEnabled}
                    onChange={(e) => setArchiveCtaEnabled(e.target.checked)}
                  />
                </div>
              </AdminPanel>

              <AdminPanel title={`Reels in carousel · ${reelIds.length}`}>
                <div className="space-y-4 p-5">
                  <p className="text-xs text-muted-soft">
                    Tick to include; reorder selected reels with the arrows.
                  </p>

                  {reelIds.length > 0 && (
                    <div className="space-y-2">
                      {reelIds.map((id, index) => {
                        const reel = reels?.docs?.find((r) => String(r.id) === id);
                        return (
                          <div
                            key={id}
                            className="flex items-center gap-2 rounded-lg border border-border bg-surface-alt px-3 py-2"
                          >
                            <MoveButtons
                              onUp={() => moveReel(index, -1)}
                              onDown={() => moveReel(index, 1)}
                              canUp={index > 0}
                              canDown={index < reelIds.length - 1}
                            />
                            <span className="text-sm text-ink">{reel?.title ?? id}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    {(reels?.docs ?? []).map((r) => (
                      <AdminCheckboxRow
                        key={r.id}
                        label={r.title}
                        checked={reelIds.includes(String(r.id))}
                        onChange={() => toggleReel(String(r.id))}
                      />
                    ))}
                  </div>
                </div>
              </AdminPanel>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────── sub-components */

function IconRoundBtn({
  children,
  onClick,
  label,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-ink-secondary transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function MoveButtons({
  onUp,
  onDown,
  canUp,
  canDown,
}: {
  onUp: () => void;
  onDown: () => void;
  canUp: boolean;
  canDown: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <IconRoundBtn onClick={onUp} label="Move up" disabled={!canUp}>
        <ArrowUpwardRounded className="text-[14px]" />
      </IconRoundBtn>
      <IconRoundBtn onClick={onDown} label="Move down" disabled={!canDown}>
        <ArrowDownwardRounded className="text-[14px]" />
      </IconRoundBtn>
    </div>
  );
}
