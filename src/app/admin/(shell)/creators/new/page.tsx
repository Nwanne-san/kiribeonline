import { CreatorEditorPage } from "@/modules/admin/pages/CreatorEditorPage";
import { requireAdminCapabilityOrRedirect } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireAdminCapabilityOrRedirect("creators:manage");
  return <CreatorEditorPage />;
}
