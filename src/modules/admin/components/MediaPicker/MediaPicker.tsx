"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import CheckIcon from "@mui/icons-material/Check";
import CloudUploadOutlined from "@mui/icons-material/CloudUploadOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import SearchRounded from "@mui/icons-material/SearchRounded";
import { DataRenderer, EmptyState, useKiribeToast } from "@/modules/shared/components/feedback";
import { EmptyMediaIllustration } from "@/modules/shared/components/illustrations";
import { KiribeTextField } from "@/modules/shared/components/ui";
import { AdminButton } from "@/modules/admin/components/ui/AdminPrimitives";
import { ApiMethods } from "../../../../../types/service";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { adminMediaService, adminQueryKeys } from "@/services/admin.service";
import type { AdminListResult, AdminMediaItem, AdminMediaRef } from "@/server/modules";
import {
  ADMIN_DEFAULT_PAGE_LIMIT,
  DEFAULT_DEBOUNCE_MS,
  MAX_UPLOAD_BYTES,
} from "@/constants";
import { cn } from "@/modules/shared/components/tw";
import {
  downscaleImage,
  readImageDimensions,
  type ImageDimensions,
} from "@/lib/media/downscale-image";

const ACCEPTED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ACCEPT_ATTR = ACCEPTED_MIME.join(",");
const MAX_UPLOAD_MB = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024));

export type MediaPickerProps = {
  label: string;
  value?: AdminMediaRef | null;
  onChange: (media: AdminMediaRef | null) => void;
  helperText?: string;
};

export type MediaLibraryGridProps = {
  onSelect: (media: AdminMediaRef) => void;
  /**
   * When provided, the grid renders in multi-select mode: selected tiles show a
   * check badge and `onSelect` acts as a toggle (the parent adds/removes).
   */
  selectedIds?: Set<string>;
  /**
   * When true, each tile exposes an inline "edit" affordance that opens a
   * compact metadata dialog (alt required, caption/credit optional). Off by
   * default so external consumers (e.g. gallery builder) keep the plain grid.
   */
  editable?: boolean;
};

/**
 * Debounced local text state — used inside the picker dialog where routing to
 * a URL param would fight `useModalRoute` and pollute the parent editor's URL.
 * The full Media Library page owns its own URL-synced search via
 * `useDebouncedUrlParam`.
 */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

/**
 * Media library browser. Single-select by default; pass `selectedIds` to enable
 * a multi-select toggle mode (used by the gallery insert dialog). Supports
 * debounced filename/alt search and page-based pagination so older assets are
 * reachable — the previous implementation only ever loaded the first page.
 */
