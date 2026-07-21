import { KiribeLoader } from "@/modules/shared/components/brand";

/**
 * Full-page loader for admin route transitions inside the shell. The shell
 * layout is already rendered — this only fills the main content area — so the
 * loader sits centred in the workspace, not over the sidebar/top bar.
 */
export default function AdminShellLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center text-burgundy">
      <KiribeLoader size="lg" label="Loading admin" />
    </div>
  );
}
