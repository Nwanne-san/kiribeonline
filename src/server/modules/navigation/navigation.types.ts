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

export type NavigationChrome = {
  headerLinks: NavLinkRow[];
  footerColumns: FooterColumn[];
};

/** Admin GET payload — chrome plus the context the editor needs to edit it. */
export type AdminNavigationPayload = NavigationChrome & {
  /** True when the saved global is empty and these are derived defaults. */
  isDefault: boolean;
  /** Hard cap on header links, surfaced so the UI can disable "Add". */
  maxHeaderLinks: number;
  /** Categories available to link at, for the picker. */
  availableCategories: Array<{ label: string; href: string; inNav: boolean }>;
};
