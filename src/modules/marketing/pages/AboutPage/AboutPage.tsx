import Image from "next/image";
import NextLink from "next/link";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import MovieOutlinedIcon from "@mui/icons-material/MovieOutlined";
import TvOutlinedIcon from "@mui/icons-material/TvOutlined";
import MicNoneOutlinedIcon from "@mui/icons-material/MicNoneOutlined";
import CheckIcon from "@mui/icons-material/Check";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { PublicRoutes } from "@/routes/public.routes";
import { ContactForm } from "@/modules/marketing/components/ContactForm";
import {
  GoldRule,
  Kicker,
  SectionHeader,
} from "@/modules/marketing/components/EditorialHeadings";
import {
  CONTACT_CHANNELS,
  SOCIAL_LINKS,
} from "@/modules/marketing/constants/contact";

/* ── Data ────────────────────────────────────────────────────── */

/** Height of the sticky site header — sticky cards must clear it. */
const STICKY_HEADER_OFFSET = 64;

const STATS = [
  { value: "1M+", label: "Monthly Readers" },
  { value: "40+", label: "Countries Reached" },
  { value: "200+", label: "Contributors Worldwide" },
  { value: "12", label: "Years of Publishing" },
];

const TAGS = [
  { Icon: MovieOutlinedIcon, label: "Film" },
  { Icon: TvOutlinedIcon, label: "Television" },
  { Icon: MicNoneOutlinedIcon, label: "Podcasts" },
  { Icon: PublicOutlinedIcon, label: "World Cinema" },
];

const VALUES = [
  {
    Icon: ShieldOutlinedIcon,
    title: "Editorial Independence",
    body: "Our journalism is beholden to no studio, platform, or advertiser. Every review, profile, and opinion is written without fear or favor.",
  },
  {
    Icon: PublicOutlinedIcon,
    title: "Global Perspective",
    body: "We cover culture from every corner — African cinema, European arthouse, Asian TV dramas, and everything in between.",
  },
  {
    Icon: EmojiEventsOutlinedIcon,
    title: "Critical Rigour",
    body: "Praise is earned, not given. We hold the work we love to the same standards as the work we question.",
  },
  {
    Icon: GroupsOutlinedIcon,
    title: "Community First",
    body: "Kiribé exists for the reader. Our comment spaces, events, and newsletters are built to start conversations, not end them.",
  },
];

const MILESTONES = [
  { node: "13", year: "2013", title: "Founded", body: "Kiribé launched as a quarterly print magazine focused on African cinema and television." },
  { node: "16", year: "2016", title: "Digital First", body: "We moved online, reaching readers in 40+ countries within our first year as a digital publication." },
  { node: "18", year: "2018", title: "Festival Partnerships", body: "Launched our first official media partnerships with three major international film festivals." },
  { node: "20", year: "2020", title: "Podcast Launch", body: "Our flagship podcast “Frame by Frame” debuted and reached 500,000 downloads in its first season." },
  { node: "22", year: "2022", title: "Video & Streaming", body: "Expanded into original video journalism, short documentaries, and critic-led series." },
  { node: "25", year: "2025", title: "One Million Readers", body: "Kiribé surpasses one million monthly readers — a milestone that belongs to every contributor and subscriber." },
];

const ETHICS = [
  "Every piece published on Kiribé goes through at least two editorial passes before it reaches a reader.",
  "We separate editorial and commercial operations entirely — advertisers and partners have zero influence over coverage.",
  "Our critics disclose personal connections to the work they review. Transparency is not optional.",
  "Long-form investigations are fact-checked by an independent editorial desk before publication.",
];

const TEAM = [
  { img: "/images/about/team-amara.png", role: "Editor-in-Chief", name: "Amara Okafor", bio: "Former correspondent for Screen International. Amara has covered African cinema for over a decade and leads Kiribé's editorial vision." },
  { img: "/images/about/team-kwame.png", role: "Head of Television", name: "Kwame Asante", bio: "Former TV producer turned critic. Kwame brings an insider's eye to Kiribé's coverage of series, drama, and the business of broadcasting." },
  { img: "/images/about/team-blessing.png", role: "Senior Critic & Academic Editor", name: "Dr. Blessing Nwosu", bio: "Professor of Film Studies at the University of Lagos. Blessing brings rigorous academic thinking to Kiribé's most challenging long-form pieces." },
  { img: "/images/about/team-chisom.png", role: "Film Critic & Cinematography Editor", name: "Chisom Adiele", bio: "Festival programmer and critic whose writing has appeared in Sight & Sound, Reverse Shot, and The Film Stage." },
];

/* ── Page ────────────────────────────────────────────────────── */

