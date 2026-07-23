import type { Metadata } from "next";
import { RecentActivityPage } from "@/modules/admin/pages/RecentActivityPage";

export const metadata: Metadata = {
  title: "Audit Log — Kiribe Admin",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <RecentActivityPage />;
}
