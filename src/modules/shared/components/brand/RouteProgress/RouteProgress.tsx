"use client";

import { useNavigationProgress } from "./NavigationProgress";
import styles from "./RouteProgress.module.css";

/**
 * 2px mustard indeterminate bar pinned to the bottom edge of its positioned
 * ancestor (the header). Hidden until a route transition is pending.
 */
export function RouteProgress() {
  const { pending } = useNavigationProgress();
  return (
    <div className={styles.track} data-active={pending} aria-hidden="true">
      <div className={styles.bar} />
    </div>
  );
}
