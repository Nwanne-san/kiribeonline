import { redirect } from "next/navigation";
import { AdminRoutes } from "@/routes/admin.routes";

export const dynamic = "force-dynamic";

export default function AdminIndexPage() {
  redirect(AdminRoutes.dashboard);
}