export function AboutPage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#030712]">
        <Image
          src="/images/about/hero.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-25"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(3,7,18,0.8) 0%, rgba(3,7,18,0.6) 50%, rgba(3,7,18,1) 100%)",
          }}
        />
        <div className="editorial-container relative py-28 md:py-40">
          <Kicker>Who We Are</Kicker>
          <h1 className="mt-6 font-headline text-5xl font-normal leading-[1.05] text-white md:text-7xl">
            About <span className="text-mustard">Kiribé</span>
          </h1>
          <span className="mt-8 block h-1 w-16 bg-burgundy" />
          <p className="mt-8 max-w-2xl font-body text-xl font-light leading-relaxed text-[#d1d5dc] md:text-2xl">
            Premium entertainment journalism for audiences who take culture
            seriously.
          </p>
        </div>
      </section>

      {/* ── Our Story ────────────────────────────────────────── */}
      <section className="bg-white py-20 md:py-24">
        <div className="editorial-container grid grid-cols-1 gap-14 lg:grid-cols-[362px_1fr] lg:gap-16">
          <div>
            <Kicker>Our Story</Kicker>
            <h2 className="mt-4 font-headline text-4xl font-normal leading-tight text-burgundy">
              Twelve Years. One Commitment.
            </h2>
            <GoldRule className="mt-6" />
            <dl className="mt-8">
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className="flex items-baseline gap-3 border-b border-surface-muted py-4"
                >
                  <dd className="font-headline text-4xl font-normal text-burgundy">
                    {s.value}
                  </dd>
                  <dt className="font-body text-sm uppercase tracking-[0.025em] text-muted">
                    {s.label}
                  </dt>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <div className="relative aspect-[16/9] w-full bg-surface-muted">
              <Image
                src="/images/about/story.png"
                alt="Kiribé newsroom"
                fill
                sizes="(max-width: 1024px) 100vw, 790px"
                className="object-cover"
              />
            </div>
            <div className="mt-10 space-y-6 font-body text-lg leading-relaxed">
              <p className="text-[#1e2939]">
                Kiribé was founded in 2013 with a simple conviction: that African
                and diaspora culture deserved the kind of serious, sustained
                editorial attention that had long been reserved for Western
                productions. A quarterly print magazine at first, it quickly
                outgrew that format — because the story was moving too fast, and
                the readers were too hungry.
              </p>
              <p className="text-ink-secondary">
                Today Kiribé is a digital-first publication read by over one
                million people in more than forty countries. We cover film,
                television, opinion, documentary, and the cultural conversations
                that cut across all of them. Our critics are filmmakers,
                academics, journalists, and lifelong cinephiles. What unites them
                is a refusal to be satisfied with easy answers.
              </p>
              <p className="text-ink-secondary">
                We believe that entertainment journalism matters — not as a
                vehicle for publicity, but as genuine cultural criticism that
                helps audiences understand what they are watching, why it was
                made, and what it means for the world they live in.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              {TAGS.map(({ Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-2 border border-border px-4 py-2 font-headline text-xs uppercase tracking-[0.1em] text-ink-secondary"
                >
                  <Icon sx={{ fontSize: 18 }} className="text-mustard" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Our Mission ──────────────────────────────────────── */}
      <section className="bg-burgundy py-20">
        <div className="editorial-container flex flex-col items-center text-center">
          <Kicker>Our Mission</Kicker>
          <blockquote className="mt-6 max-w-4xl font-headline text-3xl font-normal leading-[1.25] text-white md:text-5xl md:leading-[1.25]">
            “To be the most trusted voice in African and global entertainment
            journalism — rigorous, independent, and built on the belief that
            great storytelling changes the world.”
          </blockquote>
          <span className="mt-8 block h-0.5 w-12 bg-mustard" />
        </div>
      </section>

      {/* ── Our Values ───────────────────────────────────────── */}
      <section className="bg-surface-alt py-20 md:py-24">
        <div className="editorial-container">
          <SectionHeader kicker="What We Stand For" title="Our Values" />
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
            {VALUES.map(({ Icon, title, body }) => (
              <div
                key={title}
                className="flex gap-5 border-l-4 border-mustard bg-white p-8"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-burgundy text-white">
                  <Icon sx={{ fontSize: 24 }} />
                </span>
                <div>
                  <h3 className="font-headline text-xl font-normal text-black">
                    {title}
                  </h3>
                  <p className="mt-3 font-body text-base leading-relaxed text-[#4a5565]">
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Key Milestones ───────────────────────────────────── */}
      <section className="bg-white py-20 md:py-24">
        <div className="editorial-container">
          <SectionHeader kicker="The Journey" title="Key Milestones" />
          <div className="relative mt-16">
            {/* connecting line (desktop) */}
            <span className="absolute left-0 right-0 top-6 hidden h-px bg-border lg:block" />
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-6 lg:gap-6">
              {MILESTONES.map((m) => (
                <div key={m.year} className="relative">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-mustard bg-white">
                    <span className="font-headline text-xs font-bold text-burgundy">
                      {m.node}
                    </span>
                  </span>
                  <Kicker className="mt-6">{m.year}</Kicker>
                  <h3 className="mt-2 font-headline text-base font-normal text-black">
                    {m.title}
                  </h3>
                  <p className="mt-2 max-w-[190px] font-body text-sm leading-relaxed text-muted">
                    {m.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Editorial Without Compromise ─────────────────────── */}
      <section className="bg-[#030712]">
        <div className="editorial-container">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="relative min-h-[320px] lg:min-h-[640px]">
              <Image
                src="/images/about/editorial.png"
                alt="Kiribé editorial desk"
                fill
                sizes="(max-width: 1024px) 100vw, 608px"
                className="object-cover opacity-80"
              />
            </div>
            <div className="flex flex-col justify-center bg-[#101828] p-10 md:p-14">
              <Kicker>How We Work</Kicker>
              <h2 className="mt-5 font-headline text-4xl font-normal text-white">
                Editorial Without Compromise
              </h2>
              <GoldRule className="mt-6" />
              <ul className="mt-8 space-y-5">
                {ETHICS.map((item) => (
                  <li key={item} className="flex gap-4">
                    <CheckIcon
                      sx={{ fontSize: 20 }}
                      className="mt-0.5 shrink-0 text-mustard"
                    />
                    <p className="font-body text-base leading-relaxed text-[#d1d5dc]">
                      {item}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Editorial Team ───────────────────────────────────── */}
      <section className="bg-white py-20 md:py-24">
        <div className="editorial-container">
          <SectionHeader kicker="The People" title="Editorial Team" />
          {/*
            Mobile: a sticky card stack. The container is a flex column so every
            card shares one containing block and can pin while the next scrolls
            up over it — inside a grid, each card would only stick within its own
            row and nothing would stack. From `sm` up it reverts to the plain
            grid, where `static` cancels the pinning.
          */}
          <div className="mt-12 flex flex-col gap-6 sm:grid sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
            {TEAM.map((member, i) => (
              <div
                key={member.name}
                className="sticky bg-white pb-6 shadow-[0_-12px_24px_-18px_rgba(0,0,0,0.35)] sm:static sm:pb-0 sm:shadow-none"
                style={{
                  // Clears the 64px sticky header, then steps each card down a
                  // little so the ones already pinned stay peeking through.
                  top: `${STICKY_HEADER_OFFSET + i * 12}px`,
                }}
              >
                <div className="relative aspect-[4/3] w-full bg-surface-muted sm:aspect-[3/4]">
                  <Image
                    src={member.img}
                    alt={member.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px"
                    className="object-cover"
                  />
                  <span className="absolute bottom-0 left-0 h-1 w-full bg-mustard" />
                </div>
                <Kicker className="mt-6">{member.role}</Kicker>
                <h3 className="mt-1 font-headline text-lg font-normal text-black">
                  {member.name}
                </h3>
                <p className="mt-3 font-body text-sm leading-relaxed text-muted">
                  {member.bio}
                </p>
              </div>
            ))}
          </div>

          {/* Write for Kiribé CTA */}
          <div className="mt-16 flex flex-col items-start justify-between gap-6 bg-surface-alt p-10 md:flex-row md:items-center">
            <div className="max-w-xl">
              <h3 className="font-headline text-xl font-normal text-burgundy">
                Write for Kiribé
              </h3>
              <p className="mt-2 font-body text-base leading-relaxed text-[#4a5565]">
                We&apos;re always looking for sharp critics, essayists, and
                journalists who share our commitment to rigorous, independent
                cultural journalism.
              </p>
            </div>
            <NextLink
              href={PublicRoutes.contact}
              className="inline-flex shrink-0 items-center gap-2 bg-burgundy px-8 py-3 font-headline text-sm uppercase tracking-[0.1em] text-white transition-colors hover:bg-burgundy-dark"
            >
              Pitch an Article
              <ArrowForwardIcon sx={{ fontSize: 16 }} />
            </NextLink>
          </div>
        </div>
      </section>

      {/* ── Get in Touch ─────────────────────────────────────── */}
      <section className="bg-surface-alt py-20 md:py-24">
        <div className="editorial-container">
          <SectionHeader kicker="Reach Out" title="Get in Touch" />
          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[440px_1fr]">
            {/* Left: contact channels */}
            <div className="space-y-6">
              {CONTACT_CHANNELS.map(({ Icon, kicker, email, desc }) => (
                <div
                  key={kicker}
                  className="flex gap-5 border-l-4 border-burgundy bg-white p-6"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-burgundy text-white">
                    <Icon sx={{ fontSize: 20 }} />
                  </span>
                  <div>
                    <Kicker>{kicker}</Kicker>
                    <a
                      href={`mailto:${email}`}
                      className="mt-1 block font-headline text-sm text-black hover:text-burgundy"
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

            {/* Right: form */}
            <ContactForm idPrefix="about" />
          </div>
        </div>
      </section>
    </>
  );
}
