import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import NextLink from "next/link";
import { PublicRoutes } from "@/routes/public.routes";
import { ContactForm } from "@/modules/marketing/components/ContactForm";
import {
  Kicker,
  MarketingHero,
  SectionHeader,
} from "@/modules/marketing/components/EditorialHeadings";
import {
  CONTACT_CHANNELS,
  SOCIAL_LINKS,
} from "@/modules/marketing/constants/contact";

/**
 * Contact — rebuilt on the same Tailwind section rhythm as About (dark hero →
 * alternating white / surface-alt bands → shared heading primitives). It
 * previously rendered a bare MUI form on a white page, which read as an
 * unfinished admin screen next to the rest of the site.
 *
 * Server component: nothing here needs client JS except the form itself, which
 * is its own client island.
 */
export function ContactPage() {
  return (
    <>
      <MarketingHero
        kicker="Say Hello"
        title="Get in"
        accentWord="Touch"
        description="Pitches, corrections, partnership ideas, or a note about something we got wrong — the editorial desk reads everything."
      />

      {/* ── Channels + form ──────────────────────────────────── */}
      <section className="bg-surface-alt py-16 md:py-24">
        <div className="editorial-container">
          <SectionHeader kicker="Reach Out" title="How to Contact Us" />

          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[440px_1fr]">
            <div className="space-y-6">
              {CONTACT_CHANNELS.map(({ Icon, kicker, email, desc }) => (
                <div
                  key={kicker}
                  className="flex gap-5 border-l-4 border-burgundy bg-white p-6"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-burgundy text-white">
                    <Icon sx={{ fontSize: 20 }} />
                  </span>
                  <div className="min-w-0">
                    <Kicker>{kicker}</Kicker>
                    <a
                      href={`mailto:${email}`}
                      className="mt-1 block break-words font-headline text-sm text-black hover:text-burgundy"
                    >
                      {email}
                    </a>
                    <p className="mt-1 font-body text-sm text-muted">{desc}</p>
                  </div>
                </div>
              ))}

              <div className="bg-white p-6">
                <p className="font-headline text-xs uppercase tracking-[0.1em] text-muted-soft">
                  Follow Us
                </p>
                <div className="mt-5 flex gap-3">
                  {SOCIAL_LINKS.map(({ Icon, label, href }) => (
                    <a
                      key={label}
                      href={href}
                      aria-label={label}
                      className="flex h-10 w-10 items-center justify-center border border-border text-ink-secondary transition-colors hover:border-burgundy hover:text-burgundy"
                    >
                      <Icon sx={{ fontSize: 18 }} />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <ContactForm idPrefix="contact-page" />
          </div>
        </div>
      </section>

      {/* ── Pitch CTA ────────────────────────────────────────── */}
      <section className="bg-white py-16 md:py-20">
        <div className="editorial-container">
          <div className="flex flex-col items-start justify-between gap-6 bg-surface-alt p-8 md:flex-row md:items-center md:p-10">
            <div className="max-w-xl">
              <h3 className="font-headline text-xl font-normal text-burgundy">
                Want to write for Kiribé?
              </h3>
              <p className="mt-2 font-body text-base leading-relaxed text-[#4a5565]">
                We commission critics, essayists, and reporters year-round. Read
                what we stand for before you pitch.
              </p>
            </div>
            <NextLink
              href={PublicRoutes.about}
              className="inline-flex shrink-0 items-center gap-2 bg-burgundy px-8 py-3 font-headline text-sm uppercase tracking-[0.1em] text-white transition-colors hover:bg-burgundy-dark"
            >
              About Kiribé
              <ArrowForwardIcon sx={{ fontSize: 16 }} />
            </NextLink>
          </div>
        </div>
      </section>
    </>
  );
}
