import { AdminPanel } from "./AdminPrimitives";

/**
 * Loading skeletons for the admin screens. They mirror the real layouts so the
 * transition from loading → loaded doesn't shift the page. Built on the shared
 * `.skeleton-shimmer` sheen (see tailwind.css).
 */

/** A single shimmering placeholder block. Size via className. */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`block rounded bg-surface-muted skeleton-shimmer ${className}`}
    />
  );
}

/** Grid of stat-tile placeholders (dashboard). */
export function StatTilesSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 2xl:grid-cols-8">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="relative overflow-hidden rounded-xl border border-border bg-surface p-4 shadow-card">
          <Skeleton className="mb-3 h-9 w-9 rounded-lg" />
          <Skeleton className="h-7 w-16" />
          <Skeleton className="mt-2 h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

/** Table body placeholder rows. Render inside your own <table> or use standalone. */
export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="divide-y divide-border-soft">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 px-5 py-3.5">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton
              key={c}
              className={`h-4 ${c === 0 ? "flex-[2]" : "flex-1"}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Avatar + two-line rows (activity feed, recent lists). */
export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border-soft">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-5 py-3.5">
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Square-thumbnail grid placeholder (media library). */
export function MediaGridSkeleton({ count = 16 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="aspect-square w-full rounded-lg" />
      ))}
    </div>
  );
}

/** A titled panel wrapping list-style skeleton rows. */
export function PanelListSkeleton({ title, rows = 6 }: { title?: string; rows?: number }) {
  return (
    <AdminPanel title={title}>
      <ListSkeleton rows={rows} />
    </AdminPanel>
  );
}
