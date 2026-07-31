"use client";

import GridViewIcon from "@mui/icons-material/GridView";
import ViewListIcon from "@mui/icons-material/ViewList";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import type { ListViewMode } from "@/constants";
import { KiribeTextField, KiribeTypography } from "@/modules/shared/components/ui";

export type ArchiveToolbarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  view: ListViewMode;
  onViewChange: (view: ListViewMode) => void;
  totalDocs?: number;
  title?: string;
};

export function ArchiveToolbar({
  searchValue,
  onSearchChange,
  view,
  onViewChange,
  totalDocs,
  title,
}: ArchiveToolbarProps) {
  return (
    <Stack spacing={2} sx={{ mb: 3 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ md: "center" }}
        justifyContent="space-between"
      >
        <Box sx={{ flex: 1, maxWidth: { md: 400 } }}>
          <KiribeTextField
            fullWidth
            size="small"
            placeholder="Search articles, authors..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search articles"
          />
        </Box>

        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={(_e, nextView: ListViewMode | null) => {
            if (nextView) onViewChange(nextView);
          }}
          size="small"
          aria-label="View mode"
        >
          <ToggleButton value="grid" aria-label="Grid view">
            <GridViewIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton value="list" aria-label="List view">
            <ViewListIcon fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {typeof totalDocs === "number" && (
        <KiribeTypography variant="body2" color="text.secondary">
          {title ? `${title} · ` : ""}
          {totalDocs} {totalDocs === 1 ? "article" : "articles"}
        </KiribeTypography>
      )}
    </Stack>
  );
}