export function MediaLibraryGrid({
  onSelect,
  selectedIds,
  editable = false,
}: MediaLibraryGridProps) {
  const [rawQuery, setRawQuery] = useState("");
  const debouncedQuery = useDebouncedValue(rawQuery, DEFAULT_DEBOUNCE_MS).trim();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<AdminMediaItem | null>(null);

  // Reset to page 1 when the query changes so the visible page always matches
  // what the user searched for.
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery]);

  const listPath = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set("page", String(page));
    qs.set("limit", String(ADMIN_DEFAULT_PAGE_LIMIT));
    if (debouncedQuery) qs.set("q", debouncedQuery);
    return `/api/admin/media?${qs.toString()}`;
  }, [debouncedQuery, page]);

  const { data, isLoading, isError, refetch } = useQueryService<
    Record<string, never>,
    AdminListResult<AdminMediaItem>
  >({
    service: { path: listPath, method: ApiMethods.GET },
    options: {
      keys: [adminQueryKeys.media, "picker"],
      keepPreviousData: true,
      searchQuery: debouncedQuery,
    },
  });

  const items = data?.docs ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalDocs = data?.totalDocs ?? 0;
  const multiSelect = selectedIds !== undefined;
  const searching = rawQuery.trim() !== debouncedQuery;

  return (
    <Stack spacing={1.5}>
      <Box className="relative">
        <SearchRounded className="absolute left-2.5 top-1/2 -translate-y-1/2 text-lg text-ink-secondary pointer-events-none" />
        <Box
          component="input"
          type="search"
          value={rawQuery}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            setRawQuery(event.target.value)
          }
          placeholder="Search by filename or alt text"
          aria-label="Search media"
          className="w-full border border-border rounded py-2 pl-9 pr-3 text-sm outline-none focus:border-burgundy focus:ring-2 focus:ring-burgundy/20"
        />
      </Box>

      <DataRenderer
        isLoading={isLoading && !data}
        isError={isError}
        isEmpty={!isLoading && items.length === 0}
        showRetry
        onRetry={refetch}
        size="compact"
        renderEmpty={
          debouncedQuery ? (
            <EmptyState
              size="compact"
              illustration={<EmptyMediaIllustration />}
              title="No matches"
              description={`Nothing matches “${debouncedQuery}”. Try a different word or clear the search.`}
            />
          ) : (
            <EmptyState
              size="compact"
              illustration={<EmptyMediaIllustration />}
              title="No images yet"
              description="Upload an image from the Upload tab to build your media library."
            />
          )
        }
      >
        {() => (
          <>
            <Grid container spacing={1.5}>
              {items.map((item) => {
                const isSelected = selectedIds?.has(item.id) ?? false;
                const select = () => onSelect({ id: item.id, url: item.url, alt: item.alt });
                return (
                  <Grid key={item.id} size={{ xs: 4, md: 3 }}>
                    <Box
                      role={multiSelect ? "checkbox" : "button"}
                      aria-checked={multiSelect ? isSelected : undefined}
                      aria-label={item.alt ?? item.filename ?? "Media image"}
                      tabIndex={0}
                      onClick={select}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          select();
                        }
                      }}
                      className={cn(
                        "relative cursor-pointer border-2 rounded overflow-hidden aspect-square hover:border-burgundy focus-visible:outline focus-visible:outline-2 focus-visible:outline-burgundy",
                        isSelected ? "border-burgundy" : "border-border"
                      )}
                    >
                      {item.url ? (
                        <Box
                          component="img"
                          src={item.url}
                          alt={item.alt ?? item.filename ?? ""}
                          className="w-full h-full object-cover block"
                        />
                      ) : (
                        <Box className="p-2">
                          <Typography variant="caption">{item.filename}</Typography>
                        </Box>
                      )}
                      {multiSelect && isSelected ? (
                        <Box className="absolute top-1 right-1 w-[22px] h-[22px] rounded-full bg-burgundy text-white flex items-center justify-center">
                          <CheckIcon className="text-[16px]" />
                        </Box>
                      ) : null}
                      {editable ? (
                        <Box
                          component="button"
                          type="button"
                          aria-label={`Edit metadata for ${item.filename ?? item.alt ?? "image"}`}
                          onClick={(event: React.MouseEvent) => {
                            event.stopPropagation();
                            setEditing(item);
                          }}
                          className="absolute bottom-1 right-1 w-6 h-6 rounded-full border-none bg-white/92 text-ink flex items-center justify-center cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.2)] hover:bg-white"
                        >
                          <EditOutlined className="text-[14px]" />
                        </Box>
                      ) : null}
                    </Box>
                  </Grid>
                );
              })}
            </Grid>

            {totalPages > 1 ? (
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                className="mt-4 pt-3 border-t border-border"
              >
                <Typography variant="caption" color="text.secondary">
                  Page {page} of {totalPages} · {totalDocs} image{totalDocs === 1 ? "" : "s"}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <AdminButton
                    size="sm"
                    variant="secondary"
                    disabled={page <= 1 || searching}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </AdminButton>
                  <AdminButton
                    size="sm"
                    variant="secondary"
                    disabled={page >= totalPages || searching}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </AdminButton>
                </Stack>
              </Stack>
            ) : null}
          </>
        )}
      </DataRenderer>

      {editing ? (
        <MediaMetadataDialog
          item={editing}
          open={Boolean(editing)}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </Stack>
  );
}

/**
 * Compact metadata editor — reusable between the picker's tile affordance and
 * the full Media Library page. Alt stays required so blind-user experience
 * can't regress silently.
 */
