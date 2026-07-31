import type { ReactNode } from "react";

/**
 * The three heading primitives every marketing page is built from (About,
 * Contact, and any future static page). Extracted so those pages share one
 * visual language instead of each re-declaring their own kicker/rule.
 */

export function Kicker({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={
        "font-headline text-xs uppercase tracking-[0.1em] text-mustard " + className
      }
    >
      {children}
    </p>
  );
}

export function GoldRule({ className = "" }: { className?: string }) {
  return <span className={"block h-0.5 w-10 bg-mustard " + className} />;
}

/** Section header: kicker + Outfit-regular title + gold rule. */
export function SectionHeader({
  kicker,
  title,
  align = "left",
}: {
  kicker: string;
  title: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "flex flex-col items-center text-center" : ""}>
      <Kicker>{kicker}</Kicker>
      <h2 className="mt-4 font-headline text-4xl font-normal text-burgundy">
        {title}
      </h2>
      <GoldRule className="mt-3" />
    </div>
  );
}

/**
 * Dark full-bleed page hero shared by the static marketing pages. `image` is
 * optional — Contact has no artwork of its own and renders the plain gradient.
 */
export function MarketingHero({
  kicker,
  title,
  accentWord,
  description,
  children,
}: {
  kicker: string;
  title: string;
  /** Rendered in mustard after `title`, e.g. "About **Kiribé**". */
  accentWord?: string;
  description: string;
  /** Optional background layer (e.g. a next/image fill). */
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-[#030712]">
      {children}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(3,7,18,0.8) 0%, rgba(3,7,18,0.6) 50%, rgba(3,7,18,1) 100%)",
        }}
      />
      <div className="editorial-container relative py-20 md:py-40">
        <Kicker>{kicker}</Kicker>
        <h1 className="mt-6 font-headline text-4xl font-normal leading-[1.05] text-white sm:text-5xl md:text-7xl">
          {title}
          {accentWord ? <span className="text-mustard"> {accentWord}</span> : null}
        </h1>
        <span className="mt-8 block h-1 w-16 bg-burgundy" />
        <p className="mt-8 max-w-2xl font-body text-lg font-light leading-relaxed text-[#d1d5dc] md:text-2xl">
          {description}
        </p>
      </div>
    </section>
  );
}
