import type { Metadata } from "next";
import { InReviewPage } from "@/modules/admin/pages/InReviewPage";

export const metadata: Metadata = {
  title: "In Review — Kiribé Admin",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <InReviewPage />;
}
