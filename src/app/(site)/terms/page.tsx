import type { Metadata } from "next";
import { TermsOfUsePage } from "@/modules/marketing/pages/TermsOfUsePage";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "The terms that govern your use of Kiribé Online — content ownership, acceptable use, disclaimers, limitation of liability, and governing law.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Terms of Use | Kiribé Online",
    description: "The terms that govern your use of Kiribé Online.",
    type: "website",
  },
};

export default function Page() {
  return <TermsOfUsePage />;
}
