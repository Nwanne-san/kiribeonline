#!/usr/bin/env node
/**
 * Seed demo articles, creators, reels, users, and homepage global.
 * Run after `npm run seed:taxonomy`. Idempotent — safe to re-run.
 *
 * Adds real Unsplash imagery, long-form articles across every category, an
 * editor-role account for local RBAC testing, and a pending admin invite for
 * the project owner (raw token is printed to stdout only, never stored raw).
 *
 * Usage: npm run seed:demo
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomBytes, randomUUID } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envLocalPath = resolve(__dirname, "../.env.local");

function loadEnvLocal() {
  if (!existsSync(envLocalPath)) return;
  for (const line of readFileSync(envLocalPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

if (!process.env.DATABASE_URL || !process.env.PAYLOAD_SECRET) loadEnvLocal();
process.env.PAYLOAD_MIGRATING = "true";

const { getPayload } = await import("payload");
const config = (await import("../src/payload.config.ts")).default;
const payload = await getPayload({ config });

/* ─────────────────────────── helpers ─────────────────────────── */

function textToLexical(text) {
  const paragraphs = String(text).split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  if (!paragraphs.length) paragraphs.push("");
  return {
    root: {
      type: "root",
      format: "",
      indent: 0,
      version: 1,
      direction: "ltr",
      children: paragraphs.map((paragraph) => ({
        type: "paragraph",
        format: "",
        indent: 0,
        version: 1,
        direction: "ltr",
        children: [
          {
            type: "text",
            text: paragraph,
            format: 0,
            mode: "normal",
            style: "",
            detail: 0,
            version: 1,
          },
        ],
      })),
    },
  };
}

async function findBySlug(collection, slug) {
  const result = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: true,
  });
  return result.docs[0] ?? null;
}

async function findByEmail(collection, email) {
  const result = await payload.find({
    collection,
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  });
  return result.docs[0] ?? null;
}

async function findMediaByAlt(alt) {
  const result = await payload.find({
    collection: "media",
    where: { alt: { equals: alt } },
    limit: 1,
    overrideAccess: true,
  });
  return result.docs[0] ?? null;
}

/**
 * Fetch a photo from Unsplash and upload it as a Media doc.
 * Idempotent by `alt`. Never throws — logs on failure so a network flake can't
 * abort the whole seed.
 */
async function ensureMediaFromUnsplash({ id, alt, credit }) {
  const existing = await findMediaByAlt(alt);
  if (existing) {
    console.log(`Skip media: ${alt}`);
    return existing;
  }
  const url = `https://images.unsplash.com/photo-${id}?w=1600&q=80&auto=format&fit=crop`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const name = `unsplash-${id.replace(/[^a-z0-9-]/gi, "")}.jpg`;
    const doc = await payload.create({
      collection: "media",
      data: { alt, credit },
      file: {
        data: buffer,
        mimetype: "image/jpeg",
        name,
        size: buffer.length,
      },
      overrideAccess: true,
    });
    console.log(`Uploaded media: ${alt}`);
    return doc;
  } catch (err) {
    console.warn(`Media fetch failed (${alt}): ${err.message}`);
    return null;
  }
}

function pickMedia(mediaByTag, tags) {
  for (const t of tags) {
    const list = mediaByTag[t];
    if (list && list.length) return list[Math.floor(Math.random() * list.length)];
  }
  const all = Object.values(mediaByTag).flat();
  return all[Math.floor(Math.random() * all.length)] ?? null;
}

async function pickAny(collection) {
  const r = await payload.find({ collection, limit: 1, overrideAccess: true });
  return r.docs[0] ?? null;
}

async function findTagIds(slugs) {
  const ids = [];
  for (const slug of slugs) {
    const t = await findBySlug("tags", slug);
    if (t) ids.push(t.id);
  }
  return ids;
}

/* ───────────────────────── media library ───────────────────────── */

const UNSPLASH_MEDIA = [
  { id: "1489599505054-2b48f57cd0eb", alt: "Vintage cinema marquee at dusk", credit: "Photo by Denise Jans on Unsplash", tags: ["film", "hero", "events"] },
  { id: "1478720568477-152d9b164e26", alt: "Film reels and clapperboard on set", credit: "Photo by Denise Jans on Unsplash", tags: ["film", "documentary"] },
  { id: "1478737270239-2f02b77fc618", alt: "Studio microphone in warm light", credit: "Photo by Jonathan Velasquez on Unsplash", tags: ["opinion", "podcast"] },
  { id: "1500648767791-00dcc994a43e", alt: "Portrait of a filmmaker at work", credit: "Photo by Christina @ wocintechchat.com on Unsplash", tags: ["creator"] },
  { id: "1531384441138-2736e62e0919", alt: "Portrait of a young creative in profile", credit: "Photo by Fortune Vieyra on Unsplash", tags: ["creator"] },
  { id: "1494790108377-be9c29b29330", alt: "Portrait of a smiling woman in soft light", credit: "Photo by Jake Nackos on Unsplash", tags: ["creator"] },
  { id: "1500530855697-b586d89ba3ee", alt: "Cinematographer framing a shot on tripod", credit: "Photo by Jakob Owens on Unsplash", tags: ["film", "behind-the-scenes"] },
  { id: "1541704819624-c1d1d68e2b62", alt: "Retro television set glowing in a dark room", credit: "Photo by Ajeet Mestry on Unsplash", tags: ["tv"] },
  { id: "1495020689067-958852a7765e", alt: "Stack of morning newspapers", credit: "Photo by Roman Kraft on Unsplash", tags: ["news"] },
  { id: "1450101499163-c8848c66ca85", alt: "Journal, coffee and pen on a wooden desk", credit: "Photo by Aaron Burden on Unsplash", tags: ["opinion"] },
  { id: "1470229722913-7c0e2dbbafd3", alt: "Crowd silhouetted at an outdoor concert", credit: "Photo by Vishnu R Nair on Unsplash", tags: ["events", "spotlight"] },
  { id: "1533109721025-d1ae7ee7c1e1", alt: "Colourful street market at golden hour", credit: "Photo by Manyu Varma on Unsplash", tags: ["spotlight", "culture"] },
  { id: "1517604931442-7e0c8ed2963c", alt: "Empty red velvet cinema seats", credit: "Photo by Jake Hills on Unsplash", tags: ["film", "events"] },
  { id: "1524668951403-d44b28c48d8b", alt: "Vinyl records and a turntable in soft light", credit: "Photo by Adrian Korte on Unsplash", tags: ["culture", "opinion"] },
  { id: "1516035069371-29a1b244cc32", alt: "Documentary photographer on assignment", credit: "Photo by Jack B on Unsplash", tags: ["documentary", "news"] },
  { id: "1502920917128-1aa500764cbd", alt: "Aerial city skyline lit up at night", credit: "Photo by Anders Jildén on Unsplash", tags: ["news", "opinion"] },
  { id: "1508921912186-1d1a45ebb3c1", alt: "Writer working on a laptop in a quiet cafe", credit: "Photo by Andrew Neel on Unsplash", tags: ["opinion", "creator"] },
  { id: "1518676590629-3dcba9c5a555", alt: "Empty director's chair on a bare set", credit: "Photo by Jakob Owens on Unsplash", tags: ["film", "behind-the-scenes"] },
  { id: "1611348586840-ea9872d33411", alt: "Journalist recording a field interview", credit: "Photo by Emmanuel Ikwuegbu on Unsplash", tags: ["news", "documentary"] },
  { id: "1516450360452-9312f5e86fc7", alt: "Festival crowd holding sparklers at dusk", credit: "Photo by Xuan Nguyen on Unsplash", tags: ["events", "spotlight"] },
];

console.log(`\nLoading ${UNSPLASH_MEDIA.length} media assets…`);
const mediaDocs = [];
const mediaByTag = {};
for (const item of UNSPLASH_MEDIA) {
  const doc = await ensureMediaFromUnsplash(item);
  if (!doc) continue;
  mediaDocs.push(doc);
  for (const t of item.tags) {
    (mediaByTag[t] ??= []).push(doc);
  }
}
if (mediaDocs.length === 0) {
  console.error("No media uploaded — Unsplash is unreachable. Aborting.");
  process.exit(1);
}
console.log(`Media ready: ${mediaDocs.length} docs, tags: ${Object.keys(mediaByTag).join(", ")}\n`);

/* ─────────────────────── category lookup ─────────────────────── */

const CATEGORY_SLUGS = ["film", "tv", "news", "opinion", "spotlight", "documentary", "events"];
const categories = {};
for (const slug of CATEGORY_SLUGS) {
  const doc = await findBySlug("categories", slug);
  if (!doc) {
    console.warn(`Category '${slug}' missing — run seed:taxonomy first.`);
    continue;
  }
  categories[slug] = doc;
}

/* ────────────────────────── creators ────────────────────────── */

const CREATORS = [
  {
    name: "Kunle Afolayan", slug: "kunle-afolayan", role: "Director / Producer",
    bio: "Nigerian filmmaker behind The Figurine, Anikulapo and October 1 — architect of a distinctly Yoruba cinematic grammar that traded speed for atmosphere.",
    quote: "The story sets the pace. The camera should follow, not lead.",
    featured: true, spotlight: true,
    achievements: [ { label: "Films", value: "14", icon: "award" }, { label: "Awards", value: "9", icon: "star" }, { label: "Years active", value: "18", icon: "trending" } ],
    badges: [ { label: "Spotlight", color: "#7f0400" }, { label: "Nollywood", color: "#c9a227" } ],
  },
  {
    name: "Genevieve Nnaji", slug: "genevieve-nnaji", role: "Actor / Director",
    bio: "Actor and filmmaker who moved behind the camera with Lionheart and continues to shape how the diaspora sees Nigerian screen work.",
    quote: "You do not owe the industry that ignored you.",
    featured: true,
    achievements: [ { label: "Films", value: "80+", icon: "award" }, { label: "Awards", value: "12", icon: "star" } ],
    badges: [ { label: "Featured", color: "#c9a227" } ],
  },
  {
    name: "Kemi Adetiba", slug: "kemi-adetiba", role: "Director",
    bio: "Director of King of Boys and its television spin-offs — political drama with Lagos as the set and a taste for baroque power.",
    quote: "Nigerian audiences are the most demanding audiences alive.",
    featured: true,
    achievements: [ { label: "Films", value: "5", icon: "award" }, { label: "Series", value: "3", icon: "medal" } ],
    badges: [ { label: "Featured", color: "#c9a227" } ],
  },
  {
    name: "Mati Diop", slug: "mati-diop", role: "Director / Screenwriter",
    bio: "French-Senegalese filmmaker whose Atlantics and Dahomey rewired the language of post-colonial African cinema.",
    quote: "The ghosts are protagonists. Give them names.",
    featured: true,
    achievements: [ { label: "Films", value: "6", icon: "award" }, { label: "Awards", value: "Cannes Grand Prix", icon: "star" } ],
    badges: [ { label: "Featured", color: "#c9a227" } ],
  },
  {
    name: "Wanuri Kahiu", slug: "wanuri-kahiu", role: "Director / Author",
    bio: "Kenyan filmmaker (Rafiki, Pumzi) and co-founder of AfroBubbleGum — bright, joyful, unapologetically African cinema.",
    quote: "African cinema does not have to be about suffering.",
    featured: true,
    achievements: [ { label: "Films", value: "8", icon: "award" }, { label: "Talks", value: "TEDGlobal", icon: "trending" } ],
    badges: [ { label: "Featured", color: "#c9a227" } ],
  },
  {
    name: "Tunde Kelani", slug: "tunde-kelani", role: "Cinematographer / Director",
    bio: "The dean of Yoruba film — half a century behind the camera and still the most cited cinematographer on the continent.",
    quote: "Every frame is a small archive.",
    featured: false,
    achievements: [ { label: "Films", value: "30+", icon: "award" }, { label: "Years active", value: "50", icon: "trending" } ],
    badges: [ { label: "Icon", color: "#7f0400" } ],
  },
  {
    name: "Barry Jenkins", slug: "barry-jenkins", role: "Director / Writer",
    bio: "Moonlight, If Beale Street Could Talk, The Underground Railroad — a filmmaker of hushed emotion and immaculate light.",
    quote: "Slow the shot down until the actor has room to breathe.",
    featured: false,
    achievements: [ { label: "Oscars", value: "1", icon: "star" }, { label: "Films", value: "6", icon: "award" } ],
    badges: [ { label: "Global", color: "#4f6ef7" } ],
  },
  {
    name: "Ava DuVernay", slug: "ava-duvernay", role: "Director / Producer",
    bio: "Selma, When They See Us, and ARRAY — an infrastructure builder for Black filmmakers as much as an auteur.",
    quote: "Build the door. Then hold it open.",
    featured: false,
    achievements: [ { label: "Films", value: "9", icon: "award" }, { label: "Studios", value: "ARRAY", icon: "medal" } ],
    badges: [ { label: "Global", color: "#4f6ef7" } ],
  },
];

const creatorDocs = {};
for (let i = 0; i < CREATORS.length; i++) {
  const c = CREATORS[i];
  const existing = await findBySlug("creators", c.slug);
  if (existing) {
    console.log(`Skip creator: ${c.slug}`);
    creatorDocs[c.slug] = existing;
    continue;
  }
  const portrait = pickMedia(mediaByTag, ["creator", "spotlight", "culture"]);
  const doc = await payload.create({
    collection: "creators",
    data: {
      name: c.name,
      slug: c.slug,
      role: c.role,
      bio: c.bio,
      quote: c.quote,
      portrait: portrait?.id,
      badges: c.badges,
      achievements: c.achievements,
      featuredOnHomepage: c.featured,
      sortOrder: i,
    },
    overrideAccess: true,
  });
  console.log(`Created creator: ${c.name}`);
  creatorDocs[c.slug] = doc;
}

/* ──────────────────────────── reels ──────────────────────────── */

const REEL_DATA = [
  { title: "A24 — Trailer roll",              slug: "a24-trailer-roll",              label: "Trailer",   platform: "youtube",   url: "https://www.youtube.com/@A24" },
  { title: "Netflix — Global slate",          slug: "netflix-global-slate",          label: "Trailer",   platform: "youtube",   url: "https://www.youtube.com/@Netflix" },
  { title: "HBO — Prestige TV moments",       slug: "hbo-prestige-tv-moments",       label: "Clip",      platform: "youtube",   url: "https://www.youtube.com/@HBO" },
  { title: "Warner Bros. — Behind the frame", slug: "warner-bros-behind-the-frame",  label: "BTS",       platform: "youtube",   url: "https://www.youtube.com/@WarnerBrosPictures" },
  { title: "TIFF — Festival cut",             slug: "tiff-festival-cut",             label: "Festival",  platform: "youtube",   url: "https://www.youtube.com/@TIFF" },
  { title: "Netflix Naija — On the ground",   slug: "netflix-naija-on-the-ground",   label: "Feature",   platform: "instagram", url: "https://www.instagram.com/netflixnaija/" },
  { title: "A24 — On-set diary",              slug: "a24-on-set-diary",              label: "BTS",       platform: "instagram", url: "https://www.instagram.com/a24/" },
  { title: "AMPAS — Awards moments",          slug: "ampas-awards-moments",          label: "Awards",    platform: "instagram", url: "https://www.instagram.com/theacademy/" },
  { title: "Sundance — Selected shorts",      slug: "sundance-selected-shorts",      label: "Festival",  platform: "instagram", url: "https://www.instagram.com/sundanceorg/" },
  { title: "Africa Magic — Nollywood spotlight", slug: "africa-magic-nollywood-spotlight", label: "Feature", platform: "instagram", url: "https://www.instagram.com/africamagictv/" },
];

const reelIds = [];
for (let i = 0; i < REEL_DATA.length; i++) {
  const r = REEL_DATA[i];
  const existing = await findBySlug("reels", r.slug);
  if (existing) {
    console.log(`Skip reel: ${r.slug}`);
    reelIds.push(existing.id);
    continue;
  }
  const thumbnail = pickMedia(mediaByTag, ["film", "tv", "events", "spotlight"]);
  const doc = await payload.create({
    collection: "reels",
    data: {
      title: r.title,
      slug: r.slug,
      label: r.label,
      platform: r.platform,
      externalUrl: r.url,
      thumbnail: thumbnail?.id,
      published: true,
      sortOrder: i,
    },
    overrideAccess: true,
  });
  console.log(`Created reel: ${r.title}`);
  reelIds.push(doc.id);
}

/* ─────────────────────────── articles ─────────────────────────── */

/**
 * Category-scoped article data. Each entry is exactly 10 items and each body
 * is 4–5 real paragraphs — no Lorem, no filler. Titles were designed to be
 * unique globally; a couple were prefixed with the category slug to guarantee
 * no cross-category slug collision.
 */
