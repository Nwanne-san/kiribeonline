import type { ReactNode } from "react";

/**
 * Shared editorial layout for legal documents (Privacy Policy, Terms of Use).
 * Renders a dark hero (kicker + display heading + last-updated line), an
 * in-page table of contents, and the numbered prose sections passed in.
 *
 * Content authors provide `sections`; each section id is used both for the
 * TOC anchor and the section heading, so they must be unique per page.
 */

export type LegalSection = {
  /** Stable anchor id — used for the TOC link and the section heading. */
  id: string;
  /** Human-readable section title shown in the TOC and above the prose. */
  title: string;
  /** Section body — typically <LegalProse> children. */
  body: ReactNode;
};

export function LegalPageLayout({
  kicker,
  title,
  intro,
  lastUpdated,
  sections,
}: {
  kicker: string;
  title: string;
  intro: string;
  /** ISO date string (YYYY-MM-DD) the document was last revised. */
  lastUpdated: string;
  sections: LegalSection[];
}) {
  const formattedDate = new Date(`${lastUpdated}T00:00:00Z`).toLocaleDateString(
    "en-GB",
    { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }
  );

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="bg-[#030712]">
        <div className="editorial-container py-20 md:py-28">
          <p className="font-headline text-xs uppercase tracking-[0.1em] text-mustard">
            {kicker}
          </p>
          <h1 className="mt-6 font-headline text-4xl font-normal leading-[1.1] text-white md:text-6xl">
            {title}
          </h1>
          <span className="mt-8 block h-1 w-16 bg-burgundy" />
          <p className="mt-8 max-w-2xl font-body text-lg font-light leading-relaxed text-[#d1d5dc]">
            {intro}
          </p>
          <p className="mt-6 font-body text-sm text-[#99a1af]">
            Last updated{" "}
            <time dateTime={lastUpdated} className="text-white">
              {formattedDate}
            </time>
          </p>
        </div>
      </section>

      {/* ── Body ─────────────────────────────────────────────── */}
      <section className="bg-white py-16 md:py-20">
        <div className="editorial-container grid grid-cols-1 gap-12 lg:grid-cols-[260px_1fr] lg:gap-16">
          {/* Table of contents */}
          <nav aria-label="On this page" className="lg:sticky lg:top-24 lg:self-start">
            <p className="font-headline text-xs uppercase tracking-[0.1em] text-muted-soft">
              On This Page
            </p>
            <span className="mt-3 block h-0.5 w-10 bg-mustard" />
            <ol className="mt-6 space-y-3">
              {sections.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="flex gap-3 font-body text-sm leading-snug text-ink-secondary transition-colors hover:text-burgundy"
                  >
                    <span className="font-headline text-mustard">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>{section.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {/* Prose sections */}
          <div className="max-w-3xl">
            {sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                aria-labelledby={`${section.id}-heading`}
                className="scroll-mt-24 border-b border-surface-muted pb-10 pt-10 first:pt-0 last:border-b-0"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-headline text-lg text-mustard">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h2
                    id={`${section.id}-heading`}
                    className="font-headline text-2xl font-normal text-burgundy md:text-3xl"
                  >
                    {section.title}
                  </h2>
                </div>
                <div className="mt-5">{section.body}</div>
              </section>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

/* ── Prose helpers ───────────────────────────────────────────── */

/** Standard body paragraph for legal prose. */
export function LegalProse({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-4 font-body text-base leading-relaxed text-ink-secondary [&_a]:text-burgundy [&_a]:underline [&_a:hover]:text-burgundy-dark [&_strong]:font-semibold [&_strong]:text-black">
      {children}
    </div>
  );
}

/** Bulleted list for legal prose. */
export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item, index) => (
        <li key={index} className="flex gap-3">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-mustard" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
