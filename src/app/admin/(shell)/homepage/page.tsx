import type { Metadata } from "next";
import { HomepageBuilderPage } from "@/modules/admin/pages/HomepageBuilderPage";

export const metadata: Metadata = {
  title: "Homepage — Kiribe Admin",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <HomepageBuilderPage />;
}
