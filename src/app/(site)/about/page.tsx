import type { Metadata } from "next";
import { breadcrumbListSchema, JsonLd } from "@/lib/seo/json-ld";
import { AboutPage } from "@/modules/marketing/pages/AboutPage";

export const metadata: Metadata = {
  title: "About Kiribé",
  description:
    "Premium entertainment journalism for audiences who take culture seriously. Twelve years covering African and global film, television, and the cultural conversations that matter.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About Kiribé",
    description:
      "Premium entertainment journalism for audiences who take culture seriously.",
    type: "website",
    url: "/about",
  },
};

export default function Page() {
  return (
    <>
      <JsonLd
        data={breadcrumbListSchema([
          { name: "Home", url: "/" },
          { name: "About", url: "/about" },
        ])}
      />
      <AboutPage />
    </>
  );
}