export function MediaMetadataDialog({
  item,
  open,
  onClose,
  onSaved,
}: {
  item: AdminMediaItem;
  open: boolean;
  onClose: () => void;
  onSaved?: (updated: AdminMediaItem) => void;
}) {
  const [alt, setAlt] = useState(item.alt ?? "");
  const [caption, setCaption] = useState(item.caption ?? "");
  const [credit, setCredit] = useState(item.credit ?? "");
  const { showToast } = useKiribeToast();

  // Reset when the dialog re-opens on a different item (mount-only state
  // would carry the previous item's edits into the new one).
  useEffect(() => {
    if (open) {
      setAlt(item.alt ?? "");
      setCaption(item.caption ?? "");
      setCredit(item.credit ?? "");
    }
  }, [open, item.id, item.alt, item.caption, item.credit]);

  const { mutate, isPending } = useMutationService<
    { alt: string; caption?: string; credit?: string },
    AdminMediaItem
  >({
    service: adminMediaService.update(item.id),
    options: {
      successTitle: "Image updated",
      invalidateKeys: [adminQueryKeys.media],
      onSuccess: (updated) => {
        onSaved?.(updated);
        onClose();
      },
      onError: (error) => {
        showToast({
          message: "Update failed",
          description: error?.message ?? "Something went wrong.",
          severity: "error",
        });
      },
    },
  });

  const trimmedAlt = alt.trim();
  const canSave = trimmedAlt.length > 0 && !isPending;

  const handleSave = () => {
    if (!canSave) return;
    mutate({
      alt: trimmedAlt,
      caption: caption.trim(),
      credit: credit.trim(),
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit image details</DialogTitle>
      <DialogContent dividers>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          {item.url ? (
            <Box
              component="img"
              src={item.url}
              alt={item.alt ?? item.filename ?? ""}
              className="w-full sm:w-40 h-[180px] sm:h-40 object-cover rounded border border-border shrink-0"
            />
          ) : null}
          <Stack spacing={2} className="flex-1 min-w-0">
            {item.filename ? (
              <Typography variant="caption" color="text.secondary" noWrap title={item.filename}>
                {item.filename}
              </Typography>
            ) : null}
            <KiribeTextField
              label="Alt text"
              value={alt}
              onChange={(event) => setAlt(event.target.value)}
              fullWidth
              required
              error={alt.length > 0 && !trimmedAlt}
              helperText={
                !trimmedAlt
                  ? "Describe the image for screen readers."
                  : "Describe the image for screen readers."
              }
            />
            <KiribeTextField
              label="Caption"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              fullWidth
              helperText="Shown under the image where the design surfaces one."
            />
            <KiribeTextField
              label="Credit"
              value={credit}
              onChange={(event) => setCredit(event.target.value)}
              fullWidth
              helperText="Photographer / illustrator attribution."
            />
          </Stack>
        </Stack>
      </DialogContent>
      <Stack direction="row" spacing={1} className="px-6 py-4 justify-end">
        <AdminButton variant="secondary" onClick={onClose} disabled={isPending}>
          Cancel
        </AdminButton>
        <AdminButton onClick={handleSave} disabled={isPending || !canSave}>
          {isPending ? "Saving..." : "Save changes"}
        </AdminButton>
      </Stack>
    </Dialog>
  );
}

function MediaUploadForm({ onUploaded }: { onUploaded: (media: AdminMediaRef) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { showToast } = useKiribeToast();
  const [alt, setAlt] = useState("");
  const [selected, setSelected] = useState<File | null>(null);
  const [dimensions, setDimensions] = useState<ImageDimensions | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);

  const { mutate, isPending } = useMutationService<FormData, AdminMediaItem>({
    service: adminMediaService.upload,
    options: {
      successTitle: "Image uploaded",
      invalidateKeys: [adminQueryKeys.media],
      onSuccess: (media) => {
        onUploaded({ id: media.id, url: media.url, alt: media.alt });
        resetFile();
        setAlt("");
      },
    },
  });

  function resetFile() {
    setSelected(null);
    setDimensions(null);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    if (fileRef.current) fileRef.current.value = "";
  }

  const acceptFile = async (file: File) => {
    if (!ACCEPTED_MIME.includes(file.type)) {
      showToast({
        message: "Unsupported file",
        description: "Upload a JPG, PNG, WebP, or GIF image.",
        severity: "error",
      });
      return;
    }
    // Pre-flight the raw size so oversized files get a friendly toast rather
    // than a 413 after a long upload. (Downscaling may shrink it further below.)
    if (file.size > MAX_UPLOAD_BYTES) {
      showToast({
        message: "File too large",
        description: `${file.name} exceeds the ${MAX_UPLOAD_MB}MB limit.`,
        severity: "error",
      });
      return;
    }

    setIsPreparing(true);
    try {
      const dims = await readImageDimensions(file);
      setSelected(file);
      setDimensions(dims);
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return URL.createObjectURL(file);
      });
      if (!alt) {
        setAlt(file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim());
      }
    } finally {
      setIsPreparing(false);
    }
  };

  const handleUpload = async () => {
    if (!selected || !alt.trim()) return;
    // Downscale/re-encode in the browser to cut bytes over the wire.
    const optimized = await downscaleImage(selected);
    if (optimized.size > MAX_UPLOAD_BYTES) {
      showToast({
        message: "File too large",
        description: `Even after optimizing, this exceeds the ${MAX_UPLOAD_MB}MB limit.`,
        severity: "error",
      });
      return;
    }
    const formData = new FormData();
    formData.append("file", optimized);
    formData.append("alt", alt.trim());
    mutate(formData);
  };

  return (
    <Stack spacing={2} className="mt-2">
      <Box
        role="button"
        tabIndex={0}
        aria-label="Drag and drop an image here or click to choose a file"
        onClick={() => fileRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            fileRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          const file = event.dataTransfer.files?.[0];
          if (file) void acceptFile(file);
        }}
        className={cn(
          "flex flex-col items-center gap-2 px-6 py-8 text-center rounded border-2 border-dashed cursor-pointer transition-[border-color,background-color] duration-[120ms] focus-visible:outline focus-visible:outline-2 focus-visible:outline-burgundy",
          isDragging ? "border-burgundy bg-black/5" : "border-border bg-surface"
        )}
      >
        <CloudUploadOutlined color="action" />
        <Typography variant="body2" fontWeight={600}>
          Drag &amp; drop or click to choose
        </Typography>
        <Typography variant="caption" color="text.secondary">
          JPG, PNG, WebP, GIF up to {MAX_UPLOAD_MB}MB
        </Typography>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT_ATTR}
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void acceptFile(file);
          }}
        />
      </Box>

      {selected ? (
        <Stack direction="row" spacing={2} alignItems="center">
          {previewUrl ? (
            <Box
              component="img"
              src={previewUrl}
              alt="Selected preview"
              className="w-[72px] h-[72px] object-cover rounded border border-border shrink-0"
            />
          ) : null}
          <Box className="min-w-0">
            <Typography variant="body2" noWrap title={selected.name}>
              {selected.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {dimensions ? `${dimensions.width}×${dimensions.height}px · ` : ""}
              {(selected.size / (1024 * 1024)).toFixed(1)}MB
            </Typography>
          </Box>
        </Stack>
      ) : null}

      <KiribeTextField
        label="Alt text"
        value={alt}
        onChange={(event) => setAlt(event.target.value)}
        fullWidth
        required
        helperText="Describe the image for screen readers."
      />
      <AdminButton
        onClick={handleUpload}
        disabled={isPending || isPreparing || !selected || !alt.trim()}
      >
        {isPending || isPreparing ? "Uploading..." : "Upload"}
      </AdminButton>
    </Stack>
  );
}

