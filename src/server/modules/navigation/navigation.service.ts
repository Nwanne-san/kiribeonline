import { NAV_MAX_HEADER_LINKS } from "@/constants";
import { getPayloadClient } from "@/lib/payload/get-payload";
import { PublicRoutes } from "@/routes/public.routes";
import type { NavigationPatchInput } from "./navigation.dto";
import type {
  AdminNavigationPayload,
  FooterColumn,
  NavigationChrome,
  NavLinkRow,
} from "./navigation.types";

/**
 * Sections that own a hand-built archive rather than a CMS category record —
 * Videos renders the reels grid, Spotlight renders creator profiles. They must
 * appear in the derived defaults even though no `categories` row backs them.
 */
const STANDALONE_SECTIONS: Array<{ label: string; href: string }> = [
  { label: "Videos", href: PublicRoutes.categoryVideos },
  { label: "Spotlight", href: "/categories/spotlight" },
];

type RawCategory = {
  name?: string | null;
  slug?: string | null;
  showInNav?: boolean | null;
  displayOrder?: number | null;
};

type RawNavLink = {
  id?: string | number | null;
  label?: string | null;
  href?: string | null;
  visible?: boolean | null;
};

type RawFooterColumn = {
  id?: string | number | null;
  title?: string | null;
  links?: RawNavLink[] | null;
};

function mapLink(row: RawNavLink, fallbackId: string): NavLinkRow {
  return {
    id: row.id ? String(row.id) : fallbackId,
    label: row.label ?? "",
    href: row.href ?? "/",
    // Payload checkboxes come back `null` when never touched; default visible.
    visible: row.visible !== false,
  };
}

async function fetchNavCategories(): Promise<Array<{ label: string; href: string; inNav: boolean }>> {
  try {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "categories",
      sort: "displayOrder",
      limit: 50,
      depth: 0,
      overrideAccess: true,
    });
    const fromCms = (result.docs as RawCategory[])
      .filter((doc) => doc.slug)
      .map((doc) => ({
        label: doc.name ?? doc.slug ?? "",
        href: `/categories/${doc.slug}`,
        inNav: doc.showInNav !== false,
      }));

    // Standalone archives aren't CMS categories, so append any that the CMS
    // list didn't already cover (a real "videos" category would win).
    const known = new Set(fromCms.map((c) => c.href));
    return [
      ...fromCms,
      ...STANDALONE_SECTIONS.filter((s) => !known.has(s.href)).map((s) => ({
        ...s,
        inNav: true,
      })),
    ];
  } catch {
    return STANDALONE_SECTIONS.map((s) => ({ ...s, inNav: true }));
  }
}

/**
 * Chrome derived from the CMS when an admin has never saved a custom nav.
 * Header links come from nav-visible categories in `displayOrder`, capped at
 * `NAV_MAX_HEADER_LINKS` so the derived default can't overflow the row either.
 */
async function deriveDefaultChrome(): Promise<NavigationChrome> {
  const categories = await fetchNavCategories();
  const headerLinks: NavLinkRow[] = categories
    .filter((c) => c.inNav)
    .slice(0, NAV_MAX_HEADER_LINKS)
    .map((c, i) => ({
      id: `h-${i}`,
      label: c.label,
      href: c.href,
      visible: true,
    }));

  const footerColumns: FooterColumn[] = [
    {
      id: "sections",
      title: "Sections",
      links: categories.slice(0, NAV_MAX_HEADER_LINKS).map((c, i) => ({
        id: `f-s-${i}`,
        label: c.label,
        href: c.href,
        visible: true,
      })),
    },
    {
      id: "about",
      title: "About",
      links: [
        { id: "f-a-0", label: "About Us", href: PublicRoutes.about, visible: true },
        { id: "f-a-1", label: "Contact", href: PublicRoutes.contact, visible: true },
        { id: "f-a-2", label: "RSS Feed", href: "/feed.xml", visible: true },
      ],
    },
  ];

  return { headerLinks, footerColumns };
}

type RawNavigation = {
  headerLinks?: RawNavLink[] | null;
  footerColumns?: RawFooterColumn[] | null;
} | null;

async function readSavedNavigation(): Promise<RawNavigation> {
  try {
    const payload = await getPayloadClient();
    const global = (await payload.findGlobal({
      slug: "site-settings",
      depth: 0,
      overrideAccess: true,
    })) as { navigation?: RawNavigation };
    return global.navigation ?? null;
  } catch {
    return null;
  }
}

/**
 * Saved chrome if the admin has configured any, otherwise the CMS-derived
 * default. Header links are capped defensively — an array saved before the
 * `maxRows` limit existed must not overflow the public header.
 */
export async function getNavigationChrome(): Promise<
  NavigationChrome & { isDefault: boolean }
> {
  const saved = await readSavedNavigation();
  const savedHeader = saved?.headerLinks ?? [];
  const savedFooter = saved?.footerColumns ?? [];

  if (savedHeader.length === 0 && savedFooter.length === 0) {
    return { ...(await deriveDefaultChrome()), isDefault: true };
  }

  const fallback =
    savedHeader.length === 0 || savedFooter.length === 0
      ? await deriveDefaultChrome()
      : null;

  return {
    headerLinks:
      savedHeader.length > 0
        ? savedHeader
            .slice(0, NAV_MAX_HEADER_LINKS)
            .map((row, i) => mapLink(row, `h-${i}`))
        : (fallback?.headerLinks ?? []),
    footerColumns:
      savedFooter.length > 0
        ? savedFooter.map((col, i) => ({
            id: col.id ? String(col.id) : `c-${i}`,
            title: col.title ?? "",
            links: (col.links ?? []).map((link, j) =>
              mapLink(link, `c-${i}-${j}`)
            ),
          }))
        : (fallback?.footerColumns ?? []),
    isDefault: false,
  };
}

/** Admin GET — chrome plus the editing context the Navigation screen needs. */
export async function getNavigationAdmin(): Promise<AdminNavigationPayload> {
  const [chrome, availableCategories] = await Promise.all([
    getNavigationChrome(),
    fetchNavCategories(),
  ]);
  return {
    ...chrome,
    maxHeaderLinks: NAV_MAX_HEADER_LINKS,
    availableCategories,
  };
}

export async function updateNavigationAdmin(input: NavigationPatchInput) {
  const payload = await getPayloadClient();
  const navigation: Record<string, unknown> = {};
  if (input.headerLinks !== undefined) {
    // Belt-and-braces alongside the DTO `.max()` and the Payload `maxRows`.
    navigation.headerLinks = input.headerLinks.slice(0, NAV_MAX_HEADER_LINKS);
  }
  if (input.footerColumns !== undefined) {
    navigation.footerColumns = input.footerColumns;
  }

  await payload.updateGlobal({
    slug: "site-settings",
    data: { navigation } as never,
    overrideAccess: true,
  });

  return getNavigationAdmin();
}
