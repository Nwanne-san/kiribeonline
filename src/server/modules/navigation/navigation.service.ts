/**
 * Stub navigation chrome defaults mirroring the public SiteHeader PRIMARY_NAV
 * / FOOTER_SECTIONS. Category visibility remains Categories.showInNav.
 */

export type NavLinkRow = {
  id: string;
  label: string;
  href: string;
  visible: boolean;
};

export type FooterColumn = {
  id: string;
  title: string;
  links: NavLinkRow[];
};

export function getDefaultNavigationChrome() {
  return {
    headerLinks: [
      { id: "film", label: "Film", href: "/categories/film", visible: true },
      { id: "tv", label: "TV", href: "/categories/tv", visible: true },
      { id: "videos", label: "Videos", href: "/categories/videos", visible: true },
      { id: "news", label: "News", href: "/categories/news", visible: true },
      { id: "opinion", label: "Opinion", href: "/categories/opinion", visible: true },
      { id: "spotlight", label: "Spotlight", href: "/categories/spotlight", visible: true },
    ] satisfies NavLinkRow[],
    footerColumns: [
      {
        id: "explore",
        title: "Explore",
        links: [
          { id: "f-film", label: "Film", href: "/categories/film", visible: true },
          { id: "f-tv", label: "TV", href: "/categories/tv", visible: true },
          { id: "f-videos", label: "Videos", href: "/categories/videos", visible: true },
        ],
      },
      {
        id: "about",
        title: "About",
        links: [
          { id: "f-about", label: "About", href: "/about", visible: true },
          { id: "f-contact", label: "Contact", href: "/contact", visible: true },
          { id: "f-rss", label: "RSS Feed", href: "/feed.xml", visible: true },
        ],
      },
    ] satisfies FooterColumn[],
  };
}
