"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Image from "next/image";
import AddRounded from "@mui/icons-material/AddRounded";
import CloudUploadOutlined from "@mui/icons-material/CloudUploadOutlined";
import ContentCopyRounded from "@mui/icons-material/ContentCopyRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import OpenInNewRounded from "@mui/icons-material/OpenInNewRounded";
import BrokenImageOutlined from "@mui/icons-material/BrokenImageOutlined";
import PermMediaOutlined from "@mui/icons-material/PermMediaOutlined";
import { AdminButton, AdminPanel, Pill, formatCompact } from "@/modules/admin/components/ui/AdminPrimitives";
import { MediaGridSkeleton } from "@/modules/admin/components/ui/AdminSkeletons";
import { adminMediaService, adminQueryKeys } from "@/services/admin.service";
import type { AdminListResult, AdminMediaItem } from "@/server/modules";
import { useInfiniteQueryService } from "@/utils/hooks/useInfiniteQueryService";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useKiribeToast } from "@/modules/shared/components/feedback";
import { DEFAULT_PAGE_LIMIT, MAX_UPLOAD_BYTES } from "@/constants";

/* ───────────────────────────────────────────────────────────── Config */

/** Payload media collection accepts these image types (see Media.ts). */
const ACCEPTED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ACCEPT_ATTR = ACCEPTED_MIME.join(",");
const ACCEPTED_LABEL = "JPG, PNG, WebP, GIF";
const MAX_UPLOAD_MB = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024));

/* ───────────────────────────────────────────────────────────── Helpers */

/** Derive a reasonable default alt from a filename (server requires alt). */
function altFromFilename(name: string): string {
  const base = name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
  return base || "Uploaded image";
}

/* ─────────────────────────────────────────────────────────────── Page */

