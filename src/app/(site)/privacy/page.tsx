import type { Metadata } from "next";
import { breadcrumbListSchema, JsonLd } from "@/lib/seo/json-ld";
import { PrivacyPolicyPage } from "@/modules/marketing/pages/PrivacyPolicyPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Kiribé Online collects, uses, and protects your information — the data we gather, why, who we share it with, and the choices you have.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Privacy Policy | Kiribé Online",
    description:
      "How Kiribé Online collects, uses, and protects your information.",
    type: "website",
    url: "/privacy",
  },
};

export default function Page() {
  return (
    <>
      <JsonLd
        data={breadcrumbListSchema([
          { name: "Home", url: "/" },
          { name: "Privacy Policy", url: "/privacy" },
        ])}
      />
      <PrivacyPolicyPage />
    </>
  );
}
