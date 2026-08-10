import type { Metadata } from "next";
import { InReviewPage } from "@/modules/admin/pages/InReviewPage";
import { requireAdminCapabilityOrRedirect } from "@/server/auth";

export const metadata: Metadata = {
  title: "In Review — Kiribé Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function Page() {
  await requireAdminCapabilityOrRedirect("articles:edit");
  return <InReviewPage />;
}
