import type { Metadata } from "next";
import { AboutPage } from "@/modules/marketing/pages/AboutPage";

export const metadata: Metadata = {
  title: "About Kiribé",
  description:
    "Premium entertainment journalism for audiences who take culture seriously. Twelve years covering African and global film, television, and the cultural conversations that matter.",
  openGraph: {
    title: "About Kiribé",
    description:
      "Premium entertainment journalism for audiences who take culture seriously.",
    type: "website",
  },
};

export default function Page() {
  return <AboutPage />;
}
