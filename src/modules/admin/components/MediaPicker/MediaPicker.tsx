"use client";

import { useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
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
import { DataRenderer, EmptyState, useKiribeToast } from "@/modules/shared/components/feedback";
import { EmptyMediaIllustration } from "@/modules/shared/components/illustrations";
import { KiribeButton, KiribeTextField } from "@/modules/shared/components/ui";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { adminMediaService, adminQueryKeys } from "@/services/admin.service";
import type { AdminListResult, AdminMediaItem, AdminMediaRef } from "@/server/modules";
import { MAX_UPLOAD_BYTES } from "@/constants";
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
};

/**
 * Media library browser. Single-select by default; pass `selectedIds` to enable
 * a multi-select toggle mode (used by the gallery insert dialog).
 */
export function MediaLibraryGrid({ onSelect, selectedIds }: MediaLibraryGridProps) {
  const { data, isLoading, isError, refetch } = useQueryService<
    Record<string, never>,
    AdminListResult<AdminMediaItem>
  >({
    service: { ...adminMediaService.list, data: {} },
    options: { keys: [adminQueryKeys.media] },
  });

  const items = data?.docs ?? [];
  const multiSelect = selectedIds !== undefined;

  return (
    <DataRenderer
      isLoading={isLoading}
      isError={isError}
      isEmpty={!isLoading && items.length === 0}
      showRetry
      onRetry={refetch}
      size="compact"
      renderEmpty={
        <EmptyState
          size="compact"
          illustration={<EmptyMediaIllustration />}
          title="No images yet"
          description="Upload an image from the Upload tab to build your media library."
        />
      }
    >
      {() => (
        <Grid container spacing={1.5}>
          {items.map((item) => {
            const isSelected = selectedIds?.has(item.id) ?? false;
            const select = () => onSelect({ id: item.id, url: item.url, alt: item.alt });
            return (
              <Grid key={item.id} size={{ xs: 4, sm: 3 }}>
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
                  sx={{
                    position: "relative",
                    cursor: "pointer",
                    border: "2px solid",
                    borderColor: isSelected ? "primary.main" : "divider",
                    borderRadius: 1,
                    overflow: "hidden",
                    aspectRatio: "1 / 1",
                    "&:hover": { borderColor: "primary.main" },
                    "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main" },
                  }}
                >
                  {item.url ? (
                    <Box
                      component="img"
                      src={item.url}
                      alt={item.alt ?? item.filename ?? ""}
                      sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  ) : (
                    <Box sx={{ p: 1 }}>
                      <Typography variant="caption">{item.filename}</Typography>
                    </Box>
                  )}
                  {multiSelect && isSelected ? (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        bgcolor: "primary.main",
                        color: "primary.contrastText",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <CheckIcon sx={{ fontSize: 16 }} />
                    </Box>
                  ) : null}
                </Box>
              </Grid>
            );
          })}
        </Grid>
      )}
    </DataRenderer>
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
    <Stack spacing={2} sx={{ mt: 1 }}>
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
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1,
          px: 3,
          py: 4,
          textAlign: "center",
          borderRadius: 1,
          border: "2px dashed",
          borderColor: isDragging ? "primary.main" : "divider",
          bgcolor: isDragging ? "action.hover" : "background.default",
          cursor: "pointer",
          transition: "border-color 120ms, background-color 120ms",
          "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main" },
        }}
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
              sx={{
                width: 72,
                height: 72,
                objectFit: "cover",
                borderRadius: 1,
                border: "1px solid",
                borderColor: "divider",
                flexShrink: 0,
              }}
            />
          ) : null}
          <Box sx={{ minWidth: 0 }}>
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
      <KiribeButton
        onClick={handleUpload}
        loading={isPending || isPreparing}
        disabled={!selected || !alt.trim()}
      >
        Upload
      </KiribeButton>
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
      <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          sx={{
            width: 96,
            height: 96,
            borderRadius: 1,
            border: "1px solid",
            borderColor: "divider",
            overflow: "hidden",
            bgcolor: "background.default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {value?.url ? (
            <Box
              component="img"
              src={value.url}
              alt={value.alt ?? ""}
              sx={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <Typography variant="caption" color="text.secondary">
              None
            </Typography>
          )}
        </Box>
        <Stack spacing={1}>
          <Button variant="outlined" size="small" onClick={() => setOpen(true)}>
            {value ? "Change image" : "Choose image"}
          </Button>
          {value ? (
            <Button color="error" size="small" onClick={() => onChange(null)}>
              Remove
            </Button>
          ) : null}
        </Stack>
      </Stack>
      {helperText ? (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
          {helperText}
        </Typography>
      ) : null}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Select image</DialogTitle>
        <DialogContent dividers>
          <Tabs value={tab} onChange={(_, next) => setTab(next)} sx={{ mb: 2 }}>
            <Tab label="Library" />
            <Tab label="Upload" />
          </Tabs>
          {tab === 0 ? (
            <MediaLibraryGrid onSelect={handleSelect} />
          ) : (
            <MediaUploadForm onUploaded={handleSelect} />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
