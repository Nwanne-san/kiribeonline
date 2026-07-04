import type { Metadata } from "next";
import { AdminLoginPage } from "@/modules/admin/pages/AdminLoginPage";

export const metadata: Metadata = {
  title: "Sign in — Kiribe Admin",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminLoginPage />;
}
