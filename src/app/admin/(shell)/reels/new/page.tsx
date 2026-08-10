import { ReelEditorPage } from "@/modules/admin/pages/ReelEditorPage";
import { requireAdminCapabilityOrRedirect } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireAdminCapabilityOrRedirect("reels:manage");
  return <ReelEditorPage />;
}
