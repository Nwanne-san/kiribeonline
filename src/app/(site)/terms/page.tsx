import type { Metadata } from "next";
import { breadcrumbListSchema, JsonLd } from "@/lib/seo/json-ld";
import { TermsOfUsePage } from "@/modules/marketing/pages/TermsOfUsePage";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "The terms that govern your use of Kiribé Online — content ownership, acceptable use, disclaimers, limitation of liability, and governing law.",
  alternates: { canonical: "/terms" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Terms of Use | Kiribé Online",
    description: "The terms that govern your use of Kiribé Online.",
    type: "website",
    url: "/terms",
  },
};

export default function Page() {
  return (
    <>
      <JsonLd
        data={breadcrumbListSchema([
          { name: "Home", url: "/" },
          { name: "Terms of Use", url: "/terms" },
        ])}
      />
      <TermsOfUsePage />
    </>
  );
}
