import { KiribeLoader } from "@/modules/shared/components/brand";

export default function ArticleDetailLoading() {
  // Full viewport height minus the 64px sticky header so the loader sits
  // centred on a full screen instead of a compressed strip above the footer.
  return (
    <div className="flex min-h-[calc(100svh-64px)] items-center justify-center py-16">
      <KiribeLoader size="lg" />
    </div>
  );
}
