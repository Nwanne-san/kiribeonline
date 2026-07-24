"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import SaveRounded from "@mui/icons-material/SaveRounded";
import { useEffect, useState } from "react";
import { ApiMethods } from "../../../../../types/service";
import {
  AdminButton,
  AdminField,
  AdminPageHeader,
  AdminPanel,
  AdminSelect,
} from "@/modules/admin/components/ui/AdminPrimitives";
import { useMutationService } from "@/utils/hooks/useMutationService";
import { useQueryService } from "@/utils/hooks/useQueryService";
import client from "@/utils/client";
import { unwrapApiData } from "@/lib/api/unwrap";

type Article = { id: string; title: string };
type PickRow = { articleId: string; sortOrder: number };

const MAX_PICKS = 5;

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
      const rows =
        (data.editorsPicks as Array<{ article: { id: string }; sortOrder?: number }>) ?? [];
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
    if (picks.length >= MAX_PICKS) return;
    const first = articles?.docs?.[0];
    setPicks((prev) => [
      ...prev,
      { articleId: first ? String(first.id) : "", sortOrder: prev.length },
    ]);
  };

  const removePick = (index: number) => {
    setPicks((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((row, i) => ({ ...row, sortOrder: i }))
    );
  };

  const canAdd = picks.length < MAX_PICKS;

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Editor's Picks"
        subtitle={`Up to ${MAX_PICKS} articles surfaced on the homepage sidebar · ${picks.length}/${MAX_PICKS} selected`}
      />

      <AdminPanel title="Selected picks">
        <div className="space-y-3 p-5">
          {picks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-surface-alt px-4 py-10 text-center text-sm text-muted-soft">
              No picks yet. Add up to {MAX_PICKS} to feature them in the homepage sidebar.
            </div>
          ) : (
            picks.map((pick, index) => (
              <div key={index} className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <AdminField label={`Pick ${index + 1}`} htmlFor={`pick-${index}`}>
                    <AdminSelect
                      id={`pick-${index}`}
                      value={pick.articleId}
                      onChange={(e) => {
                        const next = [...picks];
                        next[index] = { ...pick, articleId: e.target.value };
                        setPicks(next);
                      }}
                    >
                      <option value="">Select an article…</option>
                      {(articles?.docs ?? []).map((a) => (
                        <option key={a.id} value={String(a.id)}>
                          {a.title}
                        </option>
                      ))}
                    </AdminSelect>
                  </AdminField>
                </div>
                <AdminButton
                  variant="ghost"
                  size="sm"
                  onClick={() => removePick(index)}
                  aria-label={`Remove pick ${index + 1}`}
                  leftIcon={<DeleteOutlineRounded sx={{ fontSize: 16 }} />}
                >
                  Remove
                </AdminButton>
              </div>
            ))
          )}
        </div>
      </AdminPanel>

      <div className="flex items-center gap-2">
        <AdminButton
          variant="secondary"
          onClick={addPick}
          disabled={!canAdd}
          leftIcon={<AddRounded sx={{ fontSize: 16 }} />}
        >
          Add pick
        </AdminButton>
        <AdminButton
          onClick={() => mutate({ editorsPicks: picks })}
          disabled={isPending}
          leftIcon={<SaveRounded sx={{ fontSize: 16 }} />}
        >
          {isPending ? "Saving…" : "Save picks"}
        </AdminButton>
      </div>
    </div>
  );
}
