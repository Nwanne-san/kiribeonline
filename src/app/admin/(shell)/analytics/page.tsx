import type { Metadata } from "next";
import { AnalyticsPage } from "@/modules/admin/pages/AnalyticsPage";

export const metadata: Metadata = {
  title: "Analytics — Kiribe Admin",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AnalyticsPage />;
}
