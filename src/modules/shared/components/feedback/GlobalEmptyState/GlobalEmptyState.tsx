import { EmptyState } from "@/modules/shared/components/feedback/EmptyState";

export type GlobalEmptyStateProps = {
  title: string;
  description: string;
  /** Optional branded illustration (or any node) rendered above the copy. */
  image?: React.ReactNode;
};

/**
 * Thin backwards-compatible alias over {@link EmptyState}.
 *
 * Existing callers pass `image`; new callers should prefer `EmptyState`
 * directly with an `illustration` and optional `action`.
 */
export function GlobalEmptyState({
  title,
  description,
  image,
}: GlobalEmptyStateProps) {
  return (
    <EmptyState illustration={image} title={title} description={description} />
  );
}
