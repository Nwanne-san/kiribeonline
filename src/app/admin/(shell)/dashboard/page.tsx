import type { Metadata } from "next";
import { AdminDashboardPage } from "@/modules/admin/pages/AdminDashboardPage";

export const metadata: Metadata = {
  title: "Dashboard — Kiribe Admin",
  robots: { index: false, follow: false },
};

// Dashboard is intentionally open to every authenticated admin — auth is
// enforced by (shell)/layout.tsx. The dashboard itself adapts its tiles
// and panels to the caller's role: contributors see their article-scoped
// counters and recent work; editor-only panels (Content Performance,
// Recent Activity, homepage shortcuts) render only when the capability
// is present.
export const dynamic = "force-dynamic";

export default function Page() {
  return <AdminDashboardPage />;
}
