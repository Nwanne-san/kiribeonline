import { ReelsListPage } from "@/modules/admin/pages/ReelsListPage";
import { requireAdminCapabilityOrRedirect } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireAdminCapabilityOrRedirect("reels:manage");
  return <ReelsListPage />;
}
