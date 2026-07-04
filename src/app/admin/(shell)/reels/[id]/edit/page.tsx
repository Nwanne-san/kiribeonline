import { ReelEditorPage } from "@/modules/admin/pages/ReelEditorPage";

type PageProps = { params: Promise<{ id: string }> };

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <ReelEditorPage reelId={id} />;
}