const ARTICLE_DATA = {
  film: [
    {
      title: "The A24 house style, decoded",
      slug: "the-a24-house-style-decoded",
      excerpt: "How a mid-sized distributor turned a color palette and a soundtrack sensibility into a recognisable brand of American film.",
      tags: ["analysis", "culture"],
      heroTags: ["film", "behind-the-scenes", "hero"],
      body: `A24 does not shoot its own movies, and yet nearly every one of them looks like an A24 film within the first thirty seconds. The company has built a visual identity out of grain, natural light, quiet interiors and long-held two-shots that feel closer to still photography than to prestige television. The house style is not a formula so much as a set of consistent commissions — a preference for cinematographers who trust silence, and directors who trust actors to sit inside a scene without cutting away.

The obvious point of reference is Everything Everywhere All at Once, which the Daniels pushed into loud, kinetic territory while keeping the emotional beats grounded in domestic spaces the studio has been renting out for a decade. But the same DNA runs through the smaller titles — Past Lives, Aftersun, The Zone of Interest — each of which trusts its audience to sit with a scene for far longer than a Marvel edit would permit. That patience is the brand.

Consider the way A24 markets a poster. There is almost always negative space, a single figure, and a typography choice that leans editorial rather than promotional. Compare it to any Sunday-night HBO spot and the difference is philosophical: HBO shouts prestige at you; A24 lets you notice it on the way past the cinema. The distinction matters, because it trains audiences to expect a specific kind of viewing experience before they have bought the ticket.

The counterargument is fair — that a house style becomes a house cage. Ari Aster's Beau Is Afraid tested the edges and lost some of the audience along the way; The Tragedy of Macbeth felt more like an Apple film than an A24 one. When the brand becomes the pitch, it can flatten the individual voice inside it. A studio identity is only useful for as long as it protects the filmmakers, not the filmmakers who protect it.

Still, in a decade where the mid-budget movie has all but vanished from the majors, A24's insistence on the sub-forty-million dollar director-driven feature is doing something the rest of Hollywood no longer bothers to do. The house style is a promise: that the next film will look like it was made by a person, not a spreadsheet.`,
    },
    {
      title: "Villeneuve's Dune Part Two blocking",
      slug: "villeneuves-dune-part-two-blocking",
      excerpt: "The second Dune film is a masterclass in how to move actors through negative space — and how to make an epic feel human.",
      tags: ["analysis", "behind-the-scenes"],
      heroTags: ["film", "behind-the-scenes", "hero"],
      body: `Denis Villeneuve treats his frame the way a painter treats a canvas — the actor is rarely centred, the horizon is rarely level, and the negative space is doing at least half the emotional work. In Dune Part Two he pushes this instinct further than he did in the first film, treating Arrakis as a texture rather than a location and letting Timothée Chalamet drift through wide shots that would swallow a lesser leading man.

The blocking in the sietch scenes is worth studying frame by frame. Villeneuve stages conversations by placing Chani, Paul and Stilgar at unequal distances from camera, then holds the take long enough for the audience to feel the political geometry rearrange itself. Nothing is underlined. The film trusts the viewer to notice that when Chani turns her back, it is a small betrayal, and when she turns it back, it is a bigger one.

The battle sequences reverse the same instinct. Where a Marvel edit would find the closest coverage of the hero and stay there, Villeneuve pulls the camera back and lets his sandworms enter frame the way weather enters a landscape shot — slowly, sideways, without a musical sting. It is a choice that makes the film feel enormous without ever feeling loud, and it is the reason the third act plays like myth rather than spectacle.

You can trace the technique back through his earlier work — Prisoners, Sicario, Blade Runner 2049 — and see the same discipline about eye lines and camera height. Villeneuve rarely lets the audience be smarter than the scene. He composes for information, not for reaction, and his editor Joe Walker cuts on breath rather than movement. It is a slower rhythm than modern Hollywood is trained to consume, and it is precisely why the film rewards a second viewing.

The counter case, of course, is that Dune Part Two is a very expensive art film in blockbuster clothing — and that the model does not scale. Perhaps. But if it does not scale, it at least proves that a director with a sustained visual language can still get a studio to sign a nine-figure cheque, and that is not nothing in 2026.`,
    },
    {
      title: "Barry Jenkins in his blue-hour period",
      slug: "barry-jenkins-in-his-blue-hour-period",
      excerpt: "From Moonlight to The Underground Railroad, Jenkins has been refining a single obsession — how light falls on Black skin at dusk.",
      tags: ["analysis", "culture"],
      heroTags: ["film", "spotlight"],
      body: `There is a specific colour temperature that recurs across Barry Jenkins' work — a soft, teal-leaning blue that arrives fifteen minutes after sunset and lasts about twenty minutes. Cinematographer James Laxton calls it the negotiating hour: still enough natural light to shape a face, but low enough that skin takes on a photographic depth you cannot buy with a lamp. Jenkins has been chasing that window since Moonlight, and it has become inseparable from his authorial signature.

If Beale Street Could Talk pushed the palette further, layering warm interior tungsten against that blue exterior wash until the film began to feel almost synaesthetic. The Underground Railroad, shot for television, did not lose the discipline. Every station on the railroad has a distinct lighting temperature and the show cuts between them the way a symphony cuts between movements. It is arguably the most beautifully shot piece of American television since Deadwood.

The reason this matters is not aesthetic vanity. Jenkins is answering a specific historical problem: cinema has been calibrated for pale skin since the introduction of Shirley cards, and Black faces have been consistently under-served by the medium. His blue-hour period is a technical rebuttal to that history. It insists that Black skin has depth, temperature, and reflectivity that reward careful light, and that a director who does not know this is leaving the frame emotionally shallow.

There are counter-currents in his work — the flatter, more documentary lighting of Aftersun's producer credit, the harsher noon light of the Amazon short The Gaze — but even those choices feel like conscious departures rather than the absence of a style. When Jenkins goes back to features later this year, expect the blue hour to be waiting.

The lesson for younger filmmakers is uncomplicated: pick a piece of the day and become fluent in it. Style, in the end, is a series of specific decisions made consistently enough that the audience starts recognising the person behind the camera without being told.`,
    },
    {
      title: "Cannes 2026 jury dispatch",
      slug: "cannes-2026-jury-dispatch",
      excerpt: "The Palme jury delivered a split verdict — a win for African cinema, a snub for the streamers, and a lot of shouting on the Croisette.",
      tags: ["news-tag", "events-tag"],
      heroTags: ["events", "film"],
      body: `The 2026 Cannes competition closed with the kind of jury discussion that tends to leak into the trade press for weeks. Word from inside the Palais is that the debate between the Palme d'Or winner and the runner-up went four rounds, split along generational lines, and produced a compromise that satisfied nobody entirely. That is usually a good sign — juries that award unanimously tend to pick safe.

The winning film, Mati Diop's third feature, extends her interest in the borderland between the living and the dead. Reviews out of the press screenings were split: enthusiastic from the European broadsheets, cooler from the American trade press, which continues to struggle with her deliberate pacing. The Grand Prix went to a first feature from South Africa, which arrived at Cannes without a distributor and left with three offers on the table.

The most consequential trend of the festival was not a single film but a category shift. Streamers were quieter than they have been in years — Netflix's slate leaned on catalogue, Apple pulled a title at the last minute, and Amazon did not compete. Whether that is the beginning of a real correction or a one-year blip is the conversation Cannes will spend the next twelve months having.

Nollywood had its most visible year on the Croisette. Two Nigerian features made Un Certain Regard, a Kenyan short took the top prize in its category, and the African Cinema Pavilion was standing-room-only on three separate afternoons. This is not tokenism; the industry is finally producing at a scale that the European festivals can no longer politely overlook.

The unresolved question, as always, is distribution. A festival prize is a marketing asset, not a business model. The films that leave Cannes with a strong buyer come back to prosperity; the ones that leave with only good reviews mostly disappear into arthouse VOD by autumn. Watch what the winners sign in the next six weeks — that is where the real story is.`,
    },
    {
      title: "Nollywood breaks out at TIFF",
      slug: "nollywood-breaks-out-at-tiff",
      excerpt: "Toronto has been a friendly festival for African cinema for years, but the 2026 edition made the shift feel permanent rather than seasonal.",
      tags: ["news-tag", "featured-story"],
      heroTags: ["film", "events"],
      body: `The Toronto International Film Festival has been quietly programming Nigerian cinema for the better part of a decade, but this year's edition felt like an inflection point rather than a continuation. Four Nigerian features screened in official selection, two of them in Special Presentations, and the demand for tickets outstripped the venues by a comfortable margin. The pavilion in the Fairmont hosted more industry meetings than it had chairs.

The programming choice worth noting is the balance. The slate included Kunle Afolayan's newest slow-burn drama, a first feature from a Lagos-based woman director, a documentary about Fela's estate, and a Nollywood genre picture that would have been unthinkable at TIFF five years ago. Toronto has stopped treating African cinema as a curated category and started treating it the way it treats French or Korean cinema — as a national industry with its own texture and range.

Sales activity told the same story. Two of the four features left Toronto with international distribution deals, one of them with a streaming pre-buy attached. Local sales agents from Lagos and Nairobi were reportedly in room after room, and the after-parties on King Street were louder than they have been in years.

The counter-current is the ongoing struggle for cinema exhibition inside Nigeria itself. A film can win Toronto, sell to Amazon, and still find that only twelve screens back home will book it opening weekend. The distribution problem is not solved by festival attention; it is only ratified by it. Nollywood needs its own equivalent of the arthouse circuit if the festival wins are to translate into a durable industry.

That work is happening, slowly. Silverbird has quietly refurbished three screens for prestige programming. Blue Pictures is committing to a mid-budget slate. And the next generation of Nigerian critics is starting to make the case that the industry deserves the same critical infrastructure it demands from Toronto. TIFF is a symptom, not a solution — but it is a very useful symptom to have.`,
    },
    {
      title: "What Christopher Nolan's IMAX obsession is actually about",
      slug: "what-christopher-nolans-imax-obsession-is-actually-about",
      excerpt: "The format war is not really about resolution — it's about a director defending a specific kind of theatrical attention.",
      tags: ["opinion-tag", "technology"],
      heroTags: ["film", "behind-the-scenes"],
      body: `Christopher Nolan has spent the last twenty years arguing that IMAX 70mm is the highest-fidelity theatrical format available, and he is correct. He is also, arguably, arguing for something slightly different — that a specific size of image, projected on a specific size of screen, produces a specific kind of audience attention that no other format has ever quite replicated. The technical case is real, but the aesthetic case is the one worth defending.

An IMAX frame is roughly ten times the surface area of a standard 35mm frame. That is not a marketing claim; it is a physical measurement. What it produces at cinema scale is a level of detail that the eye has to work slightly harder to consume, which in turn produces the sensation of being present inside the shot rather than watching it. Nolan understands this at the level of composition — his IMAX sequences are typically wider, longer-held, and structured around the eye's natural tendency to scan the image.

The Oppenheimer roll-out was, in a sense, a stress test of the format's cultural viability. Universal put nineteen prints of the 70mm cut into circulation and every one of them sold out within hours of the release. That is not a fluke. It is proof that a certain slice of the audience is willing to travel across cities for a specific projection standard, which contradicts the industry consensus that theatrical is dying because audiences no longer care about quality.

The pushback is legitimate: only fifteen or so cinemas in the world can project 70mm IMAX, and it is not obvious that a distribution strategy built around fewer than two dozen venues is a durable business model. Nolan's answer, essentially, is that the format sets a ceiling — the shorter, digital-only release still benefits from having been mastered from the higher standard.

The industry could take the lesson without adopting the format. What Nolan is really defending is theatrical specificity: the idea that a film should be optimised for the room it is shown in, and that a home-screen experience is a substitute rather than a replacement. That is a position worth defending regardless of which format wins the argument.`,
    },
    {
      title: "The comeback of the two-hour drama",
      slug: "the-comeback-of-the-two-hour-drama",
      excerpt: "After a decade of three-hour epics and hundred-minute streamers, the two-hour drama is quietly returning as the industry sweet spot.",
      tags: ["analysis", "opinion-tag"],
      heroTags: ["film", "opinion"],
      body: `Something has been happening at the sub-two-hour end of the release schedule that the trade press has not quite caught up with. Half a dozen of the year's best-reviewed dramas have come in between one hundred and one hundred and twenty minutes, and audiences have rewarded that discipline at the box office. The two-hour drama is back, and its return says something interesting about how the audience's attention has recalibrated after a decade of streaming abundance.

The three-hour epic is not going away — Killers of the Flower Moon and Oppenheimer proved there is still an audience for the extended runtime — but it is no longer the default posture of the prestige drama. What has changed is that filmmakers are once again willing to cut, to compress, and to trust an ellipsis to do the work of a scene. The best example this year is a small American independent that runs one hundred and seven minutes and covers thirty years of a marriage. It works precisely because it does not pretend to be a novel.

Compare that to the middle years of Peak TV, when a story that could have been a taut ninety-minute film was routinely stretched across ten episodes to justify the streaming spend. That model is finally cracking. Subscriber numbers have plateaued, ad-supported tiers are pulling audience attention back toward shorter durations, and the streamers themselves are quietly commissioning more features and fewer limited series.

The counter case is that the two-hour runtime is a Hollywood convention imported from studio-era distribution economics, and that a story deserves whatever length it deserves. Fair enough. But the discipline of the two-hour cut has a specific artistic value — it forces a filmmaker to decide what the film is about, which is a decision the streamer-length format tends to defer.

The two-hour drama also has a practical advantage that no one likes to admit: it can play twice a night in a repertory house, twice on a Sunday afternoon at a multiplex, and once on a cross-continental flight. Length is a distribution decision as much as an artistic one, and the tide is moving back toward tightness. That is a good thing for cinema, and for the audience that still shows up to watch it.`,
    },
    {
      title: "Chloé Zhao rebuilds her voice",
      slug: "chloe-zhao-rebuilds-her-voice",
      excerpt: "After the Marvel detour of Eternals, Zhao's new independent film feels like a deliberate return to Nomadland's grammar — and it works.",
      tags: ["review", "analysis"],
      heroTags: ["film", "spotlight"],
      body: `Chloé Zhao's post-Eternals return is not a mea culpa, but it is a recalibration. The new film, shot in the American Southwest with a mostly non-professional cast, feels like a conscious effort to re-inhabit the register that made Nomadland one of the more emotionally honest films of the past decade. It is not a masterpiece. It is, however, a serious piece of filmmaking, and it clarifies what her Marvel detour did and did not cost her.

The core of her craft has always been the interview. Zhao's method involves long conversations with her cast in the locations she plans to shoot, and then a script that respects the language the subjects actually use. Eternals was a bad fit for that method — a Marvel film runs on plot and quip, not on silence and observation — and the result was a film that felt confused about whether it wanted to be a superhero movie or a Zhao film. It was neither.

The new work returns to first principles. The framing is patient, the sound design foregrounds wind and distance, and the actors — many of them local to the shooting region — are given room to sit inside their scenes without being cut around. There is a scene in a diner that runs six uninterrupted minutes and is the best-directed thing she has shot since Nomadland's parking-lot goodbye.

The counterargument is a structural one. Zhao's non-fictional method depends on very small budgets and very long shoots, and it is not clear how many of these films the American independent scene can sustainably fund. A24 has been generous, but that generosity has limits, and the streamers are not obviously interested. If Zhao is to keep making these films, the industry will need to decide what a Zhao film is worth beyond festival applause.

For now, it is enough that the film exists. The Marvel detour was, in the end, a survivable mistake — expensive in reputation, corrective in retrospect. Zhao has come back to her voice and it is still intact. That is more than can be said for several of her contemporaries who took the same corporate paycheque and never quite came home.`,
    },
    {
      title: "When cinematographers become auteurs",
      slug: "when-cinematographers-become-auteurs",
      excerpt: "The line between DP and director has been quietly eroding for a decade — and the results are some of the most visually literate films of the era.",
      tags: ["analysis", "profile"],
      heroTags: ["film", "behind-the-scenes"],
      body: `The idea of the director-cinematographer is not new — Nicolas Roeg, Néstor Almendros, Barry Sonnenfeld and Wally Pfister all crossed the line before the current generation — but the past five years have produced an unusually rich crop of cinematographers who are taking the director's chair without leaving the camera behind. The trend is worth watching, because it produces films with a specific kind of internal logic.

Bradford Young, Reed Morano and Rachel Morrison have all moved into directing with varying degrees of success. The best of these transitions share a common trait: the director-cinematographer is unusually disciplined about what the camera is asked to do. There is less coverage, longer takes, more precomposition, and a stronger sense of where the eye should be during any given beat. It is a way of making cinema that puts the frame ahead of the shot list.

The most interesting recent example is Tunde Kelani, whose new film sees him back behind the camera at seventy-eight. The film is uneven, but the visual literacy is undeniable — he stages a family dinner as if it were a landscape painting, and cuts to close-up only once in the whole scene. Younger Nigerian directors should be studying this the way Wong Kar-wai studied Yasujirō Ozu.

The counter case, of course, is that the great directors have always been fluent visualists — Kubrick, Hitchcock, Kurosawa — without ever having been cinematographers by trade. Directing is a different discipline; being good at one is not a prerequisite for being good at the other. Fair enough. But the DP-director model produces a specific texture that is worth noticing when you see it.

What the trend also does, quietly, is shift power inside the industry. When cinematographers can direct, their above-the-line rates rise, their agents get more leverage, and the department itself gets pulled further up the credit hierarchy. That is a healthier equilibrium than the one where the DP is treated as a technician for hire. Watch the next five years — this is the story to follow.`,
    },
    {
      title: "A short defense of the mid-budget",
      slug: "a-short-defense-of-the-mid-budget",
      excerpt: "Hollywood has hollowed out the middle — tentpoles at one end, independents at the other. That's the wrong shape for a healthy industry.",
      tags: ["opinion-tag", "commentary"],
      heroTags: ["film", "opinion"],
      body: `The mid-budget movie is the film industry's missing rung. A generation ago the studios released dozens of them a year — adult dramas, genre pictures, romantic comedies made for adults, character studies with an aging star and a first-time writer. Today the same films either get downgraded to a streaming release with no theatrical run or upgraded into a two-hundred-million-dollar tentpole they were never designed to be. The middle has been hollowed out and the industry is worse for it.

There are structural reasons this happened. Studio consolidation shrank the number of decision-makers who could greenlight a mid-budget picture; DVD collapse removed the back-end revenue that made the model work; streaming subscription economics rewarded volume and library depth over per-film profitability. None of these reasons is a moral failing. But together they have starved the audience of a specific kind of theatrical experience — the film you go and see with a friend on a Tuesday night because it has an interesting cast and a good review.

A24 has partially filled the gap, but only partially. So has Focus Features. So, occasionally, has Searchlight. And Neon has quietly assembled the best mid-budget slate in the American market by a comfortable margin. The point is not that no one is making these films; it is that the majors have collectively stopped, and the smaller houses cannot make up the difference on their own.

The counter case is that streaming has absorbed the mid-budget audience, and that the movies exist, they just live on your television. That is partially true. But there is a genuine difference between a film made for a screen you sit forty feet from and one made for a screen you sit six feet from, and that difference is not a snobbery — it is a craft distinction. Directors compose differently for different rooms, and the mid-budget theatrical film is the room in which most of the great American directors of the last fifty years learned their trade.

If the industry wants a next generation of directors capable of directing a tentpole, it needs a functioning mid-budget system to train them in. Netflix's four-million-dollar development slate is not that system. Nor is A24 alone. What is required is a coordinated commitment from the majors to release, exhibit, and market ten to twelve mid-budget films a year each. Nothing about that is impossible. It just requires the industry to remember that its job is to make movies, not to protect quarterly earnings.`,
    },
  ],
  tv: [
    {
      title: "The Bear's kitchen-choreography language",
      slug: "the-bears-kitchen-choreography-language",
      excerpt: "FX's kitchen drama is really a movement piece — its blocking is closer to modern dance than to workplace television.",
      tags: ["analysis", "television"],
      heroTags: ["tv", "film"],
      body: `The best way to understand The Bear is to watch it with the sound off. What you notice, once you strip out the shouting, is that Christopher Storer and his co-directors are staging the show as a movement piece. Bodies weave around each other in a fifteen-foot kitchen in continuous, unbroken takes. Nobody bumps into anybody. The choreography is precise enough that it belongs in a dance company as much as in a television drama.

That kind of blocking is expensive. It requires rehearsal time that most television schedules do not allow for, and it requires actors who are willing to learn the space the way a chef learns a real kitchen. Jeremy Allen White, Ayo Edebiri and Ebon Moss-Bachrach have all talked in interviews about the pre-shoot weeks spent inside the constructed kitchen, cooking real service, until the geography of the room lived in their bodies. That labor is what the audience is watching whether they know it or not.

The show's most celebrated episode, Forks, is the exception that proves the rule. Set in a different kitchen, at a different pace, it is essentially a chamber piece about attention. The choreography doesn't disappear — it just slows down. Marcus (Lionel Boyce) is asked to stop moving, to look, to notice. It is the show's thesis statement dressed up as a bottle episode.

The counterargument to all this is that the show is more style than substance, and that the kitchen-set intensity is a way of manufacturing drama when the underlying scripts are thinner than they seem. It is a fair critique. Season three lost some of the propulsive quality of the first two seasons, and a couple of the family flashbacks felt like they were doing thematic bookkeeping. But the choreography never wavered.

Television is still catching up to what The Bear is doing formally. Most kitchen shows use a lot of coverage and cut aggressively; The Bear cuts less than almost any other cable drama on the air. If it has an heir, it is not another restaurant show — it is a hospital drama, or a police procedural, that finally figures out how to stage a workplace with the physical honesty that a real workplace has.`,
    },
    {
      title: "Succession's Emmy shadow",
      slug: "successions-emmy-shadow",
      excerpt: "Three years after it ended, HBO's Roy-family drama is still shaping what television awards juries recognise as prestige.",
      tags: ["television", "analysis"],
      heroTags: ["tv", "film"],
      body: `Succession has been off the air for three years, and its influence over the prestige television landscape is arguably larger now than it was during the run. Every Emmy season since 2023 has featured at least two shows that were pitched, developed, or reshaped in response to what Jesse Armstrong's series proved was possible on cable. That is a specific kind of legacy — the kind that outlasts the show itself.

The obvious inheritors are the family dramas. Industry has quietly become one of the sharpest shows on television, and it wears the Succession influence openly — the ensemble is treated as an antagonist to itself, the corporate world is treated as a set of moral micro-decisions, and the shooting style leans on handheld longer than the format used to allow for. Industry is what Succession would look like if it had gone downstairs from the C-suite.

Less obvious inheritors include the recent HBO limited series that have been mining the same rich-people-are-not-okay territory. The Regime, White Lotus, Perry Mason's second season — all of them have absorbed Succession's willingness to sit in a scene without cutting away, and its trust that the audience can hold a piece of information in reserve for five episodes before the show pays it off. That is a different kind of storytelling contract than television used to offer.

The critique is real: prestige television is on the verge of self-parody. Every third pilot pitched to HBO in 2026 is described in the trades as "Succession, but with…", which is exactly the kind of shortcut that produces derivative work. A show that gets copied badly is a show that eventually loses some of its edge in the copying.

Still, that Succession has become the reference point speaks to a durable craft achievement. Jesse Armstrong made a show that operates like a novel — cumulative, contextual, unresolved — and demonstrated that the market for that kind of long-form character work is larger than the industry believed. Whether the streamers can commission its equivalent, without ten Succession-shaped clones cluttering the slate, is a different question. Bet against them.`,
    },
    {
      title: "HBO's Sunday-night gamble",
      slug: "hbos-sunday-night-gamble",
      excerpt: "The network is spending big on a shrinking window — and the industry is watching to see whether appointment television can be rebuilt.",
      tags: ["television", "news-tag"],
      heroTags: ["tv"],
      body: `HBO's decision to keep spending on nine-episode, event-scaled Sunday-night drama is the most interesting bet in American television right now. The bet is that the appointment-viewing window can be defended — that if you put a large enough show in a nine p.m. Sunday slot, the audience will come back to the ritual it abandoned for on-demand streaming five years ago. The evidence is mixed but not discouraging.

House of the Dragon's second season did the numbers the network needed. The Penguin over-performed. The Regime under-performed and did so publicly. Taken together they suggest a two-part rule: the appointment audience will show up for a genre they already know, and it will not show up for a genre they do not. That is a narrower window than HBO's marketing has been suggesting, but it is a window.

The industry watches HBO because HBO is the last major cable channel behaving as though scheduled linear television is still a business rather than a legacy expense. Max is now the primary distribution surface, but the network still cuts, markets, and commissions with the Sunday slot in mind. That is a philosophical position as much as a scheduling one — it says that television gains something from being watched at the same time by a lot of people.

The counter case is that appointment television is a nostalgia format, that the ritual it depends on is generationally specific, and that no amount of marketing spend will bring back an audience that has learned to consume on its own timetable. There is data on both sides. Live viewing of scripted drama is down year over year for the fifth year running; social conversation about individual episodes is up sharply for the shows HBO wins on.

What the industry will learn in the next eighteen months is whether the ritual can be rebuilt at all, and whether HBO is the network to do it. The competition — Apple, Netflix, Amazon — has largely given up on live-window scheduling and treats their drama slates as libraries. If HBO wins this bet, expect at least one of the streamers to reintroduce appointment programming by 2027. If it loses, expect a very expensive year of retrenchment.`,
    },
    {
      title: "The rise of the limited series",
      slug: "the-rise-of-the-limited-series",
      excerpt: "Six-episode dramas were once a British specialty. They are now the dominant unit of American prestige television.",
      tags: ["television", "analysis"],
      heroTags: ["tv", "film"],
      body: `The limited series was, for most of American television history, a curiosity — an occasional prestige experiment, usually shown over consecutive nights and then filed away as a novelty. In the last five years it has become the dominant unit of American drama commissioning. Most of the shows getting Emmy nominations, most of the shows generating cultural conversation, and most of the shows landing on the year-end critical lists are limited series.

The reason is structural. A limited series lets you cast a movie star for six weeks instead of six years. It lets you close a story rather than defer its resolution across three renewals. And it lets a streamer point at a discrete piece of intellectual property in a way the algorithm can market. From a production accounting standpoint, six episodes is the length at which the marketing spend and the residuals math balance in favour of the network.

The best examples are the ones that would have been three-hour films in a different economy. The Underground Railroad, I May Destroy You, Chernobyl, Mare of Easttown, Beef — each of them uses the limited-series form to do something the theatrical two-hour cut would not have room for, and each of them keeps a discipline that the sprawling multi-season prestige show lost sometime around 2018.

The counter case is that the format flattens ambition. A show that has to close in six hours cannot risk the slow accretion of character that the great long-running dramas — The Wire, Deadwood, Mad Men, Breaking Bad — were built on. And a director-of-photography shooting a six-week block never has the room to develop the show the way a returning cinematographer does. Some of that is real. Some of it is nostalgia for a version of Peak TV that was, itself, a limited economic moment.

What is undeniable is that the limited series has become the format in which serious writers and directors can still get an idea onto a screen without being asked to build a franchise. That is worth defending. If the streamers want to keep the prestige side of their business durable, this is the form to keep commissioning. It is also, not coincidentally, the form the audience has demonstrated it will actually finish.`,
    },
    {
      title: "Streaming's algorithm blues",
      slug: "streamings-algorithm-blues",
      excerpt: "The recommendation engine has quietly become the most powerful commissioning editor in Hollywood — and it is making some very safe choices.",
      tags: ["opinion-tag", "technology"],
      heroTags: ["tv", "opinion"],
      body: `The most powerful person in television commissioning is not a person. It is an algorithm, or rather a set of them, tuned to reward the shows that produce the highest completion rates in the first two episodes. That optimization has slowly rewritten what gets greenlit, and the pattern that has emerged — thrillers with strong first-episode hooks, family dramas with high-frequency plot beats, procedurals with a clear crime-of-the-week structure — reads back at the audience as a shrinking range of possibility.

Netflix has been the most public about the strategy. Their internal metric of choice is completion rate, not audience appreciation, and their retention modeling has produced a slate weighted heavily toward shows that hold viewers for the first hundred and twenty minutes. That is a rational strategy for a subscription business. It is also, in aggregate, a strategy that penalises any show whose pleasures take more than one episode to reveal.

Compare this to how HBO commissioned during the John Landgraf era at FX: the network was willing to accept a slow-building first season if the show promised depth downstream. Some of those bets paid off spectacularly — Fargo, The Americans, Atlanta — and some of them did not, but the range of what was commissioned was wider. Streaming has narrowed the range while widening the volume, and it is not obvious that is the right trade.

The counter case is that audiences do have shorter attention spans, that first-two-episodes triage is a rational response to actual behavior, and that the shows that get made under the current regime are, by and large, competent and enjoyable. Fair enough. But the algorithm cannot commission a Twin Peaks, or a Better Call Saul, or a Deadwood, because none of those shows would clear the completion-rate hurdle in their first two hours. That is not a flattering statement about where we are.

What television needs, more than another prestige drama, is a distribution mechanism that can afford to be patient. The BBC has one, occasionally. Apple has, on a limited slate, been willing to be one. HBO still is. The rest of the industry has effectively decided that the algorithm's taste is the taste that matters, and the shows we get reflect exactly that.`,
    },
    {
      title: "Kemi Adetiba's King of Boys as television",
      slug: "kemi-adetibas-king-of-boys-as-television",
      excerpt: "The Netflix follow-up to Adetiba's political thriller is one of the most confident pieces of Nollywood television ever produced.",
      tags: ["review", "television"],
      heroTags: ["tv", "spotlight"],
      body: `Kemi Adetiba's King of Boys — the film, then the television sequel — is the single most important Nollywood piece of the streaming era, and its influence on how Nigerian television is being made now is difficult to overstate. It is a political thriller with the confidence to be shot like an HBO show and the specificity to feel completely, unrepeatably Lagosian. That combination has not been common in the industry until now.

The television format let Adetiba extend the world without diluting it. Where the theatrical film had to compress a decade of Alhaja Eniola Salami's rise into two hours and thirty-eight minutes, the show had space to sit inside the individual power plays — the phone calls, the church visits, the boardroom compromises — that make a Nigerian political drama feel like a Nigerian political drama. It also let her stretch the ensemble in a way the film could not.

The craft credits are worth naming. The DP work by Sam Osaze is baroque in the exact right register: gold interiors, saturated night exteriors, tungsten-heavy interrogation scenes. The production design leans into a very specific Lagosian maximalism that would look ridiculous in a lesser show and is exactly right here. And the sound design, which is not much discussed, borrows liberally from Kelani and Fuji-influenced rhythms in a way that grounds the show in a place American television could never fake.

The critique is that the plotting occasionally over-explains itself, and that a couple of the second-season storylines take a beat longer to land than they should. Both are true. But they are the kind of criticisms that come out of high expectations, not low ones — the show operates at a level where the audience is willing to argue about pacing rather than about whether the show works at all.

What King of Boys demonstrates, more than anything, is the appetite for Nigerian political television that Nigerian political television has not yet been permitted to feed. Netflix's willingness to fund it should be a template rather than an exception. If Africa Magic and Netflix Naija between them can commission two more shows on this scale in the next eighteen months, the industry will have crossed a threshold it has been sitting on for a decade.`,
    },
    {
      title: "What Nigerian TV does that Netflix can't fake",
      slug: "what-nigerian-tv-does-that-netflix-cant-fake",
      excerpt: "The rhythm of the domestic drama, the specific pacing of a Nigerian family scene, is the thing global streamers keep failing to replicate.",
      tags: ["culture", "television"],
      heroTags: ["tv", "spotlight"],
      body: `There is a specific rhythm to a Nigerian family drama scene — the extended greetings, the layered generational hierarchy, the long dinner-table beats interrupted by a phone ringing off-screen — that streaming television has spent years failing to reproduce. Netflix has tried. Amazon has tried. Neither has quite managed it, because the rhythm is a cultural artifact rather than a technical one. It cannot be workshopped from the outside.

The domestic Nigerian series — the Africa Magic dramas, the shows on ROK, the newer Showmax originals — get this right because they are directed by people who grew up inside the rhythm. A scene that would feel meandering to an American editor is doing specific narrative work in a Yoruba or Igbo family context: the greeting sets rank, the delay establishes deference, the interruption reveals conflict. Cutting any of it flattens the whole scene.

This is why the international co-productions keep feeling almost right. A show shot in Lagos with an American writers' room tends to over-explain the family dynamics for a global audience, and the over-explanation is exactly what makes the scenes stop working. The audience the show is chasing does not need the explanation; the audience it is losing already knows. The exposition is aimed at nobody in particular, and it lands with nobody in particular.

The corrective is straightforward and expensive: hire Nigerian writers' rooms, give them final say on the scripts, and let the show export on its own terms. Kemi Adetiba's King of Boys took that route and international audiences found it anyway. So did Blood Sisters. So has the recent Africa Magic slate. When the industry stops apologising for cultural specificity, it discovers that specificity is, in fact, the product.

The lesson for the streamers is one they will not easily internalise, because it undermines the algorithmic playbook. But the Nigerian domestic drama, done right, is one of the strongest genres in global television, and it is being made mostly by directors and writers the international streamers have not yet properly commissioned. That gap is a business opportunity as much as an artistic one. Somebody will figure it out. It might as well be the platform that pays fairly.`,
    },
    {
      title: "The seven-episode ideal",
      slug: "the-seven-episode-ideal",
      excerpt: "Not eight, not ten — seven. There is a specific narrative logic to the seven-episode season, and the best streamers have figured it out.",
      tags: ["analysis", "television"],
      heroTags: ["tv"],
      body: `Somewhere in the last three years the streamers quietly discovered that the seven-episode season is a specific narrative unit, and the best commissioners now default to it. Not eight, not ten, not the twelve that Peak TV inflated the form into — seven. There is a specific rhythm to seven episodes that eight blurs and six compresses, and it is worth naming.

The seven-episode structure gives you a two-episode setup, a three-episode second-act complication, and a two-episode resolution. In practice that means you can introduce your ensemble, establish your world, complicate every relationship twice, and land the season with room for a small coda. Eight episodes tempts you to pad the middle. Six forces you to skip the second complication. Seven is the length at which the shape of a novel is available without any of the tricks.

The clearest recent examples are Baby Reindeer, Beef, and Kaos — all seven-episode shows, all landed their finales with unusual precision. Netflix's own internal data reportedly confirms the intuition: seven-episode limited series produce the highest audience appreciation scores in their portfolio, and the tightest week-over-week retention. That is not a fluke. It is a story-structure finding disguised as a business metric.

The counter case is that great television has been made at every length — The Wire's twelve, The Sopranos' thirteen, Deadwood's varying seasons — and that a formula is a cage. Fair enough. But the seven-episode unit is not a formula so much as a defense against inflation. Peak TV routinely produced ten-episode seasons that would have been better at seven, and that pattern accounts for a lot of the fatigue the audience is currently expressing about streaming abundance.

If the industry wants to commission fewer shows and get better ones, the seven-episode season is a reasonable structural discipline. It also, incidentally, brings the total runtime of a season close to a long feature film — five and a half hours or so — which is a durational unit the audience has historically been able to consume in three or four sittings. That is not an accident either.`,
    },
    {
      title: "Late-night is not dead, it moved",
      slug: "late-night-is-not-dead-it-moved",
      excerpt: "Broadcast late-night has been declared over for the last decade — but the audience just relocated to a format the networks refuse to compete in.",
      tags: ["analysis", "culture"],
      heroTags: ["tv"],
      body: `The obituaries for late-night television have been running for about twenty years, and they keep being wrong for the same reason: the audience did not stop watching, it stopped watching on the networks' schedule. The format itself is thriving — as YouTube clips, as podcast spinoffs, as vertical Instagram edits — and the total audience for the genre is arguably larger than it has ever been. What has collapsed is the linear window, not the appetite.

The audience for a Colbert monologue on CBS at eleven thirty-five p.m. is a small fraction of the audience for the same monologue on YouTube by nine the next morning. The show has known this for years and structured its production around it: the monologue is edited to be watchable at any length, the desk pieces are sized to be sharable as standalone clips, and the guest interviews are cut so a single answer can be its own three-minute video. The show is designed for the second window as much as the first.

Compare this to the way John Mulaney and Ziwe have quietly built formats that are effectively late-night television released as standalone specials — no live audience, no monologue, no set of tropes borrowed from Carson. The genre is evolving; it is just evolving outside of the network schedule. The best current example is Everybody's Live with John Mulaney, which is a Peak-Letterman anti-talk-show unafraid to be occasionally boring, occasionally sublime, and always structurally strange.

The counter case is that the economics have permanently deteriorated — that advertising money has moved to the platforms and the networks cannot fund the format at the scale that made it culturally central. This is true, and it is the reason CBS's Late Show ended and NBC's late-night footprint keeps shrinking. But the format itself has survived because the audience wants it, and because a Colbert or a Meyers can hold a national conversation in a way podcast interviews still, mostly, cannot.

What the networks refuse to accept is that late-night should be produced primarily for the online window and only incidentally for broadcast. That is the direction the audience has gone, and the shows that have understood it — Meyers' A Closer Look segments, Colbert's monologues — are the ones still growing. Whoever commissions the next generation of late-night should treat linear as a nostalgic add-on. It is where the audience already is.`,
    },
    {
      title: "Reality TV's second aesthetic wave",
      slug: "reality-tvs-second-aesthetic-wave",
      excerpt: "After a decade of formulaic dating shows, unscripted television is quietly rebuilding its craft — and getting more interesting to watch.",
      tags: ["television", "culture"],
      heroTags: ["tv", "culture"],
      body: `Unscripted television has spent the last decade running on autopilot — dating formats, cooking competitions, home renovation shows, all cut to a template that has not evolved much since the early 2010s. In the last eighteen months something has quietly shifted. A handful of shows have started treating unscripted as a form worth composing for, rather than a cheap alternative to scripted, and the results are the most interesting reality television in years.

The clearest example is The Traitors — a show that is technically a game format but is directed with the visual language of a limited series. The DP composes for atmosphere, the editor cuts on emotion rather than reaction, and the contestants are treated as characters in a psychological drama rather than as fodder for a confessional booth. The show plays like Big Brother directed by a person who has seen Fanny and Alexander.

The Kardashians' Hulu revival did something similar with the family-verité format. Where the original E! show was cut fast and shallow, the Hulu version slows down, holds shots, and lets scenes breathe past the moment where the reaction shot would normally cut. Whether the show is emotionally honest is a separate question, but the aesthetic upgrade is real, and it changes what you can do with the format.

Nigerian reality television has been doing this for longer than the international press has noticed. Big Brother Naija's craft team has been quietly upgrading production values every season, and the recent Housemates format on Africa Magic has genuine ambitions in cinematography and sound design. When international commissioners eventually look at the African unscripted market seriously, they will discover a production culture already well ahead of where American reality was five years ago.

The counter case is that unscripted television is still a mostly cynical genre in economic terms — cheap to produce, easy to sell, and structured around contestant exploitation more than craft ambition. Fair enough. But the shows that are treating the form with respect are the ones producing the most durable formats and the most passionate audiences. The next wave of unscripted, if the industry is smart about it, will look more like The Traitors and less like the fourteenth season of any dating show. That is a genuine artistic improvement.`,
    },
  ],
  news: [
    {
      title: "Cannes jury shortlist reactions",
      slug: "news-cannes-jury-shortlist-reactions",
      excerpt: "The final week's screenings produced a compressed shortlist and an unusually noisy set of industry reactions.",
      tags: ["news-tag", "events-tag"],
      heroTags: ["news", "events"],
      body: `The Cannes jury spent the final Sunday of the festival compressing its shortlist to five titles, and the trade press had every one of them within the hour. The exchange rate between festival gossip and printed rumour has never been faster, and this year the industry response was unusually vocal. Several distributors publicly praised titles they had already acquired, and at least two European sales houses issued statements defending films that had drawn cooler press reviews.

The shortlisted films split evenly between European festival veterans and first features, with one non-competition Nollywood entry pulling favourable jury attention in the sidebar sections. The presence of two African productions at the top tier of the shortlist marks the first time in a decade that the region has been represented across multiple categories, and it changes the sales conversation in ways the trade press is still working through.

Streamer activity was, notably, quieter than in recent years. Netflix did not compete for a top prize but was active on the acquisitions side, taking two smaller titles for global distribution and passing on a much-hyped auteur project that ultimately went to a European independent. Apple bought no titles. Amazon bought two. That distribution mix, on its own, will shape the second-half awards conversation.

The awards ceremony itself was unusually short and unusually direct — one Palme, one Grand Prix, one Jury Prize, no split acting awards. The jury president reportedly requested a compressed presentation to avoid the drift that has slowed recent ceremonies. Whether the format sticks or whether next year's jury reverts to the older sprawl is a small institutional question with outsized cultural implications.

For the industry, the takeaway is straightforward: Cannes 2026 delivered a strong shortlist, a functional sales market, and a visible correction on streamer dominance. Whether that correction is durable is a question the next twelve months will answer. The sales figures posted in the first ten days of June will be more informative than any awards speech.`,
    },
    {
      title: "A24 signs multi-picture deal",
      slug: "a24-signs-multi-picture-deal",
      excerpt: "The distributor's new three-year commitment locks in slate depth and signals a shift in mid-budget commissioning.",
      tags: ["news-tag", "featured-story"],
      heroTags: ["news", "film"],
      body: `A24 announced a three-year, multi-picture financing and distribution deal with an international production consortium, extending the studio's commissioning runway through the end of the decade. The deal covers up to eighteen features across genre and prestige categories, with A24 retaining creative control and global distribution rights, and the consortium taking a defined equity position.

Terms were not fully disclosed, but industry sources place the aggregate commitment at over half a billion dollars over the three-year window. That figure represents a significant step up for A24's per-year output and locks in production financing at a moment when the wider studio system is contracting its slate. The deal was reportedly negotiated over eight months and closed with unusually few public leaks.

The commissioning implications are the interesting part. A24 has been the most consistent buyer of mid-budget director-driven cinema in the American market for the last five years, and the new deal reads as a doubling-down on that thesis. Sources close to the studio suggest the annual budget is weighted toward the eight-to-fifteen-million-dollar production range, which is precisely the tier the majors have been backing away from.

The counter-current is a set of concerns about creative dilution. Every previous attempt to scale a mid-budget prestige model — from the classical New Line era to the early 2010s Weinstein slate — has eventually run into the problem of commissioning too many films for the audience to notice. A24's brand identity has been unusually well-defended in recent years, but doubling the slate is a real stress test of that defence.

For competitors, the deal changes the strategic picture. Focus Features, Neon and Searchlight will have to decide whether to match A24's output at scale or hold the current slate size and cede volume. Both approaches are defensible. The one thing that is now clear is that mid-budget cinema is a viable business at this scale — at least in theory — and the studios that have been treating it as a dying category will need to revisit their assumptions.`,
    },
    {
      title: "Netflix Naija's local-content push",
      slug: "netflix-naijas-local-content-push",
      excerpt: "The regional slate has doubled year over year, and the mix is shifting from acquisitions to originals.",
      tags: ["news-tag", "television"],
      heroTags: ["news", "tv"],
      body: `Netflix Naija's 2026 slate is now roughly twice the size it was in 2024, and the composition has shifted decisively toward originals rather than acquisitions. The regional office in Lagos confirmed twenty-seven original commissions for the year, split across features, limited series and unscripted, with production spending concentrated in Lagos, Abuja and Enugu. That is a meaningful scaling of the platform's Nigerian footprint.

The commissioning mix is the story. Two years ago Netflix Naija's slate leaned heavily on catalogue acquisitions from the existing Nollywood industry, with a handful of first-look originals as prestige placeholders. The new slate reverses that ratio: originals are the volume, acquisitions are the fill, and roughly sixty percent of the production spend now goes to originals with Nigerian writers, directors and department heads.

Local industry response has been broadly positive but not uncritical. Producers welcome the volume of commissions, but there is ongoing debate about the terms of the deals — buy-out structures, back-end participation, and the treatment of IP ownership after the original streaming window. Several senior Nollywood producers have publicly asked for more equity-sharing rather than flat licensing fees, and the conversation is likely to continue through the year.

Netflix, for its part, has been careful to point out that the Nigerian slate is now competitive with its Korean and Spanish-language originals in some regional performance metrics. Blood Sisters remains a reference point, and the newer Africa Magic-adjacent titles have been reportedly meeting or exceeding early forecasts. Whether the internal metric holds up over the full commissioning window is a different question.

The larger implication is one the wider streaming industry is watching closely. If Netflix Naija's originals-first model performs well through 2026, expect Amazon and Apple to accelerate their own commissioning in Lagos. If it stalls, expect a quieter retrenchment in favour of licensing deals. Either way, the next twelve months will settle a set of strategic questions the streamers have been deferring for the last three years.`,
    },
    {
      title: "Fela biopic moves into pre-production",
      slug: "fela-biopic-moves-into-pre-production",
      excerpt: "The long-gestating biographical drama has cast its lead and confirmed a Lagos-first shoot, with an international post pipeline.",
      tags: ["news-tag", "profile"],
      heroTags: ["news", "spotlight"],
      body: `The long-in-development Fela Kuti biopic has moved formally into pre-production, with a lead actor confirmed, a director attached, and a Lagos-first shooting schedule beginning in the second quarter of the year. The film is a joint production between a Lagos-based independent, an American mid-budget financier, and a European sales agent, with post-production planned across Lagos and London.

The casting choice has been the subject of intense speculation for two years, and the confirmation of a Nigerian actor known primarily for stage work resolves a debate that had drawn public statements from members of the Kuti family. Family involvement in the production has been publicly welcomed by the director, and the estate has been credited as executive producer, which should reduce some of the friction that has bedevilled earlier attempts at the material.

The screenplay, which has passed through multiple drafts, focuses on the late 1970s period and the Kalakuta Republic. That is a narrower window than the earlier drafts, which attempted to cover the full arc from London to Fela's death, and the decision to compress reads as a discipline choice rather than a budgetary one. A tighter timeframe should also allow the film to spend more time on the music, which the earlier scripts tended to under-serve.

Music rights have reportedly been secured for the full period-relevant catalogue, and the film's music supervisor is a Nigerian jazz musician with prior credits on documentary Fela material. Whether the film uses re-recorded performances or the original masters is not yet publicly confirmed. Both approaches have creative arguments in their favour, and the choice will shape how the film sounds in exhibition.

Production begins in April, with a target festival release in mid-to-late 2027. Distribution is not yet locked, but the film's structure — mid-budget, international appeal, culturally specific — makes it a natural fit for the current mid-budget arthouse market that A24, Neon and Amazon have been actively courting. Watch the Cannes and Toronto lineups next year.`,
    },
    {
      title: "Actors' Guild strike aftermath",
      slug: "actors-guild-strike-aftermath",
      excerpt: "Two years after the 2023 stoppage, the industry is still adjusting to the terms it produced — and to the ones it didn't.",
      tags: ["news-tag", "commentary"],
      heroTags: ["news"],
      body: `Two years on from the 2023 actors' guild strike, the industry is still working through the implications of the agreement it produced. The AI provisions, in particular, have been the subject of ongoing negotiation at the individual-production level, and the guardrails that were locked into the master contract have proven both meaningful and incomplete. Most productions are complying; a small but visible minority are testing the edges.

The residuals framework is the piece of the deal that has performed closest to expectations. Streamer residuals now include a viewership component that has generated meaningful payouts on shows that would have earned nothing under the previous flat-rate model. The formula is complicated, and there have been a handful of high-profile disputes about how viewership is calculated, but the principle has held.

The AI provisions have been the more contested piece. The contract requires informed consent and specific compensation for any digital-double work, and it prohibits fully synthetic performances without prior authorization. In practice, several productions have quietly tested the boundaries — background-crowd generation, voice-doubling in ADR, and de-aging work that arguably crosses the digital-double line. The guild has filed three grievances in the past year and won all three. That is a durable precedent but a slow enforcement mechanism.

The counter case, from the studio side, is that the strike settled the wrong problems and left the biggest ones for later. Streaming windowing, per-title greenlight authority, and the fragmentation of the international residuals market were all treated as second-tier issues in 2023. They are, by most accounts, the top-tier issues now, and the current contract does not have adequate provisions for any of them. The next negotiation will be more contentious than the last one.

For actors themselves, the practical effect is mixed. Middle-tier working actors report modest income improvement, largely driven by the residuals structure. Top-tier actors are largely unaffected. Below-the-line performers — background, stand-ins, ADR work — are the group most exposed to the AI provisions and the group with the least individual leverage. The union will need to address that gap in the next round if the strike is to be considered a durable structural win.`,
    },
    {
      title: "TIFF adds African cinema pavilion",
      slug: "tiff-adds-african-cinema-pavilion",
      excerpt: "The festival's new pavilion formalises a decade of programming and creates a permanent industry venue for the region.",
      tags: ["news-tag", "events-tag"],
      heroTags: ["events", "news"],
      body: `The Toronto International Film Festival announced a permanent African Cinema Pavilion for the 2026 edition, formalising nearly a decade of programming activity and creating a year-round industry presence for the region. The pavilion will operate during the festival window each September and host a smaller off-season programme during TIFF's spring events cycle.

The pavilion is structured as an industry venue rather than a public one. Its remit is sales, co-production financing, and buyer-seller introductions, with an emphasis on connecting African production companies to European and North American distribution. The initial year is funded jointly by TIFF, a private Canadian foundation, and a consortium of Nigerian and Kenyan production companies.

The programming context matters. TIFF has been the strongest North American festival for African cinema for at least a decade, and the pavilion recognises a shift the festival has been leading rather than following. Nigerian and Kenyan features have moved from occasional selection to consistent presence across every major section, and the sales activity around those titles has justified a permanent infrastructure investment.

Whether the pavilion becomes a template for other festivals is a fair question. Cannes has flirted with a similar structure for two years without committing; Berlinale runs a Forum programme that overlaps but does not fully match; Sundance's ongoing African cinema initiative is a related but distinct effort. If the TIFF pavilion performs, expect at least one of these festivals to follow within eighteen months.

For the African industry, the value of the pavilion is largely infrastructural. Sales meetings that used to be scattered across coffee shops and hotel lobbies now have a formal venue with translation, meeting rooms, and calendar coordination. That is a small operational improvement that produces disproportionate downstream results in a market where relationships and follow-through determine which films actually reach international audiences. Structure, in this business, is destiny.`,
    },
    {
      title: "Studio consolidation news",
      slug: "studio-consolidation-news",
      excerpt: "Two mid-tier studios announced a merger this week — the third such move in eighteen months, and probably not the last.",
      tags: ["news-tag", "commentary"],
      heroTags: ["news"],
      body: `Two mid-tier American studios announced a merger this week, the third significant consolidation move in the last eighteen months and one that will further compress the number of independent decision-makers at the top of the American film industry. The combined entity will control a library of roughly nine thousand titles, a distribution pipeline that reaches roughly ninety percent of North American exhibition, and a production pipeline of about forty features a year.

The financial rationale is straightforward: scale is defensive in a market where streaming has hollowed out the mid-budget theatrical business and consolidated marketing leverage in the hands of a small number of large libraries. The merged entity expects to reduce overhead by roughly fifteen percent, capture better streamer licensing terms on the combined library, and consolidate marketing spend into a smaller number of tentpole releases.

The commissioning implications are less encouraging. Every previous studio consolidation in the last decade has resulted in a reduced slate at the merged entity, typically weighted more heavily toward established IP and away from originals. The pattern is consistent enough that it deserves to be treated as a structural rather than a coincidental effect. Consolidation shrinks the number of pitches that can be greenlit, which shrinks the number of first-time directors who can get made.

The counter case, from the studios themselves, is that the consolidation is what makes the ambitious slate possible — that only at scale can the marketing and distribution costs of a mid-budget release be absorbed. This has some truth to it, and the largest studios do occasionally commission ambitious mid-budget cinema. But the total volume of that commissioning across the majors is now smaller than it was in any year since the mid-1990s, and no amount of scaling has reversed that.

For working filmmakers, the consolidation is bad news dressed as neutral news. Fewer studios means fewer buyers, fewer buyers means fewer greenlights, and fewer greenlights means fewer opportunities to make a second or third film. The independents, the streamers, and international co-productions will have to absorb the difference — and they are doing so, but not at the pace the consolidation is happening. The gap is real, and it will show up in the range of films audiences can see in three to five years.`,
    },
    {
      title: "Nollywood distribution deal in South Africa",
      slug: "nollywood-distribution-deal-in-south-africa",
      excerpt: "A new pan-African distribution agreement gives Nigerian producers guaranteed screens in Johannesburg and Cape Town.",
      tags: ["news-tag", "featured-story"],
      heroTags: ["news", "spotlight"],
      body: `A new distribution agreement announced this week gives Nigerian producers guaranteed exhibition in Johannesburg, Cape Town and Durban for up to twenty theatrical releases per year, split between mainstream and prestige categories. The deal is between a Lagos-based distribution collective and a South African exhibition chain, and it is the first structured pan-African theatrical distribution agreement of its scale.

The mechanics are worth outlining. Nigerian producers who commit to the collective can access a slate calendar with pre-negotiated exhibition terms in South Africa, which reduces the individual negotiation burden that has historically made cross-border distribution economically unviable for smaller productions. In exchange, the South African chain gets first-look access to the Nigerian slate and a share of local marketing revenue.

The historical context makes the deal meaningful. Nollywood's theatrical footprint outside Nigeria has been essentially informal for two decades — individual producers negotiating individual venues, often with no consistent pricing structure and no marketing support. The result has been strong on-the-ground demand and no functional distribution infrastructure. The new deal is an attempt to formalise a market that has been operating on goodwill.

The critique from within the Nigerian industry is that the collective's terms may favour larger producers over smaller ones, and that the marketing revenue share may not scale down to the mid-budget arthouse films that most need the infrastructure. Both are fair concerns, and the collective's leadership has been publicly committed to a two-year review of the terms with an eye toward broader accessibility.

The larger opportunity is regional. If the Nigeria-South Africa corridor works, similar deals become plausible with Kenyan exhibition, Ghanaian exhibition, and eventually with the Francophone West African market that has historically been the hardest to crack. Pan-African distribution has been an aspiration for decades. This is the first deal that looks operationally serious enough to change the practical geography of the industry. Watch the box office numbers from the first ten releases.`,
    },
    {
      title: "Streaming outages weekend recap",
      slug: "streaming-outages-weekend-recap",
      excerpt: "A rough weekend for the major platforms exposed the fragility of infrastructure that most subscribers assume is invisible.",
      tags: ["news-tag", "technology"],
      heroTags: ["news"],
      body: `Three of the four major streaming platforms experienced service degradations over the weekend, in an unusually concentrated cluster of outages that exposed how fragile the underlying infrastructure remains even after years of investment. Netflix suffered a five-hour partial outage on Saturday night, Amazon Prime Video had a three-hour issue on Sunday morning, and Apple TV+ had a shorter but more geographically distributed disruption on Sunday afternoon.

The root causes were unrelated. Netflix's issue traced back to a cloud provider load-balancer configuration change; Amazon's to a content-delivery network mismatch during a scheduled update; Apple's to a DNS routing problem in Europe. What made the weekend unusual was not any single event but the coincidence of all three in a forty-eight hour window, which drew press attention that any individual outage would not have received.

The audience response was informative. Subscribers who might have grumbled quietly about a two-hour outage instead spent the weekend on social platforms complaining, cross-comparing, and in a small but visible number of cases publicly cancelling. The event demonstrated something the streamers have been reluctant to acknowledge — that subscribers now expect the reliability of a utility and are increasingly willing to punish the platforms when that expectation goes unmet.

The commercial implication is meaningful. Cancellation trend data over the following seven days will not be fully visible for another month, but the internal metrics inside the platforms will show whether the outages produced churn beyond the baseline. Historically these events have produced short-term spikes that reverse within thirty days. Whether the current bundle of subscriber frustrations — pricing increases, ad-tier rollouts, content-library reductions — makes the reversal slower this time is an open question.

For the platforms, the correct response is investment. Streaming infrastructure has been treated as a cost centre rather than a differentiator for most of the last decade, and the weekend showed the limits of that approach. The next competitive advantage in streaming is going to be reliability, and the platforms that treat outages as a strategic issue will separate themselves from the ones that treat them as an operational nuisance. Watch what gets budgeted for infrastructure over the next twelve months.`,
    },
    {
      title: "Africa Magic 2026 slate",
      slug: "africa-magic-2026-slate",
      excerpt: "The channel's annual upfront revealed a heavier commitment to originals and a new Lagos-based writers' initiative.",
      tags: ["news-tag", "television"],
      heroTags: ["news", "tv"],
      body: `Africa Magic's 2026 upfront presentation confirmed a slate that leans harder toward original commissioning than any year in the channel's history, and formalises a Lagos-based writers' initiative that has been quietly running as a pilot for the last eighteen months. The channel confirmed twenty-two original commissions across its linear and streaming footprint, up from fourteen in the prior year.

The programming mix is worth breaking down. Africa Magic will commission four flagship dramas, six half-hour comedies, three limited-series prestige projects, and roughly nine unscripted or documentary formats. The prestige projects — including a new political drama in the King of Boys tradition and a period piece set during the oil boom — are the ones the industry will watch most closely, and the ones the channel is most publicly betting on.

The writers' initiative is the more structural piece of the announcement. The programme provides funded development time for early-career Nigerian writers, with a two-year cycle and a guarantee of at least three commissioned projects out of each cohort. This is the kind of long-cycle development investment that most channels have been unwilling to make, and it addresses a real gap in the Nigerian production ecosystem — the absence of institutional support for writers between their first spec script and their first commissioned show.

The channel's commissioning executives were also clear that international co-production is part of the model. Two of the flagship dramas are already in advanced discussion with international partners, and the channel confirmed active conversations with Netflix, Amazon and Showmax on a title-by-title basis. This is a shift from the previous decade's model of licensing library content out — Africa Magic is now interested in structured co-financing on individual projects.

The critique is the same one every upfront produces: announcements are cheaper than production, and the industry has learned to discount headline figures against actual delivery. Fair enough. But Africa Magic's delivery rate on announced projects has improved significantly in the last three years, and the industry's mood on the channel's ambitions is cautiously constructive. Judge the slate on what actually reaches the screen. The first titles are scheduled for second-quarter release.`,
    },
  ],
  opinion: [
    {
      title: "Why we still need the mid-budget movie",
      slug: "why-we-still-need-the-mid-budget-movie",
      excerpt: "The film industry's argument against the mid-budget theatrical release is an economic one — and it deserves a cultural rebuttal.",
      tags: ["opinion-tag", "commentary"],
      heroTags: ["opinion"],
      body: `The argument the industry has been quietly making against the mid-budget theatrical release is fundamentally an economic one: that the marketing spend required to make an adult drama profitable in cinemas no longer produces a return, and that the audience for those films has migrated to streaming. That is a serious argument, and it deserves a serious answer. But the cultural stakes of losing the mid-budget theatrical film are large enough that the economic case needs to be tested rather than accepted.

The theatrical experience is not just a distribution decision. It is a compositional decision, and a critical one. A director shooting for a forty-foot screen makes different choices about pacing, framing, sound design and edit rhythm than a director shooting for a fifty-inch television. The two crafts overlap significantly, but they are not identical, and the discipline of composing for the theatrical room is one of the specific things that made American cinema great in its post-war peak. Losing the mid-budget theatrical film means losing the training ground for that craft.

There is also a social case. Cinema is one of the few remaining cultural experiences that requires uninterrupted attention in the presence of strangers, and that combination is itself a form of civic infrastructure. A film seen in a room with two hundred other people is a different film than the same one seen alone on a couch. The distinction matters not just aesthetically but democratically — mass culture is thinner when it has fewer shared rooms.

The counterargument is that the industry cannot support what the audience will not pay for, and that streaming has revealed a preference the theatrical model was suppressing. There is some truth to that. But it is also true that the theatrical mid-budget was killed by a specific pricing decision — the collapse of the DVD market — and that no serious effort has been made to rebuild a functioning cinema economy at the two-to-five-million-dollar marketing level. The audience did not choose streaming over cinema; it chose streaming over the fifteen-dollar ticket in the absence of a five-dollar alternative.

None of this is nostalgic. The mid-budget theatrical film should not be preserved because it used to exist. It should be preserved because it produces a specific kind of cinema — adult, character-driven, formally patient — that the current market is systematically failing to fund. That is a cultural loss, and the industry that presides over it should not be permitted to shrug it off as a natural evolution of consumer preference.`,
    },
    {
      title: "Criticism after the algorithm",
      slug: "criticism-after-the-algorithm",
      excerpt: "The recommendation engine has quietly displaced the critic as the primary gatekeeper — and film culture is worse for it.",
      tags: ["opinion-tag", "culture"],
      heroTags: ["opinion"],
      body: `Somewhere in the last decade the recommendation engine displaced the film critic as the primary gatekeeper of what audiences watch. That shift has been mostly celebrated by the platforms and mostly ignored by the industry, but it is worth taking a moment to notice what it has actually done to film culture. The algorithm and the critic have different jobs, and treating the first as a replacement for the second is a category error that has narrowed the range of what audiences are exposed to.

A film critic, at their best, is doing three things simultaneously: describing the object of criticism, situating it in a tradition, and making an argument about its value. All three are useful. All three are difficult. And all three are functions the algorithm actively cannot perform. The recommendation engine can tell you what other people watched next; it cannot tell you what the film is doing, why it matters, or how it fits into a hundred-year history of the medium. That is not a small omission.

The industry's response has been to argue that the algorithm has democratised discovery — that instead of a small number of critics telling audiences what to watch, everyone can find what they want on their own. There is something to this. But the actual data on discovery patterns suggests the algorithm concentrates attention on a smaller number of titles than the pre-algorithm distribution system did, not a larger one. The recommendation engine surfaces what other people have already engaged with, which produces a rich-get-richer dynamic that is arguably more homogenising than the old critical apparatus.

The counter case is that criticism itself was never as neutral as its defenders remember — that the old critical establishment was slow to recognise non-Western cinema, hostile to genre film, and blinkered about television. All of that is true. The critical establishment was often narrow and sometimes actively unjust. But the answer to a flawed critical culture is a better critical culture, not the absence of one, and the last decade has provided ample evidence that the absence is worse.

What film culture needs, urgently, is a way to fund and distribute criticism that operates outside both the platform and the promotional press. That work is happening — Substack, small-magazine relaunches, video essayists on YouTube — but it operates at a fraction of the reach the old apparatus had. The recommendation engine will not, by itself, produce the next generation of viewers who know how to think about a film. If the industry wants informed audiences, it will have to help build the infrastructure that used to produce them.`,
    },
    {
      title: "Nollywood shouldn't chase Hollywood",
      slug: "nollywood-shouldnt-chase-hollywood",
      excerpt: "The temptation to imitate the American blockbuster is a strategic error — Nollywood's strengths lie elsewhere.",
      tags: ["opinion-tag", "commentary"],
      heroTags: ["opinion", "culture"],
      body: `A recurring temptation in Nigerian film industry conversations is the pull toward Hollywood-style production values, budgets and marketing rhythms as the measure of maturity. It is understandable — Hollywood is the industry with the largest global marketing footprint, and the aesthetic of an American theatrical release is the international default. But it is a strategic error, and the Nigerian producers who are winning right now are the ones who have refused to make it.

The Nigerian film industry's actual competitive advantage is cultural specificity. A Nollywood domestic drama, done with real budget and real craft attention, does something that Hollywood cannot fake — not because Hollywood is untalented, but because the specific rhythms of a Nigerian family scene are cultural artifacts rather than transferable technical skills. When Nollywood tries to be Hollywood, it competes on Hollywood's terms and loses. When it doubles down on what only it can do, it wins.

The evidence is on the screen. Kunle Afolayan's recent work is not shot like an American film, and would be worse if it were. Kemi Adetiba's King of Boys is unmistakably Nigerian in its rhythm and its politics, and the international audience it has found responds to the specificity, not to any imitation of Empire or House of Cards. Mati Diop's cinema is French-Senegalese in a way that would collapse if it tried to be Hollywood. The pattern is consistent enough to be treated as a rule.

The counter case, sometimes made by producers with international ambitions, is that global markets require production values that only the Hollywood pipeline can currently supply, and that Nollywood has to raise its technical baseline before it can raise its cultural ambition. There is something to this — the industry does need better cameras, better sound, better post — but the ordering is wrong. Cultural ambition is what unlocks the investment in production values, not the other way around. The films that get the international finance are the ones with the strongest voice, not the ones with the closest resemblance to something Netflix already commissions.

The advice for producers working now is straightforward: build the film that only you can build, in the specific place you can build it, with the specific voices you have access to. The market will find it. The market has been finding it, consistently, for the last four years. Nollywood's next decade will belong to the producers who refuse to apologise for being from Lagos.`,
    },
    {
      title: "The two-hour movie is a moral choice",
      slug: "the-two-hour-movie-is-a-moral-choice",
      excerpt: "The film industry's inflation of runtime is not neutral — it is an economic and aesthetic pattern that deserves resistance.",
      tags: ["opinion-tag", "analysis"],
      heroTags: ["opinion", "film"],
      body: `The three-hour prestige film has been so normalised in the last five years that it is easy to forget how recent an invention it is. The average American drama in the 1990s ran roughly one hundred and fifteen minutes; the average one in the 2020s runs closer to one hundred and forty-five. That thirty-minute inflation is not artistically neutral, and the industry that presides over it should be honest that runtime creep is a specific pattern with specific consequences for craft.

Length is a form of discipline. A film that has to close in one hundred and ten minutes is a film that has to choose what to cut, which is the central act of dramatic craft. The three-hour film often refuses to make that choice. It preserves the auteur's preferences, indulges the star's screen time, and postpones the emotional resolution past the point where the audience's attention can hold. The result is not more art. It is often less.

The economic case for length is real: streamers pay for hours; awards juries reward scale; a three-hour prestige drama has a different marketing profile than a two-hour one. All of that is true. But the aesthetic case is thinner than the industry admits. Killers of the Flower Moon is a great film that would still be a great film at two hours and thirty-five minutes. Oppenheimer probably needs its runtime. Napoleon does not. The distinction between necessary length and self-indulgent length is one the industry has stopped enforcing.

The counter case is that the audience wants the runtime — that the three-hour epic is a distinguishing feature of the theatrical experience in a streaming era, and that shorter films are perceived as smaller. There is something to this. But the box office data is mixed, and the highest-performing prestige dramas of the last three years have not been the longest ones. The audience is willing to sit for three hours when the film earns it, and unwilling when it doesn't. That is a directorial responsibility, not a marketing decision.

The two-hour movie is a moral choice in the specific sense that it requires the filmmaker to accept the limits of the audience's time and attention and to earn every minute against that constraint. It is a discipline the industry has been quietly abandoning. The best filmmakers of the next generation will be the ones who reject the runtime inflation and rebuild the practice of the tight, argumentative, formally rigorous two-hour drama. That is the film culture worth defending.`,
    },
    {
      title: "What audiences owe cinemas",
      slug: "what-audiences-owe-cinemas",
      excerpt: "The debate about the future of theatrical exhibition has been mostly about what studios should do — it should also be about what viewers can do.",
      tags: ["opinion-tag", "culture"],
      heroTags: ["opinion", "film"],
      body: `Most of the recent conversation about the future of theatrical exhibition has focused on what the studios should do — release films first in cinemas, respect the theatrical window, invest in mid-budget cinema. All of that is worth arguing about. But there is a smaller conversation that deserves more attention: what audiences themselves can do, and what obligation viewers have to the exhibition infrastructure they claim to value.

Cinemas do not exist independent of the audience that attends them. They exist because a specific number of people, on a specific number of nights, decide that a fifteen-dollar ticket and a half-hour commute is worth the specific experience of watching a film in a room with strangers. When that decision stops being made, cinemas close, and the closure is permanent in a way that most cultural infrastructure loss is. A theatre that shuts does not usually reopen.

This is not a plea for guilt or nostalgia. It is a practical observation. The theatrical experience has real costs, and its survival depends on a critical mass of people willing to pay them. Every reader of an editorial site like this one has, arguably, a small obligation to attend cinema more frequently than the average consumer if they want the ecosystem to continue existing. That obligation is not moral, exactly. It is closer to civic — the same kind of obligation that keeps public libraries funded.

The counter case is that audiences are not responsible for keeping alive an industry that has, in many cases, made itself less welcoming. Theatre chains have raised prices, cut concessions, and reduced screen counts for adult drama; the audience is arguably reacting rationally to a worse product. All of that is true, and none of it changes the underlying dynamic. If the audience stops attending, the infrastructure is lost regardless of whose fault the decline was.

What audiences can do, in practical terms, is small but cumulative. Attend one more film a month in a cinema than they would otherwise. Buy the ticket rather than the streaming rental for the mid-budget adult drama they meant to see. Take a friend who has never been to an arthouse cinema. Support the local independent theatre rather than the multiplex chain when both are showing the same title. None of these actions saves the industry alone. All of them together, at scale, are the only thing that will.`,
    },
    {
      title: "On the death of the trailer",
      slug: "on-the-death-of-the-trailer",
      excerpt: "The two-minute trailer has been quietly deteriorating for a decade — and its collapse is a symptom of a wider marketing problem.",
      tags: ["opinion-tag", "analysis"],
      heroTags: ["opinion"],
      body: `The film trailer used to be a compressed argument for why an audience should spend two hours watching a specific film. It was a rhetorical form as old as the industry itself, and the best trailers had a genuine craft — a hook, a tonal register, a promise the film could keep. Something has gone wrong with the form in the last five years, and the trailers currently being released for major films are, on average, worse than the trailers released a decade ago.

The most visible problem is spoilers. Contemporary trailers routinely give away half the plot, most of the good jokes, and any twist that arrives before the final act. The internal logic is a marketing one: audiences reportedly respond to more information rather than less, and platforms optimise for click-through rather than surprise. The rational-audience assumption may be right in the short term and is almost certainly wrong in the long term — a trailer that gives away the film reduces the value of the film to the viewer who has seen it.

The second problem is tonal collapse. Most major-studio trailers are cut to the same rhythm — three short setup beats, a needle-drop, a montage of the biggest action moments, a musical sting, a title card. It is a recipe, and once you notice the recipe you cannot unsee it. Independent trailers, especially A24's, still occasionally break the pattern — but even they have converged on a smaller number of moves than they used to have. The form has narrowed, and narrower forms produce worse arguments.

The counter case is that trailers are a marketing artifact, not an artistic one, and that judging them by aesthetic standards is a category confusion. Marketing exists to sell tickets, and if the current form sells tickets efficiently it is doing its job. There is some truth to this. But the assumption that current trailers are selling tickets efficiently is itself questionable — theatrical box office has softened, per-title marketing spend has grown, and the return on trailer views has arguably deteriorated. The recipe is not, in fact, working as well as its defenders claim.

The best recent trailers — the Killers of the Flower Moon teaser, the first Barbie trailer, the initial teaser for The Zone of Interest — all worked by breaking the recipe. Each made an argument, each preserved surprise, and each converted an unusually high fraction of trailer views into ticket sales. The industry should notice the pattern. Trailers that respect the audience's intelligence are, still, the ones that work best.`,
    },
    {
      title: "The prestige TV bubble",
      slug: "the-prestige-tv-bubble",
      excerpt: "Every commissioner in Hollywood claims to want a Succession — the resulting oversupply is a bubble that is beginning to correct.",
      tags: ["opinion-tag", "television"],
      heroTags: ["opinion", "tv"],
      body: `Every senior television commissioner in Hollywood has spent the last four years explaining that they are looking for the next Succession, the next Fleabag, the next Chernobyl. The commissioning has followed the wish. Studios and streamers have collectively poured funding into prestige-drama pitches, prestige limited series, and prestige-adjacent unscripted formats at a scale the market cannot sustain, and the resulting slate is beginning to visibly buckle under its own weight.

The economic logic of the bubble is that every commissioner needs a flagship to justify their annual spend, and the flagship has to be prestige because prestige is what awards juries and end-of-year critical lists reward. But no market can accommodate twelve flagships a year across four streamers plus HBO plus the linear networks — the audience for that number of prestige titles simply does not exist, and the marketing budgets cannot be scaled to support that many simultaneous releases. Something has to give, and it is starting to.

The most visible correction is at Netflix and Amazon, both of which have quietly slowed prestige commissioning in the last twelve months and reallocated toward genre and unscripted. That reallocation reads in the trade press as a retreat, but it is closer to a normalisation. The prestige bubble was always going to correct; the question was only whether the correction would be a soft landing or a sharp one. Netflix's approach so far suggests soft; Amazon's is closer to sharp.

The counter case is that prestige television has produced most of the best writing and directing of the last decade, and any correction is likely to damage the parts of the ecosystem that most deserve to survive. There is truth to this. The correction is not costless. Some of the shows that would have been greenlit under the previous regime will not be greenlit now, and some of the writers who would have made those shows will move to other industries. That loss is real.

But the current commissioning pattern is unsustainable, and the correction is preferable to the collapse it prevents. What the industry should be arguing for is not more prestige television, but better prestige television — commissioned at a slower rate, with more development time, and with less pressure to justify a series against a limited-episode film equivalent. If the correction produces that, it will have been worth its cost. If it produces a return to genre-only commissioning, the loss will be larger than any Succession the industry claims to want.`,
    },
    {
      title: "When actors direct: a defense",
      slug: "when-actors-direct-a-defense",
      excerpt: "The industry's default suspicion of the actor-turned-director is out of date — the last decade has produced some of the strongest debuts in film.",
      tags: ["opinion-tag", "profile"],
      heroTags: ["opinion", "film"],
      body: `There is a lingering industry skepticism about the actor-turned-director that no longer matches the evidence. The default assumption — that acting and directing are essentially different disciplines and that the crossover is usually vanity — was defensible in the era of the vanity project, but it does not describe the current wave of actor-directors. The last decade has produced some of the strongest directorial debuts in American cinema, and a disproportionate number of them have been directed by actors.

Consider the list. Regina King's One Night in Miami, Greta Gerwig's Lady Bird, Chloé Zhao's early work as an actor-adjacent auteur, Rebecca Hall's Passing, Bradley Cooper's A Star Is Born and Maestro, Emerald Fennell's Promising Young Woman, Olivia Wilde's Booksmart. Each of these is a legitimate directorial debut by a working actor, and each demonstrates that acting experience produces a specific kind of directorial competence — an intuition for performance, for pacing, for how a scene lives inside the actor's body.

That intuition is not a substitute for the technical craft of directing. But it is a significant advantage, and one that a career director without acting background often has to spend years developing. Actors know what a scene feels like from the inside, and they know how to give another actor the space and permission to do the work. Those two skills, combined with a competent DP, are often enough to produce a stronger debut than a career director with a stronger technical background but a shallower feel for performance.

The counter case is that acting and directing are, in fact, different jobs, and that the recent good crop of actor-directors is a survivor bias — we notice the successes and forget the many actor-directed films that were mediocre or worse. There is something to this. Not every actor-director is Greta Gerwig, and the industry has produced its share of forgettable actor-vanity projects. But the base rate is higher than the skepticism suggests, and the skepticism itself is slower to update than the evidence would justify.

What the industry should do, in practical terms, is normalise the actor-director path as a legitimate route to a first feature, and invest in the development infrastructure that would let more actors make that transition well. Studio development programmes have historically been oriented toward writer-directors and career directors; there is a case for a parallel programme oriented toward actors with directorial ambitions and enough craft awareness to know what they don't yet know. The next generation of the American director will include a lot of former actors. It should.`,
    },
    {
      title: "Streaming ratings are a fiction",
      slug: "streaming-ratings-are-a-fiction",
      excerpt: "The viewership numbers streamers release are marketing artifacts, not reliable data — and the industry should stop pretending otherwise.",
      tags: ["opinion-tag", "commentary"],
      heroTags: ["opinion", "tv"],
      body: `The streamer viewership numbers that appear in press releases and trade coverage are, with rare exceptions, marketing artifacts rather than reliable data. Netflix's Top 10, Amazon's viewing statistics, Apple's occasional disclosures, and the internal metrics the streamers quote to justify renewals are calculated using methodologies that have shifted repeatedly, are audited by nobody outside the platforms themselves, and are chosen specifically to produce numbers that make the platform look good.

This is not a conspiracy theory. It is a straightforward observation about the difference between the Nielsen system that governed broadcast television — imperfect, but externally audited and comparable across networks — and the streaming era's balkanised, self-reported, methodologically inconsistent viewership disclosure. The trade press has largely stopped pointing this out because the platforms are the sources for most of the coverage, and criticising the sources produces friction. But the data problem is real, and the industry has organised itself around numbers that are not, strictly speaking, numbers.

The consequences are largest in commissioning. If a streamer's internal metric of choice is a two-minute-view threshold, then the shows that get commissioned will be optimised for two-minute-view retention rather than for anything else. If the metric is completion percentage, then shows will be optimised for completability. Every metric produces a specific set of incentives, and the streamer that chooses the metric shapes the commissioning slate in ways that no external actor can audit or contest.

The counter case is that the streamers have been more transparent recently than they used to be, and that the trade press does now push back on the more absurd numbers. Both are true. But the transparency is still marginal, and the pushback is still infrequent, and the underlying problem — that the industry lacks a shared measurement standard — has not been resolved. Netflix's Top 10 is not comparable to Nielsen's ratings, and it is not comparable to anything Amazon or Apple release. The absence of comparability is a structural weakness.

What the industry needs is what it had for most of the twentieth century — an independent, audited, cross-platform viewership standard, funded by a coalition of studios and streamers and operated by an entity with no commercial stake in the results. Nielsen has tried to move into the streaming era and has been rebuffed by the platforms. The Movielabs consortium has proposed alternatives. None of them has traction, because the platforms benefit from opacity. That benefit is the reason the reform has not happened, and the reason it should.`,
    },
    {
      title: "The film-school debate again",
      slug: "the-film-school-debate-again",
      excerpt: "The perennial argument about whether film school matters is being revived — and both sides have missed how much the answer has changed.",
      tags: ["opinion-tag", "commentary"],
      heroTags: ["opinion", "creator"],
      body: `The debate about whether film school is worth the investment has been running in the trade press for at least fifty years, and every few years it re-emerges with a new set of arguments and roughly the same conclusions. What has changed in the last decade is not the question but the answer, and both sides of the argument have been slow to update. Film school in 2026 is a different institution than film school in 2010, and the calculation about whether to attend has shifted with it.

The case against film school has traditionally been an economic one — that a two-year MFA at NYU or USC costs the equivalent of an early career's income, that the technical skills can be learned faster and more cheaply on the job, and that the industry rewards portfolios rather than credentials. All of that is still largely true, and film school remains an expensive way to acquire access to equipment and mentorship that a determined self-starter can partially replicate. The economic argument has not weakened.

But the argument against has quietly weakened in a specific way: the industry's willingness to hire without credentials has narrowed, and the informal apprenticeship pathways that used to substitute for film school — assistant editor jobs, PA roles that led to script supervision, industry mentorships — have thinned as production has consolidated. In a shrinking market, the credential is more valuable than it used to be, not because the skills are better learned in school, but because the network of the school is more valuable than it was when the industry had more entry points.

The counter case for film school has traditionally been about craft — that the discipline of formal training produces stronger filmmakers than self-teaching does. That case is also weaker than its defenders admit. Some of the strongest working directors did not attend film school, or attended and dropped out. Some of the strongest film school alumni make derivative work that is undistinguishable from a hundred other film school alumni. The correlation between formal training and craft outcome is weaker than any admissions office likes to admit.

Where the calculation actually lands is more contingent than the debate captures. If you can get into a top-tier programme with a scholarship, or if your family can absorb the cost without downstream consequences, film school is probably worth it as an access mechanism. If it will produce debt that constrains your creative choices for the first ten years of your career, it is probably not. The specific answer depends on circumstances the debate rarely engages with. The right question is not whether film school is worth it but for whom.`,
    },
  ],
  spotlight: [
    {
      title: "Genevieve Nnaji, quietly changing the room",
      slug: "genevieve-nnaji-quietly-changing-the-room",
      excerpt: "The actress-turned-director has spent five years reshaping how Nigerian film reaches international audiences — without saying much about it.",
      tags: ["profile", "featured-story"],
      heroTags: ["spotlight", "creator"],
      body: `Genevieve Nnaji has spent the last five years reshaping how Nigerian cinema reaches international audiences, and she has done so with a specific kind of restraint that runs counter to the current attention economy. There have been no headline-grabbing announcements, no aggressive social-media presence, no cycle of interviews about her production ambitions. What there has been is a slate of quiet decisions — production credits, script investments, mentorship of younger directors — that in aggregate have moved Nollywood's international profile more than most louder efforts.

Lionheart is still the reference point. The film was Nigeria's Oscar submission, was pulled by the Academy on a technicality that exposed the international awards system's assumptions about English-language cinema, and became a case study in how Nollywood should think about global competition. Nnaji handled the controversy with the same restraint she has brought to everything since — a brief public statement, no ongoing campaign, and a subsequent slate of decisions that suggested she had learned exactly the lessons the incident taught.

The lessons showed up in her production choices. Since Lionheart she has been quietly attached to a set of projects that are Nigerian in specificity but internationally legible in structure — mid-budget dramas with clear festival potential, produced in Lagos with mostly Nigerian teams, and financed through a combination of local and international capital. The strategy is coherent enough to suggest a longer view than the trade press has credited her with.

The critique of Nnaji's public restraint is that it leaves the discourse to louder producers with less considered strategies, and that Nigerian cinema benefits from more public advocacy rather than less. There is something to this. But her instinct — that the work speaks and the industry watches — has proven more durable than the aggressive-marketing playbook that some of her contemporaries have followed. The work is landing. The influence is diffusing. Both are visible if you look for them.

For younger Nigerian actresses considering the transition from performer to producer or director, Nnaji is arguably the most useful model currently working. The path she has walked — sustained acting career, transition to production without abandoning acting, gradual accumulation of authority — is one that fits Nigerian industry realities better than the more sudden model imported from Hollywood. Watch the next slate of Nigerian mid-budget dramas over the next eighteen months. Her fingerprints will be on more of them than the credits will show.`,
    },
    {
      title: "Kemi Adetiba's Boys club",
      slug: "kemi-adetibas-boys-club",
      excerpt: "The King of Boys director has built a production infrastructure most Nigerian filmmakers would need to reinvent to match.",
      tags: ["profile", "featured-story"],
      heroTags: ["spotlight", "creator"],
      body: `Kemi Adetiba's King of Boys franchise is the most visible thing she has done, but the more interesting story is the production infrastructure she has quietly built around it. Her company, Kemi Adetiba Visuals, has become one of the few Nigerian production houses capable of running a prestige-scale drama through pre-production, principal photography, post and distribution without requiring a foreign co-financier to underwrite the back-end. That is a genuine institutional achievement.

The infrastructure is what makes the film work. Nigerian prestige productions have historically been limited not by talent or ambition but by the operational depth required to keep a nine-figure production on schedule and on budget. Adetiba has spent a decade building the department heads, the vendor relationships, and the internal producers who can run that kind of production, and King of Boys — both the theatrical film and the Netflix series — is the visible result of that invisible work.

The visual signature of the show is worth attending to as well. Adetiba's collaboration with DP Sam Osaze produced a specific Nigerian prestige aesthetic — baroque interiors, saturated night exteriors, precise blocking of ensemble scenes — that has begun to influence how younger Nigerian directors compose their own work. That aesthetic influence is a form of authorship distinct from the individual project, and it is arguably the more durable contribution.

The critique of Adetiba's work is a fair one about tonal control. King of Boys occasionally overplays its hand, and the second season's political plotting was denser than it needed to be for its emotional payoffs to land clearly. Both critiques come from an assumption of high craft — nobody expects less from her at this point — but they are real, and the next production will need to hold the ambition without letting the plotting outrun the character work.

What Adetiba has demonstrated, more than any single film, is that Nigerian prestige drama is a viable long-form production practice at a scale the industry did not previously credit. That is a proof point that will influence how commissioners think about Nigerian projects for the next decade, and it is a legacy contribution regardless of what individual films she goes on to direct. The King of Boys world is her signature. The company that built it is her more lasting one.`,
    },
    {
      title: "Kunle Afolayan's slow cinema turn",
      slug: "kunle-afolayans-slow-cinema-turn",
      excerpt: "Nigeria's most technically ambitious filmmaker has spent the last few years slowing down — and his work has grown deeper for it.",
      tags: ["profile", "analysis"],
      heroTags: ["spotlight", "creator"],
      body: `Kunle Afolayan has been the most technically ambitious filmmaker in Nigerian cinema for the better part of two decades. What has changed in the last five years is his tempo. The films he has been making since Citation — and especially Anikulapo and its sequel — have slowed down in a way that runs counter to Nigerian commercial rhythm and closer to the tradition of world slow cinema. It is a deliberate turn, and it is producing his best work.

The slow-cinema move is not a stylistic affectation. It is a considered response to what Nigerian cinema has been asked to do for the last generation — carry the emotional weight of a family scene in the time it takes a Hollywood editor to cut away from it. Afolayan is essentially arguing that Nigerian films can and should compose scenes at the pace at which Nigerian life actually moves, and that the international audience is capable of receiving that pace when the film earns it.

The evidence is in the reception. Anikulapo, released on Netflix and expected by many observers to underperform because of its pacing, instead became one of the platform's most-watched Nigerian titles and drew critical attention across markets that had never engaged with Nigerian cinema before. The sequel extended the world without diluting the tempo. The commercial results validated an aesthetic argument that Nigerian producers had, mostly, been reluctant to make.

The critique of Afolayan's slow-cinema turn is a practical one about industry contagion — that his specific talent for the tempo will not scale to junior directors who lack the craft depth to compose at that pace. There is truth to this. Not every filmmaker can hold a slow scene, and the technique in less skilled hands produces drift rather than depth. Afolayan's example is not a template. It is a demonstration that the discipline is possible for those with the craft to sustain it.

What his slow-cinema turn also does, more diffusely, is give younger Nigerian directors permission to reject the commercial pacing they were previously told was mandatory. That permission is a durable cultural contribution regardless of whether Afolayan's specific tempo becomes widely adopted. The next generation of Nigerian filmmakers is going to compose at a wider range of tempos than the last one, and Afolayan's late-career slow turn is a meaningful part of why.`,
    },
    {
      title: "Mati Diop's ghost cinema",
      slug: "mati-diops-ghost-cinema",
      excerpt: "Atlantics and Dahomey have made her the most formally inventive African filmmaker working — and the most difficult to categorise.",
      tags: ["profile", "analysis"],
      heroTags: ["spotlight", "creator"],
      body: `Mati Diop is arguably the most formally inventive African filmmaker currently working, and one of the most difficult to categorise. Her films — Atlantics, Dahomey, and the earlier short A Thousand Suns — do not sit comfortably in any of the industry's default containers. They are neither straight arthouse nor documentary nor historical drama nor genre film, and their refusal to be categorised has been a large part of why they have accumulated the critical attention they have.

Atlantics remains the reference point for what her cinema does. The film treats ghosts as protagonists rather than devices, and refuses to make the metaphysical claim explicit — the audience is asked to accept the ghosts as a fact of the film's world without being told what they mean. That refusal to explain is not obscurity; it is a specific formal argument that colonial and postcolonial histories cannot be tidied into the psychological realism the European festival tradition demands. Diop is building a cinema that trusts the audience to sit inside a mystery.

Dahomey extends the argument into non-fiction. The film follows the restitution of Beninese royal artifacts from a French museum to their originating culture, and the object of the documentary is essentially the political and metaphysical weight of the objects themselves. It is a documentary in the sense that the events depicted are real; it is not a documentary in any sense that documentary as an industry category usually implies. Diop is again refusing the containers.

The critique of her work is a fair one about accessibility. Her films demand a specific kind of viewing attention that a large audience cannot always give, and the sales figures reflect that constraint. Atlantics won the Grand Prix at Cannes and reached a smaller audience than a similarly reviewed European auteur film would have. Dahomey has been more of a critical event than a commercial one. The films are, in a specific sense, harder to sell than their quality justifies.

What Diop's cinema also does, less visibly, is expand what is possible for younger African filmmakers to attempt. The category-refusing film — neither strictly arthouse nor strictly documentary, neither strictly national nor strictly diasporic — is a legitimate form now in a way it was not a decade ago, and Diop's work is one of the reasons why. The next generation of formally inventive African filmmakers will be working in a landscape she helped create. That is a durable contribution regardless of individual box office.`,
    },
    {
      title: "Wanuri Kahiu after Rafiki",
      slug: "wanuri-kahiu-after-rafiki",
      excerpt: "The Kenyan director's post-Rafiki decade has been quieter than the trade press expected — and more consequential than it has noticed.",
      tags: ["profile", "culture"],
      heroTags: ["spotlight", "creator"],
      body: `Wanuri Kahiu's post-Rafiki decade has been quieter than the trade press expected after the film's Cannes premiere and its subsequent ban in Kenya. What she has actually been doing, mostly out of the international attention cycle, is building the AfroBubbleGum aesthetic movement she and her collaborators articulated a decade ago and running the production infrastructure required to fund the films that movement calls for.

AfroBubbleGum's argument is that African cinema does not have to be about suffering to be serious — that joy, colour and pleasure are legitimate subjects for African filmmakers, and that the international festival system's default preference for suffering-as-authentic is a form of critical bias that should be resisted. That argument is not new, but Kahiu has been unusually explicit about it, and unusually rigorous in following through on it in her production choices.

The follow-through matters more than the manifesto. Since Rafiki she has been attached to production on a range of Kenyan and pan-African projects that share the AfroBubbleGum instinct — bright palettes, contemporary settings, character-driven plots, refusal to be genre-labeled as either African-tragedy or Afrofuturist-optimism. The individual films are less internationally visible than her Cannes premiere, but the cumulative effect on Kenyan production is real.

The critique of AfroBubbleGum as a movement is a fair one about scale. There are only so many productions Kahiu can personally attach to, and the aesthetic requires a specific set of craft dispositions that not every Kenyan director shares. The movement risks becoming a house style rather than a general contribution to African cinema. Kahiu's response, in interviews, has been to point at the growing set of Kenyan directors who are working in the register without her direct involvement, which is a reasonable answer.

What Kahiu is really building is not a personal filmography but an institutional case for a specific kind of African cinema. That case is harder to see on any given festival slate than a single Cannes premiere, but it will be more durable in the long run. The next Kenyan director who gets an Amazon or Netflix commission will be operating in a landscape she helped clear. Ban or no ban, that is the more lasting contribution.`,
    },
    {
      title: "Tunde Kelani's living archive",
      slug: "tunde-kelanis-living-archive",
      excerpt: "Half a century behind the camera has made TK the most cited cinematographer on the continent — and one of its most active mentors.",
      tags: ["profile", "featured-story"],
      heroTags: ["spotlight", "creator"],
      body: `Tunde Kelani has been behind the camera for over half a century, and there is arguably no more cited cinematographer on the African continent. Every serious conversation about Yoruba cinema, about Nigerian visual grammar, about the transition from Nollywood's home-video era to its current theatrical ambitions passes through his work. That reference density is a specific kind of institutional weight, and it has quietly made him the most important living Nigerian filmmaker.

The technical achievement is the obvious starting point. Kelani's compositions during the 1980s and 1990s Yoruba-language film boom established a visual vocabulary — landscape-framed dialogue, natural-light interiors, a specific patience with the family scene — that younger Nigerian cinematographers still work in reference to. His films from that period were shot on modest budgets with limited equipment, and the craft depth is more evident, not less, for the constraints. The eye is the eye regardless of the tool.

What makes his ongoing work more interesting than the archive is his continued willingness to shoot at nearly eighty. His most recent film, released to festival circuit last year, is technically as ambitious as anything he has made and formally more experimental than most of his career. He is not resting on the reputation. He is actively extending the practice.

The mentorship is arguably the more consequential piece of his current activity. Kelani has for years been an accessible teacher to younger Nigerian filmmakers — through Mainframe Productions, through workshops, through informal on-set apprenticeships — and the number of currently working Nigerian cinematographers who have spent time on his sets is disproportionately high. That is an infrastructural contribution that no individual film can match.

The critique, such as it is, is a fair one about industry succession. The generation of Nigerian filmmakers who trained under Kelani is now itself moving toward late career, and the informal apprenticeship model that produced them will not obviously survive a more institutional Nigerian production culture. Whether Nigeria builds a formal training infrastructure that can match what Kelani has provided informally is one of the industry's larger open questions. He deserves credit for how long he has held the gap alone.`,
    },
    {
      title: "A Barry Jenkins method breakdown",
      slug: "a-barry-jenkins-method-breakdown",
      excerpt: "The Moonlight director's specific approach to pre-production is a course in how to protect performance at the script stage.",
      tags: ["profile", "behind-the-scenes"],
      heroTags: ["spotlight", "film"],
      body: `Barry Jenkins' pre-production process is a course in how to protect performance at the script stage, and it is worth breaking down in specific terms because it is unusually documented and unusually replicable. What Jenkins does in the weeks before principal photography — with his cast, with his DP James Laxton, with his editor Joi McMillon — is more disciplined than most contemporary American directors, and the results on screen are the direct product of that discipline.

The most-cited part of his method is the actor-DP rehearsal. Jenkins runs full-length rehearsals of scenes before shooting begins, with Laxton in the room, and uses those rehearsals to determine both blocking and lighting in a single pass. That collapses two decisions that are usually made separately, and it means the camera is composed for the specific way the actors have inhabited the scene rather than for a generic version of it. The result is a distinctive kind of tenderness in the coverage.

The second piece is the editor as pre-production presence. McMillon is involved in scene-level decisions before shooting, which means the coverage list on each scene is designed around the cut Jenkins already imagines. That inverts the standard American workflow, where the editor discovers the film after principal photography and works with whatever coverage the director thought to shoot. Jenkins' method sacrifices some coverage flexibility for a much stronger sense of the film's rhythm going into the edit.

The third piece is the score integration. Nicholas Britell scores to picture, but Jenkins consults with him on the tonal register of scenes during pre-production, which means the music has been thought about before the shooting begins rather than added at the end. This is not unique to Jenkins, but it is unusually consistent in his practice, and it accounts for some of the tonal precision of his films.

The critique of the Jenkins method is that it is expensive in time and requires unusually generous collaborators, and that most directors do not have the industry standing to demand the pre-production runway he gets. Fair enough. But the method is not, in principle, restricted to his budget level, and younger filmmakers who have adopted even parts of it — the actor-DP rehearsal in particular — have produced noticeably stronger first features than they would have without. Method is transferable when it is broken down honestly. Jenkins deserves credit for how much of his he has made public.`,
    },
    {
      title: "Ava DuVernay's ARRAY blueprint",
      slug: "ava-duvernays-array-blueprint",
      excerpt: "The Selma director has spent a decade building a distribution and production infrastructure that could outlast her own filmography.",
      tags: ["profile", "commentary"],
      heroTags: ["spotlight", "creator"],
      body: `Ava DuVernay's individual filmography — Selma, When They See Us, Origin — would be enough to justify her reputation. What arguably matters more, in the long run, is ARRAY: the production and distribution company she has been building for over a decade, which now operates as one of the most important independent infrastructure projects in American cinema. ARRAY exists because DuVernay recognised that a career of individual film wins was insufficient to change the industry conditions those wins were fighting against.

The distribution logic of ARRAY is worth understanding. The company operates a curated release calendar for films by Black filmmakers, women of colour, and other under-distributed voices, and provides the marketing, publicity and theatrical booking infrastructure that these films would otherwise have to build individually. That infrastructure is expensive to run and it does not scale like a traditional distributor, but it fills a specific gap the majors have consistently refused to fill.

The production side has grown alongside the distribution. ARRAY has produced or co-produced a growing slate of features and series, with a specific interest in first-time directors and non-standard forms. The batting average on this side of the operation is inevitably mixed — first features are always mixed — but the range of what has been made under the ARRAY banner is broader than any comparable American label of the last decade.

The critique of ARRAY as a model is that it depends heavily on DuVernay's personal reputation and Warner Bros. relationship, and that a similar infrastructure would be difficult for a next-generation founder to replicate without her specific industry standing. There is truth to this. ARRAY is unusually founder-dependent, and its long-term sustainability is a live question. DuVernay has been publicly working on succession planning, but the model is not obviously replicable at scale.

What ARRAY has demonstrated, more than any individual film, is that independent distribution infrastructure for under-represented cinema is possible in the American market with sufficient founder commitment and industry relationships. That is a proof point that will shape how the next generation of filmmakers thinks about institutional building, and it is a legacy contribution independent of any individual film DuVernay makes. The next Ava DuVernay will not be a director. She will be an infrastructure builder. And she will be operating in a landscape ARRAY partly cleared.`,
    },
    {
      title: "Steve McQueen's photographic eye",
      slug: "steve-mcqueens-photographic-eye",
      excerpt: "The 12 Years a Slave director's background in visual art has produced one of the most controlled directorial eyes in contemporary cinema.",
      tags: ["profile", "analysis"],
      heroTags: ["spotlight", "film"],
      body: `Steve McQueen came to cinema from visual art, and the discipline of his background has produced one of the most controlled directorial eyes in contemporary cinema. His films — Hunger, Shame, 12 Years a Slave, Widows, Small Axe, Blitz — are all recognisably his in a way that few other contemporary directors' work is, and the recognisability is not a matter of style so much as of visual argument. Every McQueen frame is doing specific compositional work.

The most famous example is still the twelve-minute unbroken shot in Hunger — Michael Fassbender and Liam Cunningham in conversation, camera static, the audience asked to sit inside the scene for as long as it lasts. That shot became a technical reference point, but it is worth remembering that the more interesting decision was not the length of the take but the willingness to sit with the argument the scene was making. McQueen's cinema is composed for argument, not for pace.

Small Axe is arguably the most sustained example of that method. Each of the five films uses a specific visual register to argue for a specific piece of the West Indian British experience — Lovers Rock is composed almost entirely as light and movement, while Mangrove is composed for institutional weight, and Alex Wheatle for the interior of a specific room. That McQueen produced all five in a single production cycle, at that level of visual variety, is a compositional achievement without an obvious peer.

The critique of McQueen's work is a fair one about emotional register. His films are often held at a specific analytical distance from their material, and audiences who want the immersive emotional access that mainstream drama provides sometimes find his cinema cold. That is a real critique, and McQueen has occasionally addressed it in his more recent work — Small Axe and Blitz are both warmer than the earlier features — but the analytical distance is a feature of his practice rather than a bug.

What McQueen's cinema demonstrates, and what the industry has been slow to fully credit, is that a director trained in visual art can bring a specific kind of compositional literacy that cinema-only directors sometimes lack. That is not an argument for visual-art training as a route into directing — most visual artists do not become directors — but it is an argument for taking the compositional side of the craft as seriously as McQueen does. The next generation of directors would benefit from watching his shot lists as carefully as they watch his films.`,
    },
    {
      title: "Chloé Zhao's Marvel detour and what came after",
      slug: "chloe-zhaos-marvel-detour-and-what-came-after",
      excerpt: "Eternals was a bad fit for her method — and the correction has produced the strongest film of her career.",
      tags: ["profile", "analysis"],
      heroTags: ["spotlight", "creator"],
      body: `Chloé Zhao's Marvel detour — Eternals in 2021 — has been extensively discussed in the industry press, mostly in terms of the film's mixed reception. The more interesting story is the correction that followed. Zhao spent the two years after Eternals rebuilding the working practice that had produced Nomadland and Rider, and the film she has just released is the strongest work of her career. The Marvel experiment was, in retrospect, a survivable mistake and a clarifying one.

The problem with Eternals was structural, not talent-related. Zhao's method depends on long pre-production periods with non-professional cast, extensive location work, and a script that leaves room for improvisation during shooting. A Marvel production runs on tight schedules, professional casts, controlled environments, and scripts that are effectively locked before principal photography. The two working modes are not compatible, and no amount of talent bridges the gap when the incompatibility is at that structural level.

The correction Zhao made after Eternals was to return to first principles. The new film is shot in the American Southwest with non-professional cast, extensive pre-production location work, and a script that visibly changed during shooting. The result is not a copy of Nomadland — the register is different, the ensemble is smaller, the emotional stakes are more contained — but it is unmistakably a Zhao film, and it is a better one than either of her earlier features.

The critique that could be made of Zhao's correction is that it is essentially a retreat, and that the strong artist should have been able to make her method work at the Marvel scale rather than returning to the independent register. That critique is glib. Some methods do not scale, and part of directorial maturity is recognising which of your working practices are essential to the outcome and which are contingent. Zhao seems to have made that recognition and acted on it.

The larger lesson for younger directors is one Hollywood has been reluctant to teach: not every commission is a good fit, and the willingness to say no is arguably as important as the willingness to say yes. Zhao's Marvel commission was a rational decision at the time — the industry offered her a franchise-level platform after Nomadland's Best Picture win — and its outcome was not obviously predictable in advance. What she did after is what matters, and the answer is a career worth watching for the next twenty years.`,
    },
  ],
  documentary: [
    {
      title: "The Fela documentary that never was",
      slug: "the-fela-documentary-that-never-was",
      excerpt: "Three attempts, three collapsed productions — and a set of unresolved rights issues that have kept the definitive Fela film unmade.",
      tags: ["documentary-tag", "profile"],
      heroTags: ["documentary", "spotlight"],
      body: `The definitive documentary on Fela Kuti has been attempted at least three times in the last decade, and none of the productions has reached completion. The reasons vary — one collapsed over rights, one over creative control, one over financing — but the pattern is consistent enough to be worth naming: making a Fela documentary is unusually hard, and the difficulty is not primarily creative. It is structural.

The rights problem is the most consistent obstacle. Fela's catalogue is administratively complex, the estate has different priorities than various producers, and the archival footage sits across several institutions with competing interests. Any documentary that wants to use the actual Fela performances — which is any serious documentary — has to negotiate a multi-party rights clearance that has proved impossible to close on the terms most productions can afford. That is a fixable problem in principle. It has been unfixable in practice.

The creative control problem is nearly as consistent. Fela's family has been actively involved in every serious documentary attempt, and the family's editorial preferences have not aligned with the producers' editorial ambitions in any of the three productions that got close to completion. That is not a criticism of the family — they have a legitimate stake in how Fela is represented — but it does mean that the documentary that would be most editorially rigorous is not the documentary the family is most likely to sign off on.

The counter case, sometimes made in trade coverage, is that the definitive Fela documentary is unnecessary because the existing coverage — Kuti-family authored, archival compilation, and academic — is sufficient. That case is weak. Documentary at the level Fela deserves would engage his politics, his musicianship, and his complicated personal legacy with the seriousness that his cultural importance demands, and none of the existing coverage does all three simultaneously.

What is likely to move the situation forward is not another producer trying to bridge the rights and family gaps in a single production. It is a smaller, less ambitious documentary that establishes trust with the estate over a two-to-three-year working relationship, and only then tackles the definitive version. Documentary infrastructure is often built through smaller collaborations before the flagship project becomes possible. The Fela film that eventually gets made will probably come from that path, not from another headline-grabbing pitch.`,
    },
    {
      title: "Making of Last Flight to Abuja",
      slug: "making-of-last-flight-to-abuja",
      excerpt: "The behind-the-scenes documentary on Obi Emelonye's crash drama is a rare look at Nigerian genre production at scale.",
      tags: ["documentary-tag", "behind-the-scenes"],
      heroTags: ["documentary", "behind-the-scenes"],
      body: `The behind-the-scenes documentary on Obi Emelonye's Last Flight to Abuja is one of the few pieces of Nigerian production journalism that has been made about a Nigerian genre film at scale, and it is worth studying as much for what it reveals about Nigerian genre production practice as for what it reveals about the film itself. The documentary was produced with the co-operation of the Emelonye team and released alongside the film's home-video window.

The production challenge Last Flight to Abuja set itself was ambitious. A commercial-aviation thriller requires either significant VFX budget or physical mock-up capacity, and the Nigerian industry at the time had access to neither at the scale a Hollywood production would take for granted. The documentary shows the Emelonye team improvising both — a combination of practical set construction, digital compositing done on limited budget, and location work at Lagos airport that required negotiations no American production would have to make.

The craft compromises are visible in the finished film, and the documentary is honest about them. Some of the VFX shots do not hold up to close scrutiny; some of the physical rig work is more visible than a larger budget would have allowed. But the documentary is arguably more valuable for showing those compromises than it would be for hiding them, because it demonstrates the actual conditions under which Nigerian genre film has been produced and the specific problems the next generation of Nigerian producers will have to solve.

The critique of the Last Flight documentary is a fair one about editorial distance. The film's producers were involved in the making of the behind-the-scenes coverage, which means the tonal register is more promotional than a fully independent production journalism piece would be. Fair enough. That is a common constraint of making-of documentaries generally, and it does not fully undermine the informational value of the coverage.

What the documentary demonstrates, more than anything, is the case for a broader tradition of Nigerian production journalism — the making-of documentaries, the archival oral histories, the departmental studies that in Hollywood would be routine and in Nollywood are rare. Nigerian cinema has been under-covered by its own industry press for decades, and a stronger tradition of production journalism would produce a documentary infrastructure that would benefit the industry's institutional memory. The Last Flight documentary is an early example. There should be more.`,
    },
    {
      title: "Inside Nollywood's 2025 boom year",
      slug: "inside-nollywoods-2025-boom-year",
      excerpt: "A verité-style feature documentary follows three Lagos production companies through the industry's most productive year in a decade.",
      tags: ["documentary-tag", "featured-story"],
      heroTags: ["documentary", "spotlight"],
      body: `The verité feature documentary on Nollywood's 2025 production surge follows three Lagos-based production companies — one commercial, one prestige-oriented, and one first-time — through the industry's most productive year in a decade. The film is unusual for a Nigerian documentary in both its ambition and its access, and it will function as a durable record of a specific moment in the industry's evolution regardless of its individual box office.

The commercial production the film follows is one of the many mid-budget dramas released during 2025's boom cycle. What the documentary reveals about that production is the operational choreography of a Nigerian commercial shoot — the pre-production compressions, the on-set problem-solving, the post-production timeline that would leave American producers exhausted. The film is unsparing about the working conditions, and it does not romanticise the production culture in the way a promotional documentary would.

The prestige production is more familiar to international viewers, but the documentary provides useful context about the specific tension between commercial and prestige Nollywood — the different casts, the different budget ratios, the different distribution strategies. The film is arguably at its best when it lets that tension speak for itself rather than resolving it into a preferred category. Both traditions are legitimate. Both are producing serious work. The industry benefits from both being understood together.

The first-time production is the emotional centre of the documentary. It follows a Lagos-based writer-director attempting her first feature on independent financing, and the specific difficulties of getting a Nollywood indie made without the institutional support that commercial or prestige productions can call on. The section works because the documentary respects the first-time director's ambition without inflating it, and lets the specific problems she faces stand as evidence of what needs to change in the industry's development infrastructure.

The critique of the documentary is a fair one about scale. Three productions is a small sample, and the film's arguments about the boom year would land more strongly with a broader case-study base. The counter case is that verité coverage of the depth the documentary provides is expensive, and that a broader sample would have produced shallower coverage. Both are fair. What the documentary does demonstrate, at the depth it commits to, is that a Nigerian production journalism tradition is possible. The next generation of these documentaries will be better still.`,
    },
    {
      title: "A24's non-fiction slate",
      slug: "a24s-non-fiction-slate",
      excerpt: "The distributor's growing documentary programme is quietly among the most interesting non-fiction commissioning in American cinema.",
      tags: ["documentary-tag", "analysis"],
      heroTags: ["documentary", "film"],
      body: `A24 has been building a documentary slate over the last five years that is arguably the most interesting non-fiction programme in American cinema, and the industry has been slow to notice. The company's documentaries — including recent titles on subjects ranging from music biography to sports culture to visual art — share a set of production values and editorial ambitions that mark them out from the streamer documentary boom that has dominated the last decade.

The most consistent feature of the slate is authorial voice. A24's documentaries are almost always director-driven in a way that most streamer documentary commissioning is not. Where Netflix and Amazon's non-fiction slates lean heavily on subject-driven docuseries — the interesting person or the interesting story is the pitch, and the director is essentially a hired hand — A24's slate leans on directorial reputation. The film is being commissioned because a specific director is going to make it, and the subject is chosen partly to serve the director's practice.

The second consistent feature is theatrical intent. A24 releases most of its documentaries theatrically first, with a real marketing spend and a genuine cinema-first strategy. That is unusual in an era when most documentaries go straight to streaming or receive a token theatrical window for awards eligibility. The theatrical-first strategy costs money, and it produces documentaries that are composed for cinema rather than for on-demand consumption. The difference is visible on the screen.

The third feature is form. A24 documentaries are more likely than the industry average to be formally inventive — hybrid documentaries, essay films, non-standard structures — and less likely to default to the interview-and-archive template that dominates the streamer documentary slate. That formal ambition is not always successful, and some of the individual films are more interesting as attempts than as achievements. But the ambition is consistent, and the industry benefits from having at least one significant American distributor that treats documentary form as a live artistic question.

The critique of the A24 documentary slate is a fair one about scale. The company releases a smaller number of documentaries than any of the streamers, and its cultural footprint in non-fiction is smaller than its footprint in feature drama. Both observations are true. But the slate is the most consistently interesting documentary commissioning in American film currently, and it is a proof point that theatrical-first non-fiction is still viable if the commissioning is disciplined. That proof point deserves more industry attention than it has received.`,
    },
    {
      title: "The Sundance doc that keeps winning at AMVCA",
      slug: "the-sundance-doc-that-keeps-winning-at-amvca",
      excerpt: "A Kenyan documentary premiered at Sundance and won at AMVCA is quietly rewriting how African non-fiction reaches international audiences.",
      tags: ["documentary-tag", "events-tag"],
      heroTags: ["documentary", "events"],
      body: `A specific Kenyan documentary — premiered at Sundance last year, subsequently a repeated winner at the Africa Magic Viewers Choice Awards — has become an important case study in how African non-fiction can reach international audiences without losing its domestic recognition. The film's dual trajectory, from a specialised American festival to a mass-audience African awards ceremony, is unusually clean, and the industry should study what enabled it.

The Sundance premiere gave the film international critical attention and a Netflix acquisition offer. The AMVCA wins gave it Nigerian and pan-African audience validation. Most African documentaries win one or the other, not both — the films that translate to Sundance often struggle at AMVCA and vice versa, and the reasons are usually about editorial register, subject choice, and the specific tone that different audiences reward. The Kenyan documentary managed both, and the way it did so is instructive.

The subject choice was strategic. The film is about a Kenyan family running a small business — a subject that reads as social realism to a Sundance jury and as domestic drama to an AMVCA audience. That dual legibility was not accidental. The director has spoken in interviews about deliberately choosing a subject that could be read in both registers, and the editorial work in post-production reinforced that dual read rather than resolving it toward one audience.

The formal approach was similarly disciplined. The documentary uses a verité base with occasional archival cutaways, which is a form that both Sundance and AMVCA jurors read as serious. The film avoided the essayistic tendencies that would have alienated the AMVCA audience and avoided the melodramatic tendencies that would have alienated the Sundance jury. That is a narrow editorial path to walk, and the film's success at walking it is the more interesting story than either individual award.

The critique that could be made of the dual-audience strategy is that it produces films optimised for legibility rather than for the strongest individual artistic vision. There is something to this. But it is also true that African documentary has historically been under-served by both audiences, and a film that reaches both is doing infrastructural work for the entire regional industry regardless of whether it is the strongest individual film of its year. The Kenyan documentary is a proof point. It should not be the last.`,
    },
    {
      title: "Verité comes back around",
      slug: "verite-comes-back-around",
      excerpt: "The observational documentary tradition has quietly returned as the dominant serious form after a decade of essayistic experimentation.",
      tags: ["documentary-tag", "analysis"],
      heroTags: ["documentary"],
      body: `The observational documentary tradition — verité, direct cinema, the fly-on-the-wall style associated with Frederick Wiseman, the Maysles brothers, and D.A. Pennebaker — has quietly become the dominant serious documentary form again after a decade in which essayistic and hybrid forms received most of the critical attention. The return is worth noticing, because it suggests something about what audiences want from documentary in an era of ambient information saturation.

The essayistic documentary — the director speaking directly to camera or in voiceover, the subject treated as an occasion for the director's argument — was the dominant serious form for most of the last decade, and it produced some of the best documentaries of the period. Kirsten Johnson's Cameraperson, RaMell Ross's Hale County This Morning This Evening, Ari Folman's Waltz with Bashir. Those films are legitimately great, and the essayistic tradition remains a live artistic option.

But verité has been quietly returning. Frederick Wiseman is now ninety-five and still working, and his most recent films are among the most-discussed documentaries of their release years. Younger directors are working in the mode more consistently than they were a decade ago, and the industry press has begun to notice. The reason is not that essayistic documentary has failed. It is that verité offers something the essayistic form does not: the specific pleasure of watching real people do real things without the mediation of a directorial voice.

That pleasure is scarce in the current media environment. Most of the audio-visual content the audience is exposed to — social media, streaming drama, algorithmic short-form — is mediated, edited for reaction, and structured around explicit narrative. Verité offers, unusually, a form that respects the audience's ability to draw its own conclusions from unmediated observation. That respect is not fashionable currently, and part of why verité is returning is that its unfashionability is itself the point.

The critique of verité is the same one it has always faced — that the appearance of unmediated observation is itself a construction, and that the director's editorial voice is present in the framing, the editing, and the selection of what to shoot. All of that is true. Verité is not innocent of authorship. But the tradition's specific formal discipline — the willingness to sit with the observation and not to intervene — produces a documentary form that respects the subject in ways the essayistic form does not always match. The return is welcome.`,
    },
    {
      title: "Sports docs after the streamers",
      slug: "sports-docs-after-the-streamers",
      excerpt: "Formula 1: Drive to Survive changed how sports were documented — and the format has aged faster than the industry expected.",
      tags: ["documentary-tag", "commentary"],
      heroTags: ["documentary"],
      body: `Netflix's Formula 1: Drive to Survive was, briefly, the most important sports documentary of the last decade. It transformed how Formula 1 was consumed by American audiences, drove a genuine audience surge for the sport, and produced a template that has been widely copied. The format is now everywhere — tennis, golf, football, rugby, cricket — and it is aging faster than the industry expected. The lessons from that aging curve are worth attending to.

The template's power came from access. Netflix negotiated levels of behind-the-scenes access to Formula 1 that traditional sports journalism has never had, and the resulting footage — team principals arguing, drivers negotiating contracts, engineers debugging race strategy — showed the sport in a register the audience had not previously seen. That access was the product, and it produced compelling storytelling almost regardless of what the editorial team did with it.

The problem the template ran into is that access, once granted, is not indefinitely renewable at the same level. Formula 1 teams became more media-trained with each season, the compelling personal conflicts got harder to capture, and the show's editorial team was increasingly forced to invent or exaggerate tension that had once been observable in the raw material. The formats that copied Drive to Survive have run into the same problem faster than Drive to Survive did, because the sports and athletes they cover learned the lessons from Formula 1's example.

The counter case is that the sports documentary format remains commercially valuable even at reduced access levels, and that the industry has adjusted expectations rather than abandoning the format. There is some truth to this. Streaming subscribers still watch these shows. But the audience appreciation numbers are declining, and the format's cultural relevance is smaller than it was three years ago. The return on investment is smaller. The next generation of sports documentaries will need to find another lever.

The lesson is a specific one about access-driven formats generally: they work spectacularly well the first time, less well the second, and are diminishing returns from the third onward. Access is not a durable competitive advantage. What is durable is editorial craft, and the sports documentaries that will survive the next five years are the ones that treat access as a starting point rather than as the product itself. The next Drive to Survive will not be another access documentary. It will be a formally inventive sports film that treats the sport as an occasion for real cinematic argument.`,
    },
    {
      title: "Environmental docs and access",
      slug: "environmental-docs-and-access",
      excerpt: "The best environmental documentaries of the last five years have quietly rewritten how researchers grant filming access to sensitive subjects.",
      tags: ["documentary-tag", "analysis"],
      heroTags: ["documentary"],
      body: `The most interesting recent environmental documentaries have quietly changed the working relationship between filmmakers and the researchers whose work provides the films' subject matter. The old model — filmmakers as external observers, researchers as sources — has been giving way to a model closer to collaborative production, in which the researcher has significant editorial input and the filmmaker has significant field time. The results are documentaries that are both scientifically rigorous and emotionally resonant in ways the older model rarely produced.

The clearest example is a specific documentary released last year that spent three years embedded with a marine biology team studying reef ecosystems in the Indian Ocean. The film's access to the science was possible only because the biologists had significant editorial input, and the biologists agreed to the editorial input because the filmmakers were willing to spend the three years actually understanding the science. That reciprocal commitment produced a documentary that neither party could have made alone.

The pattern is not confined to marine biology. Recent documentaries on forest fire ecology, on Arctic ice loss, on migratory bird populations have all involved similar reciprocal working relationships, and the films have been noticeably stronger than the previous generation of environmental documentary as a result. The old model — the filmmaker parachutes in for a two-week shoot, the science is summarised by voiceover, the researchers are used as talking heads — is not dead, but it is producing weaker documentaries than the collaborative model.

The critique of the collaborative model is a fair one about editorial independence. When the researcher has editorial input, the film's ability to critically engage the science is reduced, and the potential for the film to become a promotional vehicle for the research is real. That is a legitimate concern, and the best examples of the collaborative model manage the concern by locking in editorial roles in writing before principal photography, with clear boundaries about what the researcher can and cannot influence.

What the collaborative model demonstrates, more broadly, is that documentary access is best treated as a relationship rather than as a transaction. That has always been true in principle. What is new is the willingness of both filmmakers and researchers to actually structure their working relationships that way, and the resulting documentaries are the most useful environmental journalism the medium has produced in decades. Expect the model to spread beyond environmental documentary within five years. The next generation of health-care documentaries, in particular, is likely to look similar.`,
    },
    {
      title: "War-reporting and consent",
      slug: "war-reporting-and-consent",
      excerpt: "Documentary war-reporting has been quietly rewriting its consent protocols — and the results are visible on screen.",
      tags: ["documentary-tag", "commentary"],
      heroTags: ["documentary", "news"],
      body: `Documentary war-reporting has been quietly rewriting its consent protocols over the last five years, and the results are visible on screen in ways that the general documentary audience has been slow to notice. The old model — filmmakers arriving in a conflict zone, capturing what they can, releasing the footage on the assumption that the emergency of the war overrides normal consent standards — has been giving way to a model closer to the ethical practice of trauma-informed journalism.

The clearest recent examples are the documentaries out of Ukraine and Sudan. Both conflicts have produced documentary work of unusual craft, and the films have been notably more careful about consent than similar documentaries from earlier conflicts were. Subjects are identified by name only when they have explicitly consented; identifying information is withheld when subjects are at ongoing risk; footage of injury and death is used with a specific editorial argument for its necessity rather than for its shock value. Those choices are visible in the finished films.

The change is not universal. Some recent conflict documentaries continue the older model, and the industry press is often uncritical of the ethical shortcuts. But the best of the recent work — including two documentaries that have been nominated for major festival prizes this year — demonstrates that a more careful consent practice is compatible with journalistic rigour and, arguably, produces more journalistically credible work.

The counter case is a fair one about journalistic urgency. Conflict documentation cannot always wait for the consent protocols that peace-time documentary can afford, and rigorous adherence to consent standards can mean the most important footage does not get captured or does not get used. That is a real tension, and the ethical documentary practice is one of ongoing judgment rather than fixed rules. The best filmmakers make those judgments explicit in the film itself rather than pretending the judgments were not made.

What the consent conversation demonstrates, more broadly, is that documentary practice is evolving in ways that most of its audience does not track closely. The films that get made under the new consent protocols look different from the films that got made under the old ones, and the industry's growing willingness to discuss the differences — in trade press, in film school curricula, in the panels at major festivals — is a healthy development. The next generation of documentary war-reporting will be more ethical than the last one, and it will be better journalism for it.`,
    },
    {
      title: "The new personal-essay documentary",
      slug: "the-new-personal-essay-documentary",
      excerpt: "First-person essayistic documentary has become the most-copied form of the last five years — and its imitators are starting to expose the form's limits.",
      tags: ["documentary-tag", "analysis"],
      heroTags: ["documentary", "opinion"],
      body: `The first-person essayistic documentary — the director as narrator, the subject as occasion for autobiographical reflection, the form as personal excavation — has been the most-copied documentary mode of the last five years, and its imitators are starting to expose the form's limits. What Sarah Polley's Stories We Tell and Kirsten Johnson's Cameraperson demonstrated as a form has been widely adopted, sometimes brilliantly and sometimes as a shortcut around the harder work of documentary craft.

The best examples still work. Ross Kauffman and Katy Chevigny's continuing work in the essayistic register produces documentaries that respect the form's specific demands — the director has to be interesting enough to justify sustained attention, the personal material has to earn its inclusion, and the reflection has to be rigorous enough to survive the audience's skepticism. The form is unforgiving. Bad essayistic documentary is unusually painful to watch. Good essayistic documentary is unusually rewarding.

The problem with the imitators is that the essayistic form has become the default for a certain kind of arthouse documentary regardless of whether the individual film requires it. Directors who would previously have made observational documentaries about their subjects are now making essayistic documentaries about themselves-in-relation-to-their-subjects, and the resulting films are often about the director when they should be about the subject. That is a specific artistic failure, and the industry has been slow to name it because the form is fashionable.

The counter case is that the essayistic mode is a legitimate response to a specific historical moment — the erosion of confident authorial voice in journalism, the rise of first-person writing across cultural criticism, the growing awareness that documentary has never been the neutral observer it presented itself as. All of that is true. The essayistic documentary is a legitimate reckoning with those developments, and its rise is not simply fashion.

What documentary criticism should be pushing back against is not the essayistic mode as such but the assumption that first-person is always more honest than third-person, and that observation is always more suspect than reflection. Those assumptions have become critical defaults, and they produce readings of essayistic documentaries that are systematically more generous than the same critics would apply to observational work. That double standard is not defensible, and the next generation of documentary criticism should abandon it. The best essayistic documentaries deserve their reputation. The imitators do not.`,
    },
  ],
  events: [
    {
      title: "TIFF's African Cinema Pavilion",
      slug: "tiffs-african-cinema-pavilion",
      excerpt: "Toronto's new permanent pavilion is the most concrete institutional commitment to African cinema any major festival has yet made.",
      tags: ["events-tag", "featured-story"],
      heroTags: ["events", "spotlight"],
      body: `The Toronto International Film Festival's new permanent African Cinema Pavilion is the most concrete institutional commitment to African cinema any of the major international festivals has yet made, and it deserves closer attention than the initial trade coverage has given it. What TIFF has built is not simply a marketing venue but a year-round infrastructure for the industry, and its ambitions are large enough that its long-term impact will exceed any individual year's programming.

The pavilion's operational scope is broader than a traditional festival tent. During the September window it functions as an industry venue — sales meetings, buyer-seller introductions, translation services, and formal panel programming. Outside the September window it will host a smaller programme of industry-focused events, including a mentorship track for early-career African directors and a co-production financing programme aimed at connecting African production companies to European and North American finance.

The programming curation for the September edition is unusually strong. Four Nigerian features are in the official festival selection, three of which will use the pavilion for their industry activities. Two Kenyan features are on the slate. A Senegalese short is in competition. That density of African programming is higher than TIFF has ever had, and the pavilion's presence has clearly influenced what was accepted into the broader festival slate rather than existing as a separate track.

The critique of the pavilion is a fair one about location. Toronto is expensive to travel to from most African production hubs, and the pavilion's utility is bounded by which African producers can afford to attend. The festival has been publicly committed to a travel-support programme that partially addresses this, but the programme is smaller than the need, and the pavilion's impact will be uneven across the continent's various production industries. That unevenness is a real limit.

What the pavilion demonstrates, more than any specific outcome, is that a serious festival institution has been willing to make a durable financial and programming commitment to African cinema. That commitment is a proof point for the other major festivals, and it changes the leverage African producers have in their conversations with Cannes, Berlinale, and Sundance. Whether TIFF's example is followed will be one of the more consequential open questions for African cinema over the next five years. The industry should push for it, hard.`,
    },
    {
      title: "AMVCA 2026 wrap",
      slug: "amvca-2026-wrap",
      excerpt: "This year's Africa Magic Viewers' Choice Awards confirmed the direction of Nigerian television and produced a few unexpected wins.",
      tags: ["events-tag", "television"],
      heroTags: ["events", "tv"],
      body: `The 2026 Africa Magic Viewers' Choice Awards wrapped last weekend with a ceremony that broadly confirmed the direction Nigerian television has been moving in for the last two years, and produced a small number of unexpected wins that will shape the next year's commissioning. The event itself was Nigeria's largest awards ceremony by attendance and voter participation, and the results deserve closer attention than the initial red-carpet coverage has provided.

The Best Drama winner is worth naming. The Netflix Naija series that took the top prize was a limited series with an unusually small ensemble and a formally ambitious structure — closer to a British four-episode limited series than to the traditional Nollywood commercial format. That the AMVCA audience voted for a formally ambitious project over the more commercially familiar competition suggests something about how Nigerian television audiences are being educated by the new prestige commissioning cycle.

The Best Actress win was less expected. The award went to a first-time lead in a role that most industry observers considered a supporting part, and the win reflects an unusually intense audience response to a specific piece of acting rather than the standard institutional voting patterns. That is exactly the kind of result the AMVCA structure is designed to produce, and it is a healthy corrective to the tendency of most awards systems to reward name recognition over specific performance.

The critique that could be made of the ceremony is a fair one about the awards' international recognition. AMVCA remains under-covered in the international trade press, and the wins have historically not translated into international distribution attention at the rate the quality of the winners would justify. That is a structural gap the awards themselves cannot close alone, but it is one the Nigerian industry should be pushing to close through relationships with the major festivals and the streaming platforms.

What the 2026 ceremony demonstrated, more than any specific win, is that Nigerian television has matured to the point where a major awards ceremony can reward formally ambitious work without the audience punishing the choice. That is a specific institutional achievement, and it changes what the industry can commission for next year. Watch what gets greenlit at Africa Magic and Netflix Naija over the next six months. The AMVCA winners will be the reference point.`,
    },
    {
      title: "AFRIFF opens Lagos",
      slug: "afriff-opens-lagos",
      excerpt: "The Africa International Film Festival returned to Lagos with its largest slate ever — and its most confident opening night in a decade.",
      tags: ["events-tag", "featured-story"],
      heroTags: ["events", "spotlight"],
      body: `The Africa International Film Festival returned to Lagos this month with its largest slate in the festival's history, and an opening night that felt more institutionally confident than any AFRIFF opening in the last decade. The festival's programming this year was unusually well-curated, its industry activities were unusually well-attended, and the audience response was unusually strong. Something has changed in AFRIFF's operational depth, and it is worth naming.

The slate is the most visible piece. AFRIFF's 2026 programme included forty-two features, sixty-three short films, and a documentary strand that would have anchored a smaller festival on its own. The Nigerian titles were unusually strong. The pan-African selection was unusually broad. And the international selection — historically the weakest part of AFRIFF's programming — was noticeably better curated than in previous years, with genuine international arthouse work rather than the second-tier festival leftovers the earlier editions relied on.

The industry activities were the more consequential piece. AFRIFF's producer-buyer programme has been growing quietly for three years, and this year it hit a scale where the meeting activity was comparable to what a smaller European festival would produce. Sales agents from Cannes, Berlinale and Rotterdam were in Lagos for the week, and the number of first-look deals announced during and after the festival was the highest in AFRIFF's history. That is a real institutional achievement.

The critique of the festival is a fair one about consistency. AFRIFF has had strong years before, and it has had years where the operational depth did not survive from one edition to the next. The pattern has been alarming enough that the trade coverage of even the strong years has been cautious. That caution is a reasonable response to the previous inconsistency, and the festival's leadership is publicly aware of the sustainability question. Whether this edition's depth carries over into next year's is the question that matters most.

What the 2026 AFRIFF demonstrated, more broadly, is that a serious pan-African film festival based in Lagos is possible at institutional scale, and that the industry infrastructure that supports it is stronger than the previous decade of trade coverage would have suggested. That is a proof point for the Nigerian film industry regardless of what happens to AFRIFF specifically over the next few years. The festival ecosystem is now larger than any single festival, and the wider health of the ecosystem is what actually matters. Watch what comes next.`,
    },
    {
      title: "Cannes 2026 opening night",
      slug: "cannes-2026-opening-night",
      excerpt: "The festival's opening film set an unusually strong tone — and the industry response revealed something about how buyers are approaching the year.",
      tags: ["events-tag", "news-tag"],
      heroTags: ["events", "film"],
      body: `Cannes 2026 opened with a film that set an unusually strong tone for the festival, and the industry response over the following seventy-two hours revealed something about how international buyers are approaching this year's market. The opening night selection has historically been more ceremonial than programming-consequential, but the 2026 choice was different, and its consequences shaped the first week of the festival more than most opening films do.

The film itself — a French-Senegalese co-production from a director whose previous work had been well-received but not commercially prominent — earned strong critical response from the American and European trade press, and the sales activity around comparable titles picked up meaningfully in the days that followed. That is a specific market signal. A strong opening film shifts the risk appetite of the buyers who arrive with the festival's first days, and the resulting activity is often more consequential than the direct sales for the opening title itself.

The other consequence of the opening night was the framing it provided for the international press coverage of the festival. Trade journalists arrive at Cannes with a set of predictions about what the festival will demonstrate, and the opening film is one of the largest inputs into those predictions. The 2026 opening framed the festival as a strong year for African and Francophone cinema in ways that shaped the subsequent coverage of unrelated films.

The critique that could be made of the opening night selection is the fair one about programming risk. Choosing a formally ambitious opening film is a bet that the festival's international press will engage with the ambition rather than dismissing it, and the bet is not always won. This year's bet was won, but the risk was real, and Cannes has been publicly cautious about repeating the strategy in years when the field of candidates is weaker.

What the 2026 opening demonstrated, more broadly, is that Cannes' curatorial preferences are shifting in ways that have not been fully articulated in the festival's programming statements. African, Francophone, and Global South cinema is being programmed at a higher volume and in more prominent positions than the previous decade of Cannes editions. Whether that shift is durable will be visible in next year's selection. The industry should hope it is.`,
    },
    {
      title: "Sundance dispatch — five films to watch",
      slug: "sundance-dispatch-five-films-to-watch",
      excerpt: "The 2026 Sundance selection produced an unusually strong mid-week discovery slate — five films from the middle of the festival worth tracking.",
      tags: ["events-tag", "review"],
      heroTags: ["events", "film"],
      body: `The 2026 Sundance selection produced an unusually strong mid-week discovery slate, and five films from the middle of the festival deserve tracking through the year regardless of what happens with the awards. The mid-week slot at Sundance is historically where the more formally ambitious work sits, and this year's cohort is stronger than any of the mid-week slots in the last three editions.

The strongest of the five is a debut feature from a Sudanese director working in the American independent tradition, which combines a formal precision usually associated with older directors with a specific tonal register that reads as unmistakably contemporary. The film is short — ninety-eight minutes — and the ninety-eight minutes are unusually well-composed. Expect it to travel widely on the festival circuit through the fall, and to find a distributor before the summer.

The second is an American documentary on a subject that has been extensively covered — the opioid crisis — that manages to say something new by refusing the essayistic form and staying with observational verité throughout. The film's specific ethical care with its subjects is visible on screen, and the resulting documentary is more emotionally durable than the more essayistic recent coverage of the same subject. Watch for it in the documentary categories at the fall festivals.

The third is a Nigerian first feature — a domestic drama set in a specific Lagos neighbourhood — that arrived in Park City with no distribution and left with two offers on the table. The film's craft is unusually strong for a first feature, and its specific cultural specificity is exactly the kind of textural detail the international festival circuit has been increasingly attentive to. Expect it at TIFF in September and at the pan-African festivals through the winter.

The fourth is a formally experimental essay-documentary from a Chilean director, and the fifth is a hybrid narrative-documentary feature from a French filmmaker working in Lagos. Both are more difficult sells commercially than the first three, and both will need patient distribution partners if their festival attention is to translate into anything durable. Both are, however, the kind of films that Sundance exists to bring international attention to, and their presence on the mid-week slate is exactly the reason Sundance still matters. Watch all five.`,
    },
    {
      title: "New York African Film Festival highlights",
      slug: "new-york-african-film-festival-highlights",
      excerpt: "The 2026 edition of NYAFF confirmed the festival's renewed programming ambition and produced two genuine discoveries.",
      tags: ["events-tag", "review"],
      heroTags: ["events", "spotlight"],
      body: `The New York African Film Festival's 2026 edition confirmed the festival's renewed programming ambition after several quieter years, and produced two genuine discoveries that will travel through the international festival circuit this year. NYAFF has been rebuilding its curatorial depth for the last three years, and the current edition suggests the rebuild is now sufficiently complete to deserve broader industry attention.

The first discovery is a Kenyan short from a first-time director that manages, in twenty-two minutes, a formal precision most feature debutants do not achieve. The short's use of Nairobi as a specific location is unusual — most Kenyan cinema shot in Nairobi treats the city as backdrop rather than as compositional element — and the director's willingness to let the city shape the film's rhythms is the more interesting of the choices. Expect the short to be widely programmed through the year.

The second is a Malian feature that has been travelling quietly on the international festival circuit for six months and finally reached North American attention with its NYAFF screening. The film is not a first feature — the director has been working for a decade — but the international critical attention it has now attracted will change the distribution possibilities for the director's subsequent work. That kind of festival-driven career shift is exactly what NYAFF exists to enable.

The critique that could be made of NYAFF's programming is that its emphasis remains on the more established festival-circuit filmmakers rather than on the newer generation working outside the traditional international arthouse network. That critique has been fair in some previous editions, and it is less fair in this one. This year's slate included a meaningful proportion of first-time or second-time directors, and the balance between established and emerging voices was noticeably better calibrated than in the earlier rebuilding editions.

What NYAFF 2026 demonstrated, more broadly, is that African film festivals in the North American diaspora market are entering a stronger institutional phase than they have occupied at any point in the last decade. That strength is a specific institutional achievement, and it changes the visibility economics for African cinema in ways the industry has been slow to fully credit. Watch for the same pattern at other diasporic African festivals over the next year. The infrastructure is strengthening across multiple cities simultaneously, and that infrastructure is a durable good for the cinema.`,
    },
    {
      title: "Toronto Nollywood premiere",
      slug: "toronto-nollywood-premiere",
      excerpt: "The Nigerian feature that opened TIFF's Special Presentations slate arrived with unusual audience anticipation — and largely delivered.",
      tags: ["events-tag", "review"],
      heroTags: ["events", "film"],
      body: `The Nigerian feature that opened TIFF's Special Presentations slate arrived in Toronto with unusual audience anticipation — the pre-festival buzz through the diaspora press had been building for weeks — and largely delivered on the expectations. The film's craft was strong, its cultural specificity was intact, and its critical reception across the American and European trade press was unusually warm for a Nigerian production without prior international festival attention.

The film itself is a mid-budget drama set in Lagos, directed by a filmmaker whose previous work had been mostly domestic. The production values are visibly stronger than the director's earlier features, and the additional budget was clearly deployed toward specific craft priorities — cinematography, sound design, and post-production colour — rather than diffused across the production. That specific allocation is a maturity signal in Nigerian production practice, and it is one the industry has been slow to normalise.

The critical response is worth breaking down. The American trade press engaged the film seriously and largely on its own terms — not as an example of Nigerian cinema but as a specific film with specific craft choices — which is the register the industry has been asking for and rarely gets. The European response was similarly serious. The Nigerian trade coverage was, unusually, more cautious than the international coverage, largely because the film's slower pacing runs counter to the commercial expectations of the domestic industry.

The audience response was warmer than the critical response, and unusually so. TIFF audiences skew older, more experienced with international cinema, and more willing to engage with pacing that would test a Nigerian commercial audience. The strong audience Q&A after the premiere, and the visible engagement of the diaspora Nigerian audience with the film's specific cultural details, suggested that the international audience for Nigerian slow cinema is larger than the commercial industry has been willing to credit.

What the Toronto premiere demonstrated, more broadly, is that the specific gap between Nigerian critical expectations and international critical expectations has been narrowing, and that Nigerian mid-budget prestige cinema is now legible to international audiences without the mediation of an American co-production. That is a durable achievement, and it changes the distribution conversation for the next generation of Nigerian prestige films. Watch what gets financed on the strength of this reception. It will be a meaningful year.`,
    },
    {
      title: "London Film Festival's African slate",
      slug: "london-film-festivals-african-slate",
      excerpt: "The BFI festival's 2026 African programming was quieter than TIFF's — and in some ways more consequential.",
      tags: ["events-tag", "commentary"],
      heroTags: ["events", "spotlight"],
      body: `The BFI London Film Festival's 2026 African programming was quieter than TIFF's — smaller slate, less industry infrastructure, less trade press coverage — and in some specific respects more consequential. London has been programming African cinema more cautiously and more selectively than Toronto for several years, and the resulting selection was tighter, more curatorially argumentative, and arguably more useful for the individual films it programmed.

The eight African titles in the BFI selection this year included two Nigerian features, one Ghanaian, one Kenyan, one Malian, one Egyptian, one Moroccan, and one South African. That geographic breadth is unusual for a European festival of London's scale, and the selection's insistence on covering the continent broadly rather than concentrating on the industries with the most existing international presence is a curatorial position worth naming.

The individual films in the slate benefited from London's smaller scale in ways that TIFF's larger programming does not always allow. Each of the eight African titles received a dedicated industry screening, sustained press attention across the festival's first weekend, and follow-up meetings with British and European distributors that produced concrete outcomes for six of the eight films. Toronto's larger slate, by comparison, produced more headline coverage but often less individual follow-through.

The critique of London's approach is a fair one about ambition. The festival could programme a larger African slate, could invest in a more prominent industry venue for African cinema, and could match the specific ambition TIFF has demonstrated with its permanent pavilion. The BFI has been publicly resistant to that scale, and the reason — a preference for curatorial density over expansion — is defensible but not obviously correct.

What London 2026 demonstrated, more broadly, is that there are legitimate models for how a major European festival can programme African cinema, and that TIFF's expansive model is not the only serious option. Both approaches produce value. Both approaches have limits. The Nigerian and pan-African film industries should be pushing both festivals to strengthen their commitments in the specific ways each is best positioned to grow. The result, over five years, is a stronger international infrastructure for African cinema than either festival alone can build.`,
    },
    {
      title: "Berlinale Forum entries",
      slug: "berlinale-forum-entries",
      excerpt: "The 2026 Forum programme produced an unusually strong slate — and confirmed the section's continued centrality to formally ambitious cinema.",
      tags: ["events-tag", "analysis"],
      heroTags: ["events", "film"],
      body: `The 2026 Berlinale Forum programme produced an unusually strong slate, and confirmed the section's continued centrality to formally ambitious cinema at the major European festivals. Forum has historically been where Berlinale hosts the work that is too formally experimental for the main competition and too rigorous for the parallel sidebar programmes, and the 2026 selection illustrated exactly why the section still matters.

The strongest entry was a Filipino director's fourth feature — a formally inventive documentary-fiction hybrid — that has been building critical attention on the international festival circuit for the last six months, and finally reached the level of press engagement its craft deserves. The film's specific formal argument about how to represent memory in a colonial context is one the international critical conversation has been slow to properly engage with, and Forum's presentation gave it the platform it needed.

The other significant entry was a Nigerian short-feature hybrid — the piece runs sixty-three minutes, which is longer than most shorts and shorter than most features — that has been travelling on the international short-film circuit and has now made the leap into feature-format attention. The film's specific formal choice to occupy the middle length is not an accident; the director has spoken about wanting to force the international festival system to reconsider its rigid feature-versus-short distinction. Forum was one of the few sections that could programme it seriously, and the section's willingness to do so is exactly the reason Forum exists.

The critique of Forum has always been that its programming is too specialised for the general festival audience, and that the films it champions rarely find international distribution outside a narrow arthouse circuit. There is some truth to this. But the counter case is that the specialised audience Forum programmes for is a legitimate audience, and that the alternative — folding Forum's programming into the main competition or eliminating the section — would produce a Berlinale less useful for the international critical conversation than the current arrangement.

What Berlinale Forum 2026 demonstrated, more broadly, is that formally ambitious cinema still has an institutional home at one of the major European festivals, and that home is worth defending as the wider industry moves toward more commercially legible programming choices. The Berlinale main competition has been drifting toward mainstream prestige for several years, and Forum is one of the few sections at the major festivals still operating as a genuine curatorial argument. Long may it continue.`,
    },
    {
      title: "Locarno's Kunle Afolayan retrospective",
      slug: "locarnos-kunle-afolayan-retrospective",
      excerpt: "The Swiss festival's mid-career retrospective on Kunle Afolayan is the most serious international engagement his work has yet received.",
      tags: ["events-tag", "profile"],
      heroTags: ["events", "spotlight"],
      body: `The Locarno Film Festival's mid-career retrospective on Kunle Afolayan — five films across a week of screenings, with the director present for two Q&A sessions — is the most serious international engagement Afolayan's work has yet received, and it is arguably overdue. Locarno's decision to programme the retrospective at this specific point in his career, with the recent Anikulapo work still commercially fresh, is unusually well-timed and unusually attentive.

The programming choice within the retrospective is worth attending to. Locarno's programmers included the two early features that established Afolayan's technical ambitions, the middle-period commercial work that consolidated his industry position, and the recent slow-cinema turn that has been his most critically praised. The five-film selection is a genuine argument about the shape of his career, and it foregrounds the specific compositional discipline that runs across the work rather than treating the individual films as isolated achievements.

The critical response over the retrospective week was serious and mostly informed. European trade press coverage engaged Afolayan's technical choices rather than treating him as a representative of Nigerian cinema in general, which is the register the industry has been asking for and rarely gets. Coverage of his slow-cinema turn in particular was unusually substantive, with several long-form pieces that engaged specifically with his DP collaborations and his editing rhythms.

The critique that could be made of the retrospective is a fair one about the wider gap between critical recognition and commercial distribution. Locarno's programming will not, by itself, produce new distribution for Afolayan's back catalogue in Europe, and the retrospective is largely a critical event rather than a commercial one. That is a real limit, and Afolayan's team is publicly working with European sales agents to try to translate the critical attention into concrete distribution outcomes. Whether that translation happens is one of the meaningful open questions for his international career.

What the Locarno retrospective demonstrated, more broadly, is that the international festival system can, when it chooses, engage seriously with African auteurs on the same critical terms it applies to European or American directors of comparable achievement. That the choice is available and rarely made is the harder observation the retrospective invites. The industry should push for more of these mid-career programmes — for Afolayan, and for the other African directors whose work justifies them. Locarno has set a specific benchmark. Others should meet it.`,
    },
  ],
};

