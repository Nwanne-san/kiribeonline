import type { Metadata } from "next";
import { SubscribersPage } from "@/modules/admin/pages/SubscribersPage";

export const metadata: Metadata = {
  title: "Subscribers — Kiribe Admin",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <SubscribersPage />;
}
