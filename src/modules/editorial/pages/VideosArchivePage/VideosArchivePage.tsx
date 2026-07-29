"use client";

import LayoutGrid from "@mui/icons-material/GridViewRounded";
import ViewList from "@mui/icons-material/ViewListRounded";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import InstagramIcon from "@mui/icons-material/Instagram";
import YouTubeIcon from "@mui/icons-material/YouTube";
import type { SvgIconComponent } from "@mui/icons-material";
import { useMemo, useState } from "react";
import type { PublicReel } from "@/lib/content/query-homepage";
import { VideoModal } from "@/modules/editorial/components/VideoModal";
import { EmptyState } from "@/modules/shared/components/feedback";
import { KiribeImage } from "@/modules/shared/components/media/KiribeImage";
import { EditorialContainer } from "@/modules/shared/components/ui";
import { parseReelEmbed } from "@/lib/reels/parse-embed";

type VideosArchivePageProps = {
  reels: PublicReel[];
};

type PlatformFilter = "all" | "youtube" | "instagram" | "tiktok";
type ViewMode = "grid" | "list";

const MAKE_RED = "#7f0400";

function TikTokGlyph({ className }: { className?: string; sx?: unknown }) {
  return <span className={`text-[0.65rem] font-bold text-white ${className ?? ""}`}>TT</span>;
}

const PLATFORM_META: Record<
  Exclude<PlatformFilter, "all">,
  { label: string; Icon: SvgIconComponent | typeof TikTokGlyph; badge: string }
> = {
  youtube: { label: "YouTube", Icon: YouTubeIcon, badge: "bg-red-600" },
  instagram: { label: "Instagram", Icon: InstagramIcon, badge: "bg-pink-600" },
  tiktok: { label: "TikTok", Icon: TikTokGlyph, badge: "bg-gray-900" },
};

/**
 * `/categories/videos` — reels archive restyled toward Figma Make VideosPage.
 * Keeps VideoModal embeds; empty state uses the shared EmptyState component.
 */