const articleIdsByCategory = {};
let globalIndex = 0;
const CATEGORY_ORDER = ["film", "tv", "news", "opinion", "spotlight", "documentary", "events"];

for (const catSlug of CATEGORY_ORDER) {
  const cat = categories[catSlug];
  if (!cat) {
    console.warn(`Skipping category ${catSlug} — not found in DB.`);
    continue;
  }
  articleIdsByCategory[catSlug] = [];
  const items = ARTICLE_DATA[catSlug] ?? [];
  for (const item of items) {
    const { title, slug, excerpt, tags, heroTags, body } = item;
    const existing = await findBySlug("articles", slug);
    if (existing) {
      console.log(`Skip article: ${slug}`);
      articleIdsByCategory[catSlug].push(existing.id);
      globalIndex++;
      continue;
    }
    const hero = pickMedia(mediaByTag, heroTags);
    const tagIds = await findTagIds(tags);
    const publishedAt = new Date(Date.now() - globalIndex * 12 * 60 * 60 * 1000).toISOString();
    const doc = await payload.create({
      collection: "articles",
      data: {
        title,
        slug,
        excerpt,
        heroImage: hero?.id,
        body: textToLexical(body),
        categories: [cat.id],
        tags: tagIds,
        status: "published",
        publishedAt,
        featured: true,
        featuredPriority: 100 - globalIndex,
      },
      overrideAccess: true,
    });
    console.log(`Created article [${catSlug} #${globalIndex}]: ${title}`);
    articleIdsByCategory[catSlug].push(doc.id);
    globalIndex++;
  }
}

