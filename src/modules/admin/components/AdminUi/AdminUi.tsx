"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { cn } from "@/modules/shared/components/tw";

export function AdminCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Paper variant="outlined" className={cn("rounded bg-surface", className)}>
      {children}
    </Paper>
  );
}

export function AdminFieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Typography
      variant="caption"
      className="mb-1.5 block text-[0.65rem] font-bold tracking-[0.09em] text-ink-secondary uppercase"
    >
      {label}
      {required ? <Box component="span" className="ml-0.5 text-danger">*</Box> : null}
    </Typography>
  );
}

export function AdminPageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <Box className="mb-6 flex items-center justify-between">
      <Typography variant="h4" className="text-[1.375rem] font-bold">
        {title}
      </Typography>
      {action}
    </Box>
  );
}

const STATUS_STYLES = {
  draft: { bg: "#F9FAFB", fg: "#6B7280", border: "#D1D5DB", label: "Draft" },
  in_review: { bg: "#FDF3EF", fg: "#7F0400", border: "#F3D7CB", label: "In review" },
  scheduled: { bg: "#EFF6FF", fg: "#2563EB", border: "#BFDBFE", label: "Scheduled" },
  published: { bg: "#F0FDF4", fg: "#15803D", border: "#BBF7D0", label: "Published" },
  archived: { bg: "#F9FAFB", fg: "#9CA3AF", border: "#E5E7EB", label: "Archived" },
} as const;

export function AdminStatusBadge({ status }: { status: keyof typeof STATUS_STYLES }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.draft;
  return (
    <Box
      component="span"
      className="rounded px-2 py-0.5 text-[0.65rem] leading-[1.4] font-bold tracking-[0.08em] uppercase"
      style={{
        border: `1px solid ${s.border}`,
        backgroundColor: s.bg,
        color: s.fg,
      }}
    >
      {s.label}
    </Box>
  );
}

export function AdminStatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <AdminCard className="p-5">
      <Typography
        variant="caption"
        className="text-[0.65rem] font-bold tracking-[0.08em] text-ink-secondary uppercase"
      >
        {label}
      </Typography>
      <Typography variant="h3" className="mt-2 text-[2.125rem] leading-none font-bold">
        {value}
      </Typography>
    </AdminCard>
  );
}

export function AdminCategoryBadge({ label, color = "#6B7280" }: { label: string; color?: string }) {
  return (
    <Typography
      component="span"
      variant="caption"
      className="block text-[0.65rem] font-bold tracking-[0.08em] uppercase"
      style={{ color }}
    >
      {label}
    </Typography>
  );
}

export function AdminEmptyState({
  title = "Nothing here yet",
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Box className="px-4 py-16 text-center">
      <Typography variant="h6" className="mb-1 font-semibold">
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" className="mb-4 text-ink-secondary">
          {description}
        </Typography>
      )}
      {action}
    </Box>
  );
}

export function AdminChipSelect({
  label,
  options,
  value,
  onChange,
  getColor,
}: {
  label: string;
  options: { id: string; name: string; brandColor?: string | null }[];
  value: string[];
  onChange: (ids: string[]) => void;
  getColor?: (opt: { id: string; name: string; brandColor?: string | null }) => string;
}) {
  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  return (
    <AdminCard className="p-4">
      <AdminFieldLabel label={label} />
      <Box className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = value.includes(opt.id);
          const color = getColor?.(opt) ?? opt.brandColor ?? "#6B7280";
          return (
            <Box
              key={opt.id}
              component="button"
              type="button"
              onClick={() => toggle(opt.id)}
              className={cn(
                "cursor-pointer rounded px-2.5 py-1 text-[0.6875rem] font-semibold",
                !active && "border border-border bg-surface text-ink-secondary"
              )}
              style={
                active
                  ? {
                      border: `1px solid ${color}`,
                      backgroundColor: color,
                      color: "#fff",
                    }
                  : undefined
              }
            >
              {opt.name}
            </Box>
          );
        })}
      </Box>
    </AdminCard>
  );
}
