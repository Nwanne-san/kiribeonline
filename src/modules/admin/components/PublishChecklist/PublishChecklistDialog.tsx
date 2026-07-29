"use client";

import CheckCircleOutlined from "@mui/icons-material/CheckCircleOutlined";
import ErrorOutlined from "@mui/icons-material/ErrorOutlined";
import WarningAmberOutlined from "@mui/icons-material/WarningAmberOutlined";
import { AdminButton } from "@/modules/admin/components/ui/AdminPrimitives";

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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-checklist-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md border border-border bg-surface shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-border px-5 py-4">
          <h2 id="publish-checklist-title" className="font-headline text-lg font-bold text-ink">
            {title}
          </h2>
        </div>
        <div className="px-5 py-4">
          <p className="mb-3 text-sm text-muted">
            {hardBlocked
              ? "A few required fields are missing. Fix these before publishing."
              : hasSoftWarn
                ? "Publish is possible, but a few recommended fields are empty. Readers will get default social previews."
                : "All checks look good."}
          </p>
          <ul className="m-0 list-none space-y-2.5 p-0">
            {items.map((item) => (
              <ChecklistRow key={item.key} item={item} />
            ))}
          </ul>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <AdminButton variant="secondary" onClick={onCancel} disabled={isPending}>
            Keep editing
          </AdminButton>
          <AdminButton onClick={onConfirm} disabled={hardBlocked || isPending}>
            {isPending ? "Saving..." : confirmLabel}
          </AdminButton>
        </div>
      </div>
    </div>
  );
}

function ChecklistRow({ item }: { item: ChecklistItem }) {
  const Icon = item.ok
    ? CheckCircleOutlined
    : item.hard
      ? ErrorOutlined
      : WarningAmberOutlined;
  const tone = item.ok
    ? "text-[#15803d]"
    : item.hard
      ? "text-[#b42318]"
      : "text-[#b54708]";
  return (
    <li className={`flex items-center gap-2.5 text-sm font-medium ${tone}`}>
      <Icon fontSize="small" aria-hidden />
      <span>{item.label}</span>
    </li>
  );
}
