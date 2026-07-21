import { KiribeLoader } from "@/modules/shared/components/brand";

/**
 * Full-page loader for admin auth screens (login, accept-invite, forgot/reset
 * password) — no shell is mounted here, so the loader takes the whole viewport.
 */
export default function AdminLoading() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-cream text-burgundy">
      <KiribeLoader size="lg" label="Loading" />
    </div>
  );
}