export function MediaPicker({ label, value, onChange, helperText }: MediaPickerProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0);

  const handleSelect = (media: AdminMediaRef) => {
    onChange(media);
    setOpen(false);
  };

  return (
    <Box>
      <Typography variant="body2" fontWeight={600} className="mb-2">
        {label}
      </Typography>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box className="w-24 h-24 rounded border border-border overflow-hidden bg-surface flex items-center justify-center shrink-0">
          {value?.url ? (
            <Box
              component="img"
              src={value.url}
              alt={value.alt ?? ""}
              className="w-full h-full object-cover"
            />
          ) : (
            <Typography variant="caption" color="text.secondary">
              None
            </Typography>
          )}
        </Box>
        <Stack spacing={1}>
          <AdminButton size="sm" variant="secondary" onClick={() => setOpen(true)}>
            {value ? "Change image" : "Choose image"}
          </AdminButton>
          {value ? (
            <AdminButton size="sm" variant="danger" onClick={() => onChange(null)}>
              Remove
            </AdminButton>
          ) : null}
        </Stack>
      </Stack>
      {helperText ? (
        <Typography variant="caption" color="text.secondary" className="mt-1 block">
          {helperText}
        </Typography>
      ) : null}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Select image</DialogTitle>
        <DialogContent dividers>
          <Tabs value={tab} onChange={(_, next) => setTab(next)} className="mb-4">
            <Tab label="Library" />
            <Tab label="Upload" />
          </Tabs>
          {tab === 0 ? (
            <MediaLibraryGrid onSelect={handleSelect} editable />
          ) : (
            <MediaUploadForm onUploaded={handleSelect} />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
