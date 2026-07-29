export type PageStatus = "draft" | "published";

/** Row shape returned to the admin Pages list. */
export type AdminPageSummary = {
  id: string;
  title: string;
  slug: string;
  status: PageStatus;
  showInFooter: boolean;
  publishedAt?: string | null;
  updatedAt?: string | null;
};

/** Full record returned to the admin editor. */
export type AdminPageDetail = AdminPageSummary & {
  excerpt?: string | null;
  body?: unknown;
  seo?: {
    title?: string | null;
    description?: string | null;
    ogImageId?: string | null;
  };
};

export type AdminPageList = {
  docs: AdminPageSummary[];
  totalDocs: number;
};
