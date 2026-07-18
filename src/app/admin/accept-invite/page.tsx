import type { Metadata } from "next";
import { AdminAcceptInvitePage } from "@/modules/admin/pages/AdminAcceptInvitePage";

export const metadata: Metadata = {
  title: "Accept invite — Kiribe Admin",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminAcceptInvitePage />;
}
