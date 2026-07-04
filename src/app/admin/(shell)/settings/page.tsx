import type { Metadata } from "next";
import { SettingsPage } from "@/modules/admin/pages/SettingsPage";

export const metadata: Metadata = {
  title: "Settings — Kiribe Admin",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <SettingsPage />;
}
