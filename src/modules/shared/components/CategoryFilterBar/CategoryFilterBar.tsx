"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { CATEGORY_FILTER_OPTIONS, CATEGORY_COLORS } from "@/theme/category-colors";
import { useFilter } from "@/utils/hooks/useFilter";

export function CategoryFilterBar() {
  const { filters, setFilter } = useFilter();
  const activeSlug = filters.category || "all";

  return (
    <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 3 }}>
      {CATEGORY_FILTER_OPTIONS.map(({ slug, label }) => {
        const colors = CATEGORY_COLORS[slug];
        const active = activeSlug === slug;
        return (
          <Box
            key={slug}
            component="button"
            type="button"
            onClick={() => setFilter("category", slug === "all" ? undefined : slug)}
            sx={{
              fontSize: "0.6875rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              px: 1.5,
              py: 0.75,
              borderRadius: 0.5,
              border: `1px solid ${colors.border}`,
              bgcolor: active ? colors.bg : "background.paper",
              color: active && slug === "all" ? colors.text : active ? colors.text : colors.border,
              cursor: "pointer",
            }}
          >
            {label}
          </Box>
        );
      })}
    </Stack>
  );
}
