"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import { KiribeButton, KiribeTextField } from "@/modules/shared/components/ui";
import { useKiribeToast } from "@/modules/shared/components/feedback";
import { MAX_UPLOAD_BYTES } from "@/constants";
import {
  uploadMediaImage,
  type InlineUploadError,
} from "@/modules/admin/lib/inline-media-upload";
import type { AdminMediaRef } from "@/server/modules";

const ACCEPTED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const ACCEPT_ATTR = ACCEPTED_MIME.join(",");
const MAX_UPLOAD_MB = Math.round(MAX_UPLOAD_BYTES / (1024 * 1024));

type RowStatus =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "uploaded"; media: AdminMediaRef }
  | { kind: "error"; message: string };

type Row = {
  /** Stable id so React can reconcile rows across edits/removals. */
  id: string;
  file: File;
  previewUrl: string;
  filename: string;
  alt: string;
  status: RowStatus;
};

let rowSeq = 0;
function nextRowId(): string {
  rowSeq += 1;
  return `row-${rowSeq}`;
}

function deriveAltFromFilename(name: string): string {
  return name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
}

function buildRow(file: File): Row {
  return {
    id: nextRowId(),
    file,
    previewUrl: URL.createObjectURL(file),
    filename: file.name,
    alt: deriveAltFromFilename(file.name),
    status: { kind: "idle" },
  };
}

/**
 * Bulk-upload form for the Media Library's Upload tab.
 *
 * Distinct from `MediaUploadForm` (single-file, picker-oriented) by design:
 * the library's job is stocking the asset catalog in batches, not reviewing
 * one image at length. Rows pre-fill alt text from the filename stem so the
 * operator can accept defaults for a whole drop and still edit any row.
 *
 * Uploads run sequentially so the server sees a predictable R2 write cadence
 * and the per-row status log reads top-to-bottom; the throughput loss vs.
 * parallel is negligible for a typical 5–20 image batch.
 */
