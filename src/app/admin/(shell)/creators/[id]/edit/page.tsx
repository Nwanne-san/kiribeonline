import { CreatorEditorPage } from "@/modules/admin/pages/CreatorEditorPage";
import { requireAdminCapabilityOrRedirect } from "@/server/auth";

type PageProps = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export default async function Page({ params }: PageProps) {
  await requireAdminCapabilityOrRedirect("creators:manage");
  const { id } = await params;
  return <CreatorEditorPage creatorId={id} />;
}
