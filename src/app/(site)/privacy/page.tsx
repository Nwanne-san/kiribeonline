import type { Metadata } from "next";
import { PrivacyPolicyPage } from "@/modules/marketing/pages/PrivacyPolicyPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Kiribé Online collects, uses, and protects your information — the data we gather, why, who we share it with, and the choices you have.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Privacy Policy | Kiribé Online",
    description:
      "How Kiribé Online collects, uses, and protects your information.",
    type: "website",
  },
};

export default function Page() {
  return <PrivacyPolicyPage />;
}
