"use client";

import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import { useEffect, useState } from "react";
import { ApiMethods } from "../../../../../types/service";
import { KiribeButton, KiribeTextField, KiribeTypography } from "@/modules/shared/components/ui";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useQueryService } from "@/utils/hooks/useQueryService";
import client from "@/utils/client";
import { unwrapApiData } from "@/lib/api/unwrap";

type Article = { id: string; title: string };
type PickRow = { articleId: string; sortOrder: number };

export function EditorsPicksPage() {
  const [picks, setPicks] = useState<PickRow[]>([]);

  const { data: articles } = useQueryService<Record<string, never>, { docs: Article[] }>({
    service: { path: "/api/admin/articles?status=published", method: ApiMethods.GET },
    options: { keys: ["admin", "articles", "published"] },
  });

  useEffect(() => {
    void (async () => {
      const res = await client.request<never, Record<string, unknown>>({
        path: "/api/admin/homepage",
        method: ApiMethods.GET,
      });
      const data = unwrapApiData(res);
      const rows = (data.editorsPicks as Array<{ article: { id: string }; sortOrder?: number }>) ?? [];
      setPicks(
        rows.map((row, index) => ({
          articleId: String(row.article?.id ?? ""),
          sortOrder: row.sortOrder ?? index,
        }))
      );
    })();
  }, []);

  const { mutate, isPending } = useMutationService({
    service: (payload) => ({
      path: "/api/admin/homepage",
      method: ApiMethods.PATCH,
      data: payload,
    }),
    options: { keys: ["admin", "homepage", "picks"] },
  });

  const addPick = () => {
    if (picks.length >= 5) return;
    const first = articles?.docs?.[0];
    setPicks((prev) => [...prev, { articleId: first ? String(first.id) : "", sortOrder: prev.length }]);
  };

  return (
    <Stack spacing={3}>
      <KiribeTypography variant="h4">Editor&apos;s Picks</KiribeTypography>
      <KiribeTypography variant="body2" color="text.secondary">
        Up to 5 articles shown in the homepage sidebar.
      </KiribeTypography>
      {picks.map((pick, index) => (
        <KiribeTextField
          key={index}
          select
          label={`Pick ${index + 1}`}
          value={pick.articleId}
          onChange={(e) => {
            const next = [...picks];
            next[index] = { ...pick, articleId: e.target.value };
            setPicks(next);
          }}
          fullWidth
        >
          {(articles?.docs ?? []).map((a) => (
            <MenuItem key={a.id} value={String(a.id)}>
              {a.title}
            </MenuItem>
          ))}
        </KiribeTextField>
      ))}
      <Stack direction="row" spacing={2}>
        <KiribeButton variant="outlined" onClick={addPick} disabled={picks.length >= 5}>
          Add pick
        </KiribeButton>
        <KiribeButton
          onClick={() => mutate({ editorsPicks: picks })}
          disabled={isPending}
        >
          {isPending ? "Saving..." : "Save picks"}
        </KiribeButton>
      </Stack>
    </Stack>
  );
}
