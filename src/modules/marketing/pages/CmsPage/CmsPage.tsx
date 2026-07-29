import { RichTextRenderer } from "@/modules/shared/components/feedback";
import type { PublicPage } from "@/lib/content/query-pages";

/**
 * Renders an editor-authored CMS page (`/<slug>`). Deliberately plain: a hero
 * matching the legal-page chrome plus the rich-text body, so an editor can add
 * a page without a developer designing a layout for it. Pages that need bespoke
 * design still ship as React routes under `src/modules/marketing/pages/`.
 */
export function CmsPage({ page }: { page: PublicPage }) {
  const updated = page.publishedAt ?? page.updatedAt ?? null;
  const formattedDate = updated
    ? new Date(updated).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      })
    : null;

  return (
    <>
      <section className="bg-[#030712]">
        <div className="editorial-container py-20 md:py-28">
          <h1 className="font-headline text-4xl font-normal leading-[1.1] text-white md:text-6xl">
            {page.title}
          </h1>
          <span className="mt-8 block h-1 w-16 bg-burgundy" />
          {page.excerpt && (
            <p className="mt-8 max-w-2xl font-body text-lg font-light leading-relaxed text-[#d1d5dc]">
              {page.excerpt}
            </p>
          )}
          {formattedDate && updated && (
            <p className="mt-6 font-body text-sm text-[#99a1af]">
              Last updated{" "}
              <time dateTime={updated} className="text-white">
                {formattedDate}
              </time>
            </p>
          )}
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="editorial-container max-w-3xl">
          <RichTextRenderer
            content={page.body as Record<string, unknown> | null}
          />
        </div>
      </section>
    </>
  );
}
