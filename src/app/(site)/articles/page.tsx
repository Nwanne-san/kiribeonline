import type { Metadata } from "next";
import {
  breadcrumbListSchema,
  collectionPageSchema,
  JsonLd,
} from "@/lib/seo/json-ld";
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
  return (
    <>
      <JsonLd
        data={collectionPageSchema({ name: title, description, url: "/articles" })}
      />
      <JsonLd
        data={breadcrumbListSchema([
          { name: "Home", url: "/" },
          { name: "Articles", url: "/articles" },
        ])}
      />
      <ArticlesPage />
    </>
  );
}
