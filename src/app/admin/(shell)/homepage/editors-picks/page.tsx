import type { Metadata } from "next";
import { EditorsPicksPage } from "@/modules/admin/pages/EditorsPicksPage";

export const metadata: Metadata = {
  title: "Editor's picks — Kiribe Admin",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <EditorsPicksPage />;
}