export function VideosArchivePage({ reels }: VideosArchivePageProps) {
  const [activeReel, setActiveReel] = useState<PublicReel | null>(null);
  const [platform, setPlatform] = useState<PlatformFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const filtered = useMemo(() => {
    if (platform === "all") return reels;
    return reels.filter((r) => r.platform === platform);
  }, [reels, platform]);

  return (
    <div className="min-h-screen bg-white pb-16">
      {/* Make-style dark hero */}
      <section className="relative overflow-hidden bg-gray-900" style={{ minHeight: 280 }}>
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1545538331-78f76ca06830?auto=format&fit=crop&w=1600&q=80')",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, ${MAKE_RED}e6 0%, rgba(17,24,39,0.75) 55%, rgba(17,24,39,0.55) 100%)`,
          }}
        />
        <div className="editorial-container relative flex flex-col justify-center py-16" style={{ minHeight: 280 }}>
          <span className="mb-3 font-headline text-sm uppercase tracking-widest text-[#E6A313]">
            Kiribé
          </span>
          <h1 className="font-headline text-5xl leading-none text-white lg:text-6xl">VIDEOS</h1>
          <div className="mb-4 mt-4 h-1 w-16 bg-[#E6A313]" />
          <p className="max-w-xl font-body text-lg text-gray-300">
            Reels, TikToks, YouTube features, interviews, and exclusive behind-the-scenes
            coverage — all in one place.
          </p>
        </div>
      </section>

      {/* Sticky filters */}
      <section className="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div className="editorial-container flex flex-wrap items-center justify-between gap-4 py-4">
          <div className="flex flex-wrap items-center gap-1">
            {(["all", "youtube", "instagram", "tiktok"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setPlatform(key)}
                className={`rounded-none border px-3 py-1.5 font-headline text-xs uppercase tracking-widest transition-colors ${
                  platform === key
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-400 hover:text-gray-900"
                }`}
              >
                {key === "all" ? "All Platforms" : PLATFORM_META[key].label}
              </button>
            ))}
          </div>
          <div className="flex overflow-hidden border border-gray-200">
            <button
              type="button"
              aria-label="Grid view"
              onClick={() => setViewMode("grid")}
              className={`p-2 transition-colors ${
                viewMode === "grid" ? "bg-[#7f0400] text-white" : "bg-white text-gray-500 hover:text-[#7f0400]"
              }`}
            >
              <LayoutGrid className="text-[18px]" />
            </button>
            <button
              type="button"
              aria-label="List view"
              onClick={() => setViewMode("list")}
              className={`border-l border-gray-200 p-2 transition-colors ${
                viewMode === "list" ? "bg-[#7f0400] text-white" : "bg-white text-gray-500 hover:text-[#7f0400]"
              }`}
            >
              <ViewList className="text-[18px]" />
            </button>
          </div>
        </div>
      </section>

      <EditorialContainer className="py-12 md:py-16">
        {reels.length === 0 ? (
          <EmptyState
            title="No videos yet"
            description="We publish new reels and shorts here. Check back soon."
          />
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-headline text-xl text-gray-400">No videos match your filters.</p>
            <button
              type="button"
              onClick={() => setPlatform("all")}
              className="mt-4 rounded-none bg-[#7f0400] px-6 py-2 font-headline text-sm uppercase tracking-widest text-white transition-colors hover:bg-[#E6A313] hover:text-[#7f0400]"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <p className="mb-8 font-body text-sm text-gray-500">
              {filtered.length} video{filtered.length !== 1 ? "s" : ""} found
            </p>
            {viewMode === "grid" ? (
              <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
                {filtered.map((reel) => (
                  <div key={reel.id} className="mb-6 break-inside-avoid">
                    <VideoArchiveCard reel={reel} onSelect={setActiveReel} layout="grid" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-gray-200 border-t border-gray-200">
                {filtered.map((reel) => (
                  <VideoArchiveCard
                    key={reel.id}
                    reel={reel}
                    onSelect={setActiveReel}
                    layout="list"
                  />
                ))}
              </div>
            )}
          </>
        )}
      </EditorialContainer>

      <VideoModal reel={activeReel} onClose={() => setActiveReel(null)} />
    </div>
  );
}

function VideoArchiveCard({
  reel,
  onSelect,
  layout,
}: {
  reel: PublicReel;
  onSelect: (reel: PublicReel) => void;
  layout: ViewMode;
}) {
  const embed = parseReelEmbed(reel.externalUrl);
  const platformKey = (["youtube", "instagram", "tiktok"].includes(reel.platform)
    ? reel.platform
    : "youtube") as Exclude<PlatformFilter, "all">;
  const meta = PLATFORM_META[platformKey];
  const Icon = meta.Icon;

  const open = () => {
    if (embed?.embedUrl) onSelect(reel);
    else window.open(reel.externalUrl, "_blank", "noopener,noreferrer");
  };

  if (layout === "list") {
    return (
      <button
        type="button"
        onClick={open}
        className="group flex w-full gap-5 py-5 text-left"
      >
        <div className="relative aspect-video w-48 shrink-0 overflow-hidden bg-gray-900">
          <KiribeImage
            src={reel.thumbnail}
            alt={reel.thumbnail?.alt ?? reel.title}
            fill
            sizes="192px"
            className="object-cover opacity-90 transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 transition-colors group-hover:bg-[#E6A313]">
              <PlayArrowIcon className="ml-0.5 text-[20px] text-admin-primary" />
            </span>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <div className="mb-2 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-white ${meta.badge}`}>
              <Icon className="text-[12px] text-white"/>
              <span className="font-body text-xs">{meta.label}</span>
            </span>
            {reel.label ? (
              <span className="font-headline text-xs uppercase tracking-widest text-[#E6A313]">
                {reel.label}
              </span>
            ) : null}
          </div>
          <h3 className="font-headline text-lg leading-snug text-gray-900 transition-colors group-hover:text-[#7f0400]">
            {reel.title}
          </h3>
        </div>
      </button>
    );
  }

  return (
    <button type="button" onClick={open} className="group w-full cursor-pointer text-left">
      <div className="relative mb-3 aspect-[4/5] overflow-hidden bg-gray-900">
        <KiribeImage
          src={reel.thumbnail}
          alt={reel.thumbnail?.alt ?? reel.title}
          fill
          sizes="(max-width: 640px) 100vw, 33vw"
          className="object-cover opacity-90 transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 transition-colors group-hover:bg-[#E6A313]">
            <PlayArrowIcon className="ml-0.5 text-[22px] text-admin-primary" />
          </span>
        </div>
        <div className={`absolute left-3 top-3 flex items-center gap-1.5 px-2 py-1 ${meta.badge}`}>
          <Icon className="text-xs text-white" />
          <span className="font-body text-xs text-white">{meta.label}</span>
        </div>
      </div>
      {reel.label ? (
        <span className="mb-1 block font-headline text-xs uppercase tracking-widest text-[#E6A313]">
          {reel.label}
        </span>
      ) : null}
      <h3 className="font-headline text-sm leading-snug text-gray-900 transition-colors group-hover:text-[#7f0400]">
        {reel.title}
      </h3>
    </button>
  );
}