export function MediaMultiUploadForm({
  initialFiles,
  onComplete,
}: {
  /** Files handed in by a parent surface (e.g., the library dropzone). The
   *  component also lets the operator add more files via the picker. */
  initialFiles?: File[];
  /** Fired once per batch after sequential uploads finish, with the successful
   *  references so the parent can refetch the grid and route the operator to
   *  edit any that need caption/credit polish. */
  onComplete?: (uploaded: AdminMediaRef[]) => void;
}) {
  const { showToast } = useKiribeToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const seededKeyRef = useRef<string>("");

  // Preview URLs come from createObjectURL; revoke on unmount so they don't
  // leak into the browser's blob cache after the dialog closes.
  useEffect(() => {
    return () => {
      for (const row of rows) URL.revokeObjectURL(row.previewUrl);
    };
    // Revoke only on unmount — deleting a single row revokes inline.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Seed rows from parent-supplied files once per batch. The seed key is the
  // concatenated file identities, so a fresh set of files replaces rows but a
  // re-render with the *same* files doesn't wipe the operator's edits.
  useEffect(() => {
    if (!initialFiles || initialFiles.length === 0) return;
    const key = initialFiles.map((f) => `${f.name}:${f.size}:${f.lastModified}`).join("|");
    if (key === seededKeyRef.current) return;
    seededKeyRef.current = key;

    const valid: File[] = [];
    for (const file of initialFiles) {
      if (!ACCEPTED_MIME.includes(file.type)) {
        showToast({
          message: "Unsupported file",
          description: `${file.name} isn't a JPG, PNG, WebP, or GIF.`,
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
      valid.push(file);
    }
    if (valid.length === 0) return;

    setRows((current) => {
      for (const row of current) URL.revokeObjectURL(row.previewUrl);
      return valid.map(buildRow);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFiles]);

  const addFiles = (incoming: FileList | File[]) => {
    const list = Array.from(incoming);
    const valid: File[] = [];
    for (const file of list) {
      if (!ACCEPTED_MIME.includes(file.type)) {
        showToast({
          message: "Unsupported file",
          description: `${file.name} isn't a JPG, PNG, WebP, or GIF.`,
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
      valid.push(file);
    }
    if (valid.length === 0) return;
    setRows((current) => [...current, ...valid.map(buildRow)]);
  };

  const updateRow = (id: string, patch: Partial<Row>) => {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  };

  const removeRow = (id: string) => {
    setRows((current) => {
      const target = current.find((row) => row.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return current.filter((row) => row.id !== id);
    });
  };

  // Only rows that still need uploading count toward the "Upload all" gate.
  // Already-uploaded rows stick around as success receipts until the dialog
  // closes so the operator can confirm what actually landed.
  const pendingRows = useMemo(
    () =>
      rows.filter(
        (row) => row.status.kind === "idle" || row.status.kind === "error",
      ),
    [rows],
  );

  const canUploadAll =
    pendingRows.length > 0 &&
    pendingRows.every((row) => row.alt.trim().length > 0) &&
    !isUploading;

  const uploadAll = async () => {
    if (!canUploadAll) return;
    setIsUploading(true);
    const uploaded: AdminMediaRef[] = [];
    const failures: InlineUploadError[] = [];
    try {
      for (const row of pendingRows) {
        updateRow(row.id, { status: { kind: "uploading" } });
        const result = await uploadMediaImage({
          file: row.file,
          alt: row.alt.trim(),
          filename: row.filename.trim() || row.file.name,
          hiddenFromLibrary: false,
        });
        if (result.ok) {
          updateRow(row.id, { status: { kind: "uploaded", media: result.media } });
          uploaded.push(result.media);
        } else {
          failures.push(result.error);
          updateRow(row.id, {
            status: {
              kind: "error",
              message: explainUploadError(result.error),
            },
          });
        }
      }
    } finally {
      setIsUploading(false);
    }

    if (uploaded.length > 0) {
      showToast({
        message:
          uploaded.length === 1
            ? "Image uploaded"
            : `${uploaded.length} images uploaded`,
        severity: "success",
      });
      onComplete?.(uploaded);
    }
    if (failures.length > 0) {
      showToast({
        message: `${failures.length} upload${failures.length === 1 ? "" : "s"} failed`,
        description: "Fix the highlighted rows and retry.",
        severity: "error",
      });
    }
  };

  return (
    <Stack spacing={2} sx={{ mt: 1 }}>
      <Dropzone
        onFiles={addFiles}
        inputRef={fileRef}
        disabled={isUploading}
        hasRows={rows.length > 0}
      />

      {rows.length > 0 && (
        <Stack spacing={1.5}>
          {rows.map((row) => (
            <UploadRow
              key={row.id}
              row={row}
              onChange={(patch) => updateRow(row.id, patch)}
              onRemove={() => removeRow(row.id)}
              disabled={isUploading && row.status.kind !== "uploaded"}
            />
          ))}
        </Stack>
      )}

      {rows.length > 0 && (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <KiribeButton
            onClick={uploadAll}
            loading={isUploading}
            disabled={!canUploadAll}
          >
            {pendingRows.length > 1
              ? `Upload ${pendingRows.length} images`
              : "Upload"}
          </KiribeButton>
        </Stack>
      )}
    </Stack>
  );
}

function explainUploadError(err: InlineUploadError): string {
  switch (err.kind) {
    case "too-large":
      return `Exceeds the ${MAX_UPLOAD_MB}MB limit`;
    case "unsupported-type":
      return "Unsupported file format";
    case "server":
      return err.message;
  }
}

function Dropzone({
  onFiles,
  inputRef,
  disabled,
  hasRows,
}: {
  onFiles: (files: FileList | File[]) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  disabled: boolean;
  hasRows: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  return (
    <Box
      role="button"
      tabIndex={0}
      aria-label="Drag and drop images here or click to choose files"
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(event) => {
        if (disabled) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(event) => {
        if (disabled) return;
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        if (disabled) return;
        const files = event.dataTransfer.files;
        if (files && files.length > 0) onFiles(files);
      }}
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
        px: 3,
        py: hasRows ? 2 : 4,
        textAlign: "center",
        borderRadius: 1,
        border: "2px dashed",
        borderColor: isDragging ? "primary.main" : "divider",
        bgcolor: isDragging ? "action.hover" : "background.default",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        transition: "border-color 120ms, background-color 120ms",
        "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main" },
      }}
    >
      <CloudUploadOutlinedIcon color="action" />
      <Typography variant="body2" fontWeight={600}>
        {hasRows ? "Add more images" : "Drag & drop or click to choose"}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        JPG, PNG, WebP, GIF up to {MAX_UPLOAD_MB}MB · multiple files supported
      </Typography>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        multiple
        hidden
        onChange={(event) => {
          if (event.target.files?.length) onFiles(event.target.files);
          event.target.value = "";
        }}
      />
    </Box>
  );
}

function UploadRow({
  row,
  onChange,
  onRemove,
  disabled,
}: {
  row: Row;
  onChange: (patch: Partial<Row>) => void;
  onRemove: () => void;
  disabled: boolean;
}) {
  const status = row.status;
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      alignItems="flex-start"
      sx={{
        border: "1px solid",
        borderColor:
          status.kind === "error"
            ? "error.main"
            : status.kind === "uploaded"
              ? "success.main"
              : "divider",
        p: 2,
        borderRadius: 1,
        bgcolor: "background.default",
      }}
    >
      <Box
        component="img"
        src={row.previewUrl}
        alt=""
        aria-hidden
        sx={{
          width: { xs: "100%", sm: 96 },
          height: { xs: 140, sm: 96 },
          objectFit: "cover",
          borderRadius: 1,
          border: "1px solid",
          borderColor: "divider",
          flexShrink: 0,
        }}
      />
      <Stack spacing={1} sx={{ flex: 1, minWidth: 0, width: "100%" }}>
        <KiribeTextField
          label="Filename"
          value={row.filename}
          onChange={(event) => onChange({ filename: event.target.value })}
          fullWidth
          disabled={disabled || status.kind === "uploaded"}
        />
        <KiribeTextField
          label="Alt text"
          value={row.alt}
          onChange={(event) => onChange({ alt: event.target.value })}
          fullWidth
          required
          disabled={disabled || status.kind === "uploaded"}
          helperText={
            status.kind === "uploaded"
              ? undefined
              : "Describe the image for screen readers."
          }
        />
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ flexWrap: "wrap", rowGap: 1 }}
        >
          <StatusChip status={status} />
          <Box sx={{ flex: 1 }} />
          {status.kind !== "uploaded" && (
            <Button
              color="error"
              size="small"
              onClick={onRemove}
              disabled={disabled}
              startIcon={<DeleteOutlineRoundedIcon fontSize="small" />}
            >
              Remove
            </Button>
          )}
        </Stack>
      </Stack>
    </Stack>
  );
}

function StatusChip({ status }: { status: RowStatus }) {
  switch (status.kind) {
    case "idle":
      return (
        <Typography variant="caption" color="text.secondary">
          Ready to upload
        </Typography>
      );
    case "uploading":
      return (
        <Typography variant="caption" color="primary.main">
          Uploading…
        </Typography>
      );
    case "uploaded":
      return (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <CheckCircleRoundedIcon sx={{ fontSize: 16 }} color="success" />
          <Typography variant="caption" color="success.main" fontWeight={600}>
            Uploaded
          </Typography>
        </Stack>
      );
    case "error":
      return (
        <Stack direction="row" spacing={0.5} alignItems="center">
          <ErrorOutlineRoundedIcon sx={{ fontSize: 16 }} color="error" />
          <Typography variant="caption" color="error.main" fontWeight={600}>
            {status.message}
          </Typography>
        </Stack>
      );
  }
}
