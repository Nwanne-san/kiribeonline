"use client";

import Box from "@mui/material/Box";
import { KiribeLoader } from "@/modules/shared/components/brand";
import { EmptyState } from "@/modules/shared/components/feedback/EmptyState";
import {
  BrokenProjectorIllustration,
  EmptyShelfIllustration,
} from "@/modules/shared/components/illustrations";

export interface DataRendererProps<T = unknown> {
  children?: (args: { data?: T }) => React.ReactNode;
  data?: T;
  isLoading?: boolean;
  isEmpty?: boolean;
  isError?: boolean;
  showRetry?: boolean;
  onRetry?: () => void;
  renderError?: React.ReactNode;
  renderLoading?: React.ReactNode;
  renderEmpty?: React.ReactNode;
  renderRetryContent?: React.ReactNode;
  emptyClassName?: string;
  loadingClassName?: string;
  errorClassName?: string;
  emptyTitle?: string;
  emptySubTitle?: string;
  /** Denser spacing/illustration for admin surfaces. */
  size?: "default" | "compact";
}

export function DefaultErrorElement({
  className,
  onRetry,
  retryLabel = "Try again",
  size = "default",
}: {
  className?: string;
  onRetry?: () => void;
  retryLabel?: string;
  size?: "default" | "compact";
}) {
  return (
    <EmptyState
      className={className}
      size={size}
      illustration={<BrokenProjectorIllustration />}
      title="Something went wrong"
      description="We could not load this content. Try again in a moment."
      action={onRetry ? { label: retryLabel, onClick: onRetry } : undefined}
    />
  );
}

export function DefaultLoadingElement({ className }: { className?: string }) {
  return (
    <Box
      className={className}
      sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}
    >
      <KiribeLoader size="md" />
    </Box>
  );
}

export function DefaultEmptyElement({
  className,
  title,
  subTitle,
  size = "default",
}: {
  className?: string;
  title?: string;
  subTitle?: string;
  size?: "default" | "compact";
}) {
  return (
    <EmptyState
      className={className}
      size={size}
      illustration={<EmptyShelfIllustration />}
      title={title ?? "Nothing here yet"}
      description={subTitle ?? "Check back later for new stories."}
    />
  );
}

export function DataRenderer<T = unknown>({
  children,
  isLoading,
  isEmpty,
  isError,
  showRetry,
  onRetry,
  renderEmpty,
  renderError,
  renderLoading,
  data,
  renderRetryContent = "Try again",
  emptyClassName,
  loadingClassName,
  errorClassName,
  emptyTitle,
  emptySubTitle,
  size = "default",
}: DataRendererProps<T>) {
  if (isLoading && !renderLoading) {
    return <DefaultLoadingElement className={loadingClassName} />;
  }

  if (isLoading && renderLoading) return <>{renderLoading}</>;

  if (isError) {
    if (renderError) return <>{renderError}</>;
    return (
      <DefaultErrorElement
        className={errorClassName}
        size={size}
        onRetry={showRetry && onRetry ? onRetry : undefined}
        retryLabel={
          typeof renderRetryContent === "string" ? renderRetryContent : "Try again"
        }
      />
    );
  }

  if (isEmpty && !renderEmpty) {
    return (
      <DefaultEmptyElement
        title={emptyTitle}
        subTitle={emptySubTitle}
        className={emptyClassName}
        size={size}
      />
    );
  }

  if (isEmpty && renderEmpty) return <>{renderEmpty}</>;

  return <>{children?.({ data })}</>;
}
