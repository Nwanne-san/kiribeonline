"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";

export function AdminCard({ children, sx }: { children: ReactNode; sx?: SxProps<Theme> }) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 1, bgcolor: "background.paper", ...sx }}>
      {children}
    </Paper>
  );
}

export function AdminFieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Typography
      variant="caption"
      sx={{
        display: "block",
        mb: 0.75,
        fontWeight: 700,
        letterSpacing: "0.09em",
        textTransform: "uppercase",
        color: "text.secondary",
        fontSize: "0.65rem",
      }}
    >
      {label}
      {required ? <Box component="span" sx={{ color: "error.main", ml: 0.25 }}>*</Box> : null}
    </Typography>
  );
}

export function AdminPageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
      <Typography variant="h4" sx={{ fontSize: "1.375rem", fontWeight: 700 }}>
        {title}
      </Typography>
      {action}
    </Box>
  );
}

const STATUS_STYLES = {
  draft: { bg: "#F9FAFB", fg: "#6B7280", border: "#D1D5DB", label: "Draft" },
  scheduled: { bg: "#EFF6FF", fg: "#2563EB", border: "#BFDBFE", label: "Scheduled" },
  published: { bg: "#F0FDF4", fg: "#15803D", border: "#BBF7D0", label: "Published" },
  archived: { bg: "#F9FAFB", fg: "#9CA3AF", border: "#E5E7EB", label: "Archived" },
} as const;

export function AdminStatusBadge({ status }: { status: keyof typeof STATUS_STYLES }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.draft;
  return (
    <Box
      component="span"
      sx={{
        fontSize: "0.65rem",
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        px: 1,
        py: 0.25,
        borderRadius: 0.5,
        border: `1px solid ${s.border}`,
        bgcolor: s.bg,
        color: s.fg,
        lineHeight: 1.4,
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
    <AdminCard sx={{ p: 2.5 }}>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "0.65rem" }}>
        {label}
      </Typography>
      <Typography variant="h3" sx={{ mt: 1, fontSize: "2.125rem", fontWeight: 700, lineHeight: 1 }}>
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
      sx={{
        color,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        fontSize: "0.65rem",
        display: "block",
      }}
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
    <Box sx={{ textAlign: "center", py: 8, px: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
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
    <AdminCard sx={{ p: 2 }}>
      <AdminFieldLabel label={label} />
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
        {options.map((opt) => {
          const active = value.includes(opt.id);
          const color = getColor?.(opt) ?? opt.brandColor ?? "#6B7280";
          return (
            <Box
              key={opt.id}
              component="button"
              type="button"
              onClick={() => toggle(opt.id)}
              sx={{
                fontSize: "0.6875rem",
                fontWeight: 600,
                px: 1.25,
                py: 0.5,
                borderRadius: 0.5,
                border: `1px solid ${active ? color : "divider"}`,
                bgcolor: active ? color : "background.paper",
                color: active ? "#fff" : "text.secondary",
                cursor: "pointer",
              }}
            >
              {opt.name}
            </Box>
          );
        })}
      </Box>
    </AdminCard>
  );
}
