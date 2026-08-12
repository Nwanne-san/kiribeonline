"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { IMAGE_FALLBACK_SRC } from "@/modules/shared/components/media/KiribeImage/KiribeImage";
import AddRounded from "@mui/icons-material/AddRounded";
import CloudUploadOutlined from "@mui/icons-material/CloudUploadOutlined";
import ContentCopyRounded from "@mui/icons-material/ContentCopyRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlined from "@mui/icons-material/EditOutlined";
import OpenInNewRounded from "@mui/icons-material/OpenInNewRounded";
import PermMediaOutlined from "@mui/icons-material/PermMediaOutlined";
import SearchRounded from "@mui/icons-material/SearchRounded";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { AdminButton, AdminPanel, formatCompact } from "@/modules/admin/components/ui/AdminPrimitives";
import { AdminConfirmDialog } from "@/modules/admin/components/ui/AdminDialog";
import { MediaGridSkeleton } from "@/modules/admin/components/ui/AdminSkeletons";
import { MediaMetadataDialog, MediaUploadForm } from "@/modules/admin/components/MediaPicker";
import type { AdminMediaRef } from "@/server/modules";
import { ApiMethods } from "../../../../../types/service";
import { adminMediaService, adminQueryKeys } from "@/services/admin.service";
import type { AdminListResult, AdminMediaItem } from "@/server/modules";
import { useInfiniteQueryService } from "@/utils/hooks/useInfiniteQueryService";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useDebouncedUrlParam } from "@/utils/hooks/useDebouncedUrlParam";
import { useKiribeToast } from "@/modules/shared/components/feedback";
import { DEFAULT_PAGE_LIMIT, MAX_UPLOAD_BYTES } from "@/constants";

/* ───────────────────────────────────────────────────────────── Config */

/** Payload media collection accepts these image types (see Media.ts). */
const ACCEPTED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ACCEPT_ATTR = ACCEPTED_MIME.join(",");
const ACCEPTED_LABEL = "JPG, PNG, WebP, GIF";
const MAX_UPLOAD_MB = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024));

/* ─────────────────────────────────────────────────────────────── Page */

