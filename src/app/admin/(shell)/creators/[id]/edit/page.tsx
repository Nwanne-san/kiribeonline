import { CreatorEditorPage } from "@/modules/admin/pages/CreatorEditorPage";

type PageProps = { params: Promise<{ id: string }> };

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <CreatorEditorPage creatorId={id} />;
}
