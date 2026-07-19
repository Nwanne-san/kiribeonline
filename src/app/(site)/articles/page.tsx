import type { Metadata } from "next";
import { ArticlesPage } from "@/modules/editorial/pages/ArticlesPage";

const title = "Articles";
const description =
  "The latest film, television, opinion, news, and spotlight features from Kiribé Online.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/articles" },
  openGraph: { type: "website", title, description, url: "/articles" },
};

export default function Page() {
  return <ArticlesPage />;
}
