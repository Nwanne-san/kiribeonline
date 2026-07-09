/** Cross-domain admin primitives shared by every server module. */

export type AdminMediaRef = {
  id: string;
  url?: string;
  alt?: string;
};

export type AdminAuthorRef = {
  id: string;
  name?: string | null;
  email?: string;
};

export type AdminTermRef = {
  id: string;
  name: string;
  slug: string;
};

export type AdminListResult<T> = {
  docs: T[];
  totalDocs: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};
