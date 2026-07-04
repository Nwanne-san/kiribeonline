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
import { DataRenderer, EmptyState } from "@/modules/shared/components/feedback";
import { EmptyMediaIllustration } from "@/modules/shared/components/illustrations";
import { KiribeButton, KiribeTextField } from "@/modules/shared/components/ui";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { adminMediaService, adminQueryKeys } from "@/services/admin.service";
import type { AdminListResult, AdminMediaItem, AdminMediaRef } from "@/lib/admin/types";

export type MediaPickerProps = {
  label: string;
  value?: AdminMediaRef | null;
  onChange: (media: AdminMediaRef | null) => void;
  helperText?: string;
};

function MediaLibraryGrid({ onSelect }: { onSelect: (media: AdminMediaRef) => void }) {
  const { data, isLoading, isError, refetch } = useQueryService<
    Record<string, never>,
    AdminListResult<AdminMediaItem>
  >({
    service: { ...adminMediaService.list, data: {} },
    options: { keys: [adminQueryKeys.media] },
  });

  const items = data?.docs ?? [];

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
          {items.map((item) => (
            <Grid key={item.id} size={{ xs: 4, sm: 3 }}>
              <Box
                role="button"
                tabIndex={0}
                onClick={() => onSelect({ id: item.id, url: item.url, alt: item.alt })}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    onSelect({ id: item.id, url: item.url, alt: item.alt });
                  }
                }}
                sx={{
                  cursor: "pointer",
                  border: "1px solid",
                  borderColor: "divider",
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
              </Box>
            </Grid>
          ))}
        </Grid>
      )}
    </DataRenderer>
  );
}

function MediaUploadForm({ onUploaded }: { onUploaded: (media: AdminMediaRef) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [alt, setAlt] = useState("");
  const [fileName, setFileName] = useState("");

  const { mutate, isPending } = useMutationService<FormData, AdminMediaItem>({
    service: adminMediaService.upload,
    options: {
      successTitle: "Image uploaded",
      invalidateKeys: [adminQueryKeys.media],
      onSuccess: (media) => {
        onUploaded({ id: media.id, url: media.url, alt: media.alt });
        setAlt("");
        setFileName("");
        if (fileRef.current) fileRef.current.value = "";
      },
    },
  });

  const handleUpload = () => {
    const file = fileRef.current?.files?.[0];
    if (!file || !alt.trim()) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("alt", alt.trim());
    mutate(formData);
  };

  return (
    <Stack spacing={2} sx={{ mt: 1 }}>
      <Button variant="outlined" component="label">
        {fileName || "Choose file"}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          hidden
          onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
        />
      </Button>
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
        loading={isPending}
        disabled={!fileName || !alt.trim()}
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
