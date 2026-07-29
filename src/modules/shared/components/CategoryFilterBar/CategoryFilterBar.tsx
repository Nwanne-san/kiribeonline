"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { CATEGORY_FILTER_OPTIONS, CATEGORY_COLORS } from "@/theme/category-colors";
import { useFilter } from "@/utils/hooks/useFilter";

export function CategoryFilterBar() {
  const { filters, setFilter } = useFilter();
  const activeSlug = filters.category || "all";

  return (
    <Stack direction="row" flexWrap="wrap" gap={1} className="mb-6">
      {CATEGORY_FILTER_OPTIONS.map(({ slug, label }) => {
        const colors = CATEGORY_COLORS[slug];
        const active = activeSlug === slug;
        return (
          <Box
            key={slug}
            component="button"
            type="button"
            onClick={() => setFilter("category", slug === "all" ? undefined : slug)}
            className="text-[0.6875rem] font-bold tracking-[0.06em] px-3 py-1.5 rounded border cursor-pointer"
            style={{
              borderColor: colors.border,
              backgroundColor: active ? colors.bg : "var(--color-surface)",
              color: active ? colors.text : colors.border,
            }}
          >
            {label}
          </Box>
        );
      })}
    </Stack>
  );
}
