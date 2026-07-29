import type { Metadata } from "next";
import { EditorialCalendarPage } from "@/modules/admin/pages/EditorialCalendarPage";

export const metadata: Metadata = {
  title: "Editorial Calendar — Kiribe Admin",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <EditorialCalendarPage />;
}
