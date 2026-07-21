import type { Metadata } from "next";
import { AdminResetPasswordPage } from "@/modules/admin/pages/AdminResetPasswordPage";

export const metadata: Metadata = {
  title: "Reset password — Kiribe Admin",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminResetPasswordPage />;
}
