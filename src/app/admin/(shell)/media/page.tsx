import type { Metadata } from "next";
import { MediaLibraryPage } from "@/modules/admin/pages/MediaLibraryPage";

export const metadata: Metadata = {
  title: "Media — Kiribe Admin",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <MediaLibraryPage />;
}
