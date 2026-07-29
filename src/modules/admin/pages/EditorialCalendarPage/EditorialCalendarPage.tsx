"use client";

import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ApiMethods } from "../../../../../types/service";
import {
  AdminButton,
  AdminPageHeader,
  AdminPanel,
  CategoryTag,
  Pill,
  type PillTone,
} from "@/modules/admin/components/ui/AdminPrimitives";
import { TableSkeleton } from "@/modules/admin/components/ui/AdminSkeletons";
import { AdminRoutes, adminRoute } from "@/routes/admin.routes";
import { useQueryService } from "@/utils/hooks/useQueryService";
import { CATEGORY_COLORS, type CategorySlug } from "@/theme/category-colors";

type TermRef = { id: string; name: string; slug: string };
type CalendarArticle = {
  id: string;
  title: string;
  status: string;
  publishedAt?: string | null;
  categories?: TermRef[];
};

type ListResult = { docs: CalendarArticle[]; totalDocs: number };

const STATUS_TONE: Record<string, PillTone> = {
  scheduled: "indigo",
  published: "success",
  in_review: "brand",
  draft: "warning",
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

/** Monday-first weekday index (0 = Mon … 6 = Sun). */
function mondayIndex(d: Date) {
  return (d.getDay() + 6) % 7;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function categoryColor(slug?: string) {
  if (!slug) return "#4b5563";
  return CATEGORY_COLORS[slug as CategorySlug]?.bg ?? "#4b5563";
}

export function EditorialCalendarPage() {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const monthLabel = cursor.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const { data, isLoading } = useQueryService<Record<string, never>, ListResult>({
    service: {
      path: "/api/admin/articles?status=scheduled&limit=100&sort=oldest",
      method: ApiMethods.GET,
    },
    options: { keys: ["admin", "calendar", "scheduled"] },
  });

  const articles = useMemo(() => data?.docs ?? [], [data?.docs]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarArticle[]>();
    for (const article of articles) {
      if (!article.publishedAt) continue;
      const dt = new Date(article.publishedAt);
      if (dt.getFullYear() !== cursor.getFullYear() || dt.getMonth() !== cursor.getMonth()) {
        continue;
      }
      const key = dt.toISOString().slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(article);
      map.set(key, list);
    }
    return map;
  }, [articles, cursor]);

  const cells = useMemo(() => {
    const total = daysInMonth(cursor);
    const pad = mondayIndex(startOfMonth(cursor));
    const out: Array<{ date: Date | null }> = [];
    for (let i = 0; i < pad; i++) out.push({ date: null });
    for (let day = 1; day <= total; day++) {
      out.push({ date: new Date(cursor.getFullYear(), cursor.getMonth(), day) });
    }
    while (out.length % 7 !== 0) out.push({ date: null });
    return out;
  }, [cursor]);

  const today = new Date();

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title="Editorial Calendar"
        subtitle="Scheduled articles by publish date. Drag-and-drop scheduling lands later."
        action={
          <div className="flex items-center gap-2">
            <AdminButton
              size="sm"
              variant="secondary"
              leftIcon={<ChevronLeftRounded className="text-[18px]" />}
              onClick={() =>
                setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
              }
              aria-label="Previous month"
            >
              Prev
            </AdminButton>
            <span className="min-w-[9rem] text-center font-headline text-sm font-semibold uppercase tracking-widest text-admin-primary">
              {monthLabel}
            </span>
            <AdminButton
              size="sm"
              variant="secondary"
              onClick={() =>
                setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
              }
              aria-label="Next month"
            >
              Next
              <ChevronRightRounded className="text-[18px]" />
            </AdminButton>
          </div>
        }
      />

      <AdminPanel title={`${articles.length} scheduled`}>
        {isLoading ? (
          <div className="p-5">
            <TableSkeleton rows={4} />
          </div>
        ) : (
          <div className="p-4">
            <div className="mb-2 grid grid-cols-7 gap-1">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="px-1 py-2 text-center font-headline text-[0.65rem] font-semibold uppercase tracking-widest text-muted"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((cell, idx) => {
                if (!cell.date) {
                  return <div key={`empty-${idx}`} className="min-h-24 border border-transparent" />;
                }
                const key = cell.date.toISOString().slice(0, 10);
                const dayItems = byDay.get(key) ?? [];
                const isToday = sameDay(cell.date, today);
                return (
                  <div
                    key={key}
                    className={`min-h-24 border border-border bg-surface p-1.5 ${
                      isToday ? "ring-2 ring-admin-primary ring-offset-1" : ""
                    }`}
                  >
                    <div
                      className={`mb-1 text-xs font-semibold ${
                        isToday ? "text-admin-primary" : "text-muted"
                      }`}
                    >
                      {cell.date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayItems.slice(0, 3).map((article) => {
                        const cat = article.categories?.[0];
                        return (
                          <Link
                            key={article.id}
                            href={adminRoute(AdminRoutes.articleEdit, { id: article.id })}
                            className="block truncate border border-border-soft bg-surface-alt px-1.5 py-1 text-[0.65rem] leading-tight text-ink hover:border-admin-primary hover:text-admin-primary"
                            title={article.title}
                          >
                            <span className="mb-0.5 block">
                              {cat ? (
                                <CategoryTag label={cat.name} color={categoryColor(cat.slug)} />
                              ) : (
                                <Pill tone={STATUS_TONE[article.status] ?? "neutral"}>
                                  {article.status}
                                </Pill>
                              )}
                            </span>
                            {article.title}
                          </Link>
                        );
                      })}
                      {dayItems.length > 3 ? (
                        <div className="text-[0.65rem] text-muted">+{dayItems.length - 3} more</div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </AdminPanel>
    </div>
  );
}