/* ───────────────────────────── users ───────────────────────────── */

// Editor account for local RBAC testing.
const EDITOR_EMAIL = "adaobi.nwosu@kiribe.test";
const editorExisting = await findByEmail("users", EDITOR_EMAIL);
if (editorExisting) {
  console.log(`Skip editor: already exists (${EDITOR_EMAIL})`);
} else {
  await payload.create({
    collection: "users",
    data: {
      email: EDITOR_EMAIL,
      name: "Adaobi Nwosu",
      role: "editor",
      status: "active",
      password: "EditorPass2026!",
    },
    overrideAccess: true,
  });
  console.log(`Created editor: ${EDITOR_EMAIL} / EditorPass2026!`);
}

// Pending admin invite for the project owner. Raw token is printed once, never
// persisted — mirrors src/server/modules/users/invite-token.ts semantics.
const ADMIN_INVITE_EMAIL = "nnamaninwanne@gmail.com";
const ADMIN_INVITE_NAME = "Nwanne Nnamani";
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const rawToken = randomBytes(32).toString("hex");
const tokenHash = createHash("sha256").update(rawToken).digest("hex");
const expiresAt = new Date(Date.now() + INVITE_TTL_MS).toISOString();
const acceptUrl = `http://localhost:3000/admin/accept-invite?token=${rawToken}`;

