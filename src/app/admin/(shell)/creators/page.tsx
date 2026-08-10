import { CreatorsListPage } from "@/modules/admin/pages/CreatorsListPage";
import { requireAdminCapabilityOrRedirect } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireAdminCapabilityOrRedirect("creators:manage");
  return <CreatorsListPage />;
}
