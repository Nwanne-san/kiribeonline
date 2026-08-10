import { ReelEditorPage } from "@/modules/admin/pages/ReelEditorPage";
import { requireAdminCapabilityOrRedirect } from "@/server/auth";

type PageProps = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export default async function Page({ params }: PageProps) {
  await requireAdminCapabilityOrRedirect("reels:manage");
  const { id } = await params;
  return <ReelEditorPage reelId={id} />;
}