const adminExisting = await findByEmail("users", ADMIN_INVITE_EMAIL);
let printInvite = false;
if (adminExisting && adminExisting.status === "active") {
  console.log(`Skip admin invite: already active (${ADMIN_INVITE_EMAIL})`);
} else if (adminExisting) {
  await payload.update({
    collection: "users",
    id: adminExisting.id,
    data: {
      role: "admin",
      status: "pending",
      inviteTokenHash: tokenHash,
      inviteTokenExpiresAt: expiresAt,
    },
    overrideAccess: true,
  });
  console.log(`Refreshed admin invite for existing pending user: ${ADMIN_INVITE_EMAIL}`);
  printInvite = true;
} else {
  await payload.create({
    collection: "users",
    data: {
      email: ADMIN_INVITE_EMAIL,
      name: ADMIN_INVITE_NAME,
      role: "admin",
      status: "pending",
      // Payload requires a password on create; overwritten during accept-invite.
      password: randomUUID(),
      inviteTokenHash: tokenHash,
      inviteTokenExpiresAt: expiresAt,
    },
    overrideAccess: true,
  });
  console.log(`Created pending admin invite: ${ADMIN_INVITE_EMAIL}`);
  printInvite = true;
}

if (printInvite) {
  console.log("────────────────────────────────────────");
  console.log(`ADMIN INVITE for ${ADMIN_INVITE_EMAIL}`);
  console.log(`Accept URL: ${acceptUrl}`);
  console.log(`Expires:    ${expiresAt}`);
  console.log("────────────────────────────────────────");
}