export function MediaLibraryPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { showToast } = useKiribeToast();

  const { value: searchInput, setValue: setSearchInput, debouncedValue } =
    useDebouncedUrlParam();

  /**
   * Upload preview dialog state. Files land here first — the operator sees
   * dimensions, size, and confirms the alt text before the upload actually
   * hits R2. `preloadedFile` is the drag-dropped or picked file; `null` means
   * the dialog opened via the "Upload files" button with no pre-selection.
   */
  const [uploadOpen, setUploadOpen] = useState(false);
  const [preloadedFile, setPreloadedFile] = useState<File | null>(null);
  const [editing, setEditing] = useState<AdminMediaItem | null>(null);

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQueryService<
    { limit: number; q?: string },
    AdminListResult<AdminMediaItem>
  >({
    service: {
      path: "/api/admin/media",
      method: ApiMethods.GET,
      data: debouncedValue
        ? { limit: DEFAULT_PAGE_LIMIT, q: debouncedValue }
        : { limit: DEFAULT_PAGE_LIMIT },
    },
    options: {
      keys: [adminQueryKeys.media],
      searchQuery: debouncedValue,
    },
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

  /**
   * Route every file that arrives (drag-drop or file picker) into the preview
   * dialog. Pre-flight the type + size here so unsupported files never even
   * open the dialog — a helpful toast is friendlier than a preview that can't
   * be uploaded. Multi-file drops are not supported through the preview flow;
   * the first valid file wins and the rest surface a note so the operator can
   * queue them one at a time.
   */
  const stageFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      if (files.length === 0) return;

      const first = files.find((file) => {
        if (!ACCEPTED_MIME.includes(file.type)) {
          showToast({
            message: "Unsupported file",
            description: `${file.name} is not a ${ACCEPTED_LABEL} image.`,
            severity: "error",
          });
          return false;
        }
        if (file.size > MAX_UPLOAD_BYTES) {
          showToast({
            message: "File too large",
            description: `${file.name} exceeds the ${MAX_UPLOAD_MB}MB limit.`,
            severity: "error",
          });
          return false;
        }
        return true;
      });
      if (!first) return;

      if (files.length > 1) {
        showToast({
          message: "One at a time",
          description: `Previewing “${first.name}”. Drop the rest after this one uploads.`,
          severity: "info",
        });
      }

      setPreloadedFile(first);
      setUploadOpen(true);
    },
    [showToast],
  );

  const openUploadDialog = useCallback(() => {
    setPreloadedFile(null);
    setUploadOpen(true);
  }, []);

  const closeUploadDialog = useCallback(() => {
    setUploadOpen(false);
    setPreloadedFile(null);
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      if (event.dataTransfer.files?.length) stageFiles(event.dataTransfer.files);
    },
    [stageFiles],
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

  const [pendingDelete, setPendingDelete] = useState<AdminMediaItem | null>(null);

  const handleDelete = useCallback((item: AdminMediaItem) => {
    setPendingDelete(item);
  }, []);

  const handleEdit = useCallback((item: AdminMediaItem) => {
    setEditing(item);
  }, []);

  const handleUploaded = useCallback(
    (media: AdminMediaRef) => {
      // Refresh happens through the invalidate hook attached to the upload
      // mutation inside MediaUploadForm. Close the preview and offer the
      // metadata editor so the operator can polish alt/caption/credit if the
      // preview default wasn't quite right.
      closeUploadDialog();
      const asItem = items.find((item) => item.id === media.id);
      if (asItem) setEditing(asItem);
      else refetch();
    },
    [closeUploadDialog, items, refetch],
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
          onClick={openUploadDialog}
          leftIcon={<AddRounded sx={{ fontSize: 16 }} />}
        >
          Upload file
        </AdminButton>
      </div>

      {/* Hidden file input — kept for the dropzone's click-to-choose affordance. */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        hidden
        onChange={(event) => {
          if (event.target.files?.length) stageFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {/* Search */}
      <div className="relative">
        <SearchRounded
          sx={{ fontSize: 18 }}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-soft"
        />
        <input
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search by filename or alt text..."
          aria-label="Search media library"
          className="w-full rounded-none border border-border bg-surface py-2 pl-9 pr-3 text-sm text-ink placeholder:text-muted-soft focus:border-burgundy focus:outline-none focus:ring-2 focus:ring-burgundy/20 sm:max-w-sm"
        />
      </div>

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
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-none border-2 border-dashed px-6 py-12 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-burgundy ${
          isDragging
            ? "border-burgundy bg-burgundy/5"
            : "border-border bg-surface hover:border-burgundy/50 hover:bg-surface-alt"
        }`}
      >
        <CloudUploadOutlined sx={{ fontSize: 40 }} className="text-muted-soft" />
        <div className="font-semibold uppercase tracking-wide text-ink-secondary">
          Drag &amp; drop or click to preview
        </div>
        <p className="text-xs text-muted-soft">
          {ACCEPTED_LABEL} up to {MAX_UPLOAD_MB}MB · one at a time
        </p>
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
            <p className="text-sm font-semibold text-ink">
              {debouncedValue ? "No matches" : "No media yet"}
            </p>
            <p className="max-w-sm text-xs text-muted-soft">
              {debouncedValue
                ? `Nothing matches “${debouncedValue}”. Try a different word or clear the search.`
                : "Drag files onto the box above or click Upload files to build your library."}
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
                  onEdit={handleEdit}
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
                {debouncedValue
                  ? `Showing all ${formatCompact(totalAssets)} match${totalAssets === 1 ? "" : "es"}.`
                  : `Showing all ${formatCompact(totalAssets)} asset${totalAssets === 1 ? "" : "s"}.`}
              </p>
            )}
          </>
        )}
      </AdminPanel>

      {editing ? (
        <MediaMetadataDialog
          item={editing}
          open={Boolean(editing)}
          onClose={() => setEditing(null)}
        />
      ) : null}

      <Dialog open={uploadOpen} onClose={closeUploadDialog} fullWidth maxWidth="sm">
        <DialogTitle>Preview &amp; upload</DialogTitle>
        <DialogContent dividers>
          <MediaUploadForm
            onUploaded={handleUploaded}
            initialFile={preloadedFile}
          />
        </DialogContent>
      </Dialog>

      <AdminConfirmDialog
        open={pendingDelete !== null}
        tone="danger"
        title="Delete image?"
        description={
          pendingDelete
            ? `“${pendingDelete.filename ?? pendingDelete.alt ?? "this asset"}” will be removed from the library. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) deleteMutation.mutate({ id: pendingDelete.id });
          setPendingDelete(null);
        }}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────── Sub-components */

function MediaTile({
  item,
  onCopy,
  onDelete,
  onEdit,
  deleting,
}: {
  item: AdminMediaItem;
  onCopy: (item: AdminMediaItem) => void;
  onDelete: (item: AdminMediaItem) => void;
  onEdit: (item: AdminMediaItem) => void;
  deleting: boolean;
}) {
  const alt = item.alt || item.filename || "Media asset";

  return (
    <figure className="group relative aspect-square overflow-hidden rounded-none border border-border bg-surface-muted">
      <TileImage src={item.url ?? null} alt={alt} />

      {/* Hover overlay */}
      <figcaption className="pointer-events-none absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/70 via-black/10 to-transparent p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
        <div className="flex justify-end gap-1">
          <TileAction
            label="Edit details"
            onClick={() => onEdit(item)}
            Icon={EditOutlined}
          />
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
              className="pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-none bg-white/90 text-ink transition-colors hover:bg-white"
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

/**
 * Media tile image that falls back to the brand placeholder for missing URLs
 * or CDN errors. Local state resets when `src` changes so a stale error from
 * a previous asset doesn't stick to a freshly slotted one.
 */
function TileImage({ src, alt }: { src: string | null; alt: string }) {
  const [errored, setErrored] = useState(false);
  useEffect(() => {
    setErrored(false);
  }, [src]);
  const shouldFallback = !src || errored;
  return (
    <Image
      src={shouldFallback ? IMAGE_FALLBACK_SRC : src}
      alt={alt}
      fill
      sizes="(min-width: 1280px) 12vw, (min-width: 1024px) 16vw, (min-width: 768px) 25vw, (min-width: 480px) 33vw, 50vw"
      className="object-cover"
      onError={() => setErrored(true)}
      unoptimized={shouldFallback}
    />
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
      className={`pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-none bg-white/90 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 ${
        danger ? "text-[#b42318]" : "text-ink"
      }`}
    >
      <Icon sx={{ fontSize: 15 }} />
    </button>
  );
}
