"use client";

import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import ErrorOutlined from "@mui/icons-material/ErrorOutlined";
import WarningAmberOutlined from "@mui/icons-material/WarningAmberOutlined";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { KiribeButton } from "@/modules/shared/components/ui";

/**
 * A checklist row surfaced by the publish gate. `hard` items block publish
 * outright (grey button, no way past); `soft` items warn but let the editor
 * publish anyway.
 */
export type ChecklistItem = {
  key: string;
  label: string;
  ok: boolean;
  hard: boolean;
};

/**
 * Confirmation dialog shown before publishing (or scheduling) an article.
 *
 * Hard-blocks: hero image, excerpt, at least one category, hero alt text.
 * Soft-warns: SEO title and SEO description (still publishable, but the
 *  social/search preview will fall back to defaults).
 *
 * The dialog is purely presentational — the caller decides which items to
 * pass and reacts to `onConfirm`. Kept dumb so it can be reused (e.g. for
 * a future scheduling flow).
 */
export function PublishChecklistDialog({
  open,
  items,
  targetStatus,
  onCancel,
  onConfirm,
  isPending,
}: {
  open: boolean;
  items: ChecklistItem[];
  /** "published" or "scheduled" — used only for copy. */
  targetStatus: "published" | "scheduled";
  onCancel: () => void;
  onConfirm: () => void;
  isPending?: boolean;
}) {
  const hardBlocked = items.some((item) => item.hard && !item.ok);
  const hasSoftWarn = items.some((item) => !item.hard && !item.ok);

  const title = targetStatus === "scheduled" ? "Ready to schedule?" : "Ready to publish?";

  const confirmLabel = hardBlocked
    ? "Publish"
    : hasSoftWarn
      ? targetStatus === "scheduled"
        ? "Schedule anyway"
        : "Publish anyway"
      : targetStatus === "scheduled"
        ? "Schedule"
        : "Publish";

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {hardBlocked
            ? "A few required fields are missing. Fix these before publishing."
            : hasSoftWarn
              ? "Publish is possible, but a few recommended fields are empty. Readers will get default social previews."
              : "All checks look good."}
        </Typography>
        <Stack spacing={1.25} component="ul" sx={{ pl: 0, m: 0, listStyle: "none" }}>
          {items.map((item) => (
            <ChecklistRow key={item.key} item={item} />
          ))}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <KiribeButton variant="outlined" onClick={onCancel} disabled={isPending}>
          Keep editing
        </KiribeButton>
        <KiribeButton
          onClick={onConfirm}
          disabled={hardBlocked || isPending}
          aria-disabled={hardBlocked || isPending}
        >
          {isPending ? "Saving..." : confirmLabel}
        </KiribeButton>
      </DialogActions>
    </Dialog>
  );
}

function ChecklistRow({ item }: { item: ChecklistItem }) {
  const Icon = item.ok
    ? CheckCircleOutlined
    : item.hard
      ? ErrorOutlined
      : WarningAmberOutlined;
  const tone = item.ok
    ? { color: "#15803d" }
    : item.hard
      ? { color: "#b42318" }
      : { color: "#b54708" };
  return (
    <Stack component="li" direction="row" spacing={1.25} alignItems="center">
      <Icon fontSize="small" sx={tone} aria-hidden />
      <Typography variant="body2" sx={{ ...tone, fontWeight: 500 }}>
        {item.label}
      </Typography>
    </Stack>
  );
}