/* ──────────────────────── homepage global ──────────────────────── */

const heroPick = articleIdsByCategory.film?.[0] ?? Object.values(articleIdsByCategory).flat()[0];
const picks = [
  articleIdsByCategory.film?.[0],
  articleIdsByCategory.tv?.[0],
  articleIdsByCategory.opinion?.[0],
  articleIdsByCategory.news?.[0],
  articleIdsByCategory.spotlight?.[0],
].filter(Boolean).slice(0, 5).map((id, i) => ({ article: id, sortOrder: i }));

const modules = [];
const modOrder = ["film", "tv", "news", "opinion", "documentary", "events"];
const layouts = ["grid-3", "list", "grid-2", "grid-3", "grid-3", "list"];
modOrder.forEach((slug, i) => {
  const cat = categories[slug];
  if (!cat) return;
  modules.push({
    enabled: true,
    category: cat.id,
    sectionTitle: cat.name,
    layout: layouts[i] ?? "grid-3",
    maxItems: 3,
    articleSelection: "auto",
    sortOrder: i,
  });
});

const spotlight = creatorDocs["kunle-afolayan"];
const featuredCreatorIds = ["genevieve-nnaji", "kemi-adetiba", "mati-diop", "wanuri-kahiu"]
  .map((slug) => creatorDocs[slug]?.id)
  .filter(Boolean);

await payload.updateGlobal({
  slug: "homepage",
  data: {
    heroArticle: heroPick ?? null,
    editorsPicks: picks,
    categoryModules: modules,
    spotlightCreator: spotlight?.id ?? null,
    featuredCreators: featuredCreatorIds.map((id, i) => ({ creator: id, sortOrder: i })),
    reelsEnabled: true,
    reels: reelIds,
    archiveCtaEnabled: true,
  },
  overrideAccess: true,
});
console.log("Homepage global updated.");
console.log("\nDemo content seed complete.");
process.exit(0);
