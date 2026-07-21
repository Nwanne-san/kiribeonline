import type { Metadata } from "next";
import { AdminForgotPasswordPage } from "@/modules/admin/pages/AdminForgotPasswordPage";

export const metadata: Metadata = {
  title: "Reset password — Kiribe Admin",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminForgotPasswordPage />;
}
