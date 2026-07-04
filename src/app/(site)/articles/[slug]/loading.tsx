import { KiribeLoader } from "@/modules/shared/components/brand";

export default function ArticleDetailLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center py-16">
      <KiribeLoader size="lg" />
    </div>
  );
}