export function MediaLibraryPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingUploads, setPendingUploads] = useState(0);
  const { showToast } = useKiribeToast();

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQueryService<{ limit: number }, AdminListResult<AdminMediaItem>>({
    service: { ...adminMediaService.list, data: { limit: DEFAULT_PAGE_LIMIT } },
    options: { keys: [adminQueryKeys.media] },
  });

  const items = useMemo(
    () => data?.pages.flatMap((page) => page.docs) ?? [],
    [data],
  );
  const totalAssets = data?.pages[0]?.totalDocs ?? 0;
  const usedCount = useMemo(
    () => items.filter((item) => item.usageCount > 0).length,
    [items],
  );

  const uploadMutation = useMutationService<FormData, AdminMediaItem>({
    service: adminMediaService.upload,
    options: { invalidateKeys: [adminQueryKeys.media] },
  });

  const deleteMutation = useMutationService<{ id: string }, null>({
    service: (variables) => adminMediaService.remove(variables.id),
    options: {
      successTitle: "Asset deleted",
      invalidateKeys: [adminQueryKeys.media],
      onError: (error) => {
        // 409: the asset is still referenced. List where so the editor can
        // detach it before retrying.
        const references = error?.errors?.references;
        if (error?.statusCode === 409 && references?.length) {
          showToast({
            message: "Can't delete — image in use",
            description: `Referenced by: ${references.join("; ")}`,
            severity: "warning",
          });
          return;
        }
        showToast({
          message: "Delete failed",
          description: error?.message ?? "Something went wrong.",
          severity: "error",
        });
      },
    },
  });

  const uploadFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      if (files.length === 0) return;

      let queued = 0;
      for (const file of files) {
        if (!ACCEPTED_MIME.includes(file.type)) {
          showToast({
            message: "Unsupported file",
            description: `${file.name} is not a ${ACCEPTED_LABEL} image.`,
            severity: "error",
          });
          continue;
        }
        if (file.size > MAX_UPLOAD_BYTES) {
          showToast({
            message: "File too large",
            description: `${file.name} exceeds the ${MAX_UPLOAD_MB}MB limit.`,
            severity: "error",
          });
          continue;
        }

        const form = new FormData();
        form.append("file", file);
        form.append("alt", altFromFilename(file.name));

        queued += 1;
        setPendingUploads((count) => count + 1);
        uploadMutation.mutate(form, {
          onSettled: () => setPendingUploads((count) => Math.max(0, count - 1)),
        });
      }

      if (queued > 0) {
        showToast({
          message: queued === 1 ? "Uploading image…" : `Uploading ${queued} images…`,
          description: "They will appear in the library once processed.",
          severity: "info",
        });
      }
    },
    [showToast, uploadMutation],
  );

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      if (event.dataTransfer.files?.length) uploadFiles(event.dataTransfer.files);
    },
    [uploadFiles],
  );

  const handleCopyUrl = useCallback(
    async (item: AdminMediaItem) => {
      if (!item.url) return;
      try {
        await navigator.clipboard.writeText(item.url);
        showToast({ message: "URL copied", description: item.filename ?? item.url, severity: "success" });
      } catch {
        showToast({ message: "Copy failed", description: "Could not access the clipboard.", severity: "error" });
      }
    },
    [showToast],
  );

  const handleDelete = useCallback(
    (item: AdminMediaItem) => {
      const label = item.filename ?? item.alt ?? "this asset";
      // Deletion is blocked server-side while the asset is referenced (409), so
      // don't promise an override here — just confirm intent.
      if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;
      deleteMutation.mutate({ id: item.id });
    },
    [deleteMutation],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="relative inline-block pb-2 font-headline text-2xl font-bold text-burgundy after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-12 after:bg-mustard after:content-['']">
            Media Library
          </h1>
          <p className="mt-2 text-sm text-muted">
            {formatCompact(totalAssets)} asset{totalAssets === 1 ? "" : "s"}
            {usedCount > 0 ? ` · ${usedCount} in use` : ""}
          </p>
        </div>
        <AdminButton
          variant="primary"
          onClick={() => inputRef.current?.click()}
          leftIcon={<AddRounded sx={{ fontSize: 16 }} />}
        >
          Upload files
        </AdminButton>
      </div>

      {/* Hidden shared file input */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        multiple
        hidden
        onChange={(event) => {
          if (event.target.files?.length) uploadFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {/* Dropzone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Drag and drop files here or click to upload"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-burgundy ${
          isDragging
            ? "border-burgundy bg-burgundy/5"
            : "border-border bg-surface hover:border-burgundy/50 hover:bg-surface-alt"
        }`}
      >
        <CloudUploadOutlined sx={{ fontSize: 40 }} className="text-muted-soft" />
        <div className="font-semibold uppercase tracking-wide text-ink-secondary">
          Drag &amp; drop or click to upload
        </div>
        <p className="text-xs text-muted-soft">
          {ACCEPTED_LABEL} up to {MAX_UPLOAD_MB}MB
        </p>
        {pendingUploads > 0 ? (
          <Pill tone="info" className="mt-1">
            Uploading {pendingUploads} file{pendingUploads === 1 ? "" : "s"}…
          </Pill>
        ) : null}
      </div>

      {/* Grid */}
      <AdminPanel bodyClassName="p-4">
        {isLoading ? (
          <MediaGridSkeleton count={16} />
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm text-muted">We couldn&apos;t load your media.</p>
            <AdminButton variant="secondary" size="sm" onClick={() => refetch()}>
              Try again
            </AdminButton>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <PermMediaOutlined sx={{ fontSize: 40 }} className="text-muted-soft" />
            <p className="text-sm font-semibold text-ink">No media yet</p>
            <p className="max-w-sm text-xs text-muted-soft">
              Drag files onto the box above or click Upload files to build your library.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
              {items.map((item) => (
                <MediaTile
                  key={item.id}
                  item={item}
                  onCopy={handleCopyUrl}
                  onDelete={handleDelete}
                  deleting={
                    deleteMutation.isPending && deleteMutation.variables?.id === item.id
                  }
                />
              ))}
            </div>

            {hasNextPage ? (
              <div className="mt-5 flex justify-center">
                <AdminButton
                  variant="secondary"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? "Loading…" : "Load more"}
                </AdminButton>
              </div>
            ) : (
              <p className="mt-5 text-center text-xs text-muted-soft">
                Showing all {formatCompact(totalAssets)} asset{totalAssets === 1 ? "" : "s"}.
              </p>
            )}
          </>
        )}
      </AdminPanel>
    </div>
  );
}

/* ──────────────────────────────────────────────────── Sub-components */

function MediaTile({
  item,
  onCopy,
  onDelete,
  deleting,
}: {
  item: AdminMediaItem;
  onCopy: (item: AdminMediaItem) => void;
  onDelete: (item: AdminMediaItem) => void;
  deleting: boolean;
}) {
  const alt = item.alt || item.filename || "Media asset";

  return (
    <figure className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-surface-muted">
      {item.url ? (
        <Image
          src={item.url}
          alt={alt}
          fill
          sizes="(min-width: 1280px) 12vw, (min-width: 1024px) 16vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
          className="object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted-soft">
          <BrokenImageOutlined sx={{ fontSize: 28 }} />
        </div>
      )}

      {/* Hover overlay */}
      <figcaption className="pointer-events-none absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/70 via-black/10 to-transparent p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
        <div className="flex justify-end gap-1">
          <TileAction
            label="Copy URL"
            onClick={() => onCopy(item)}
            Icon={ContentCopyRounded}
          />
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              aria-label="Open original in new tab"
              className="pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/90 text-ink transition-colors hover:bg-white"
            >
              <OpenInNewRounded sx={{ fontSize: 15 }} />
            </a>
          ) : null}
          <TileAction
            label="Delete asset"
            onClick={() => onDelete(item)}
            Icon={DeleteOutlineRounded}
            disabled={deleting}
            danger
          />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[0.6875rem] font-medium text-white" title={item.filename ?? alt}>
            {item.filename ?? alt}
          </p>
          {item.usageCount > 0 ? (
            <p className="text-[0.625rem] text-white/70">
              Used in {item.usageCount} place{item.usageCount === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>
      </figcaption>
    </figure>
  );
}

function TileAction({
  label,
  onClick,
  Icon,
  disabled = false,
  danger = false,
}: {
  label: string;
  onClick: () => void;
  Icon: React.ComponentType<{ sx?: object }>;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={`pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-md bg-white/90 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 ${
        danger ? "text-[#b42318]" : "text-ink"
      }`}
    >
      <Icon sx={{ fontSize: 15 }} />
    </button>
  );
}
