import type { Metadata } from "next";
import { ContactPage } from "@/modules/marketing/pages/ContactPage";

const title = "Contact";
const description =
  "Get in touch with the Kiribé Online editorial team — pitches, feedback, and enquiries.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/contact" },
  openGraph: { type: "website", title, description, url: "/contact" },
};

export default function Page() {
  return <ContactPage />;
}
