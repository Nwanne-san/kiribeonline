import type { Where } from "payload";
import type { Article } from "@/modules/shared/types/content";

export type ArticleListParams = {
  page?: number | string;
  limit?: number | string;
  categorySlug?: string;
  tagSlug?: string;
  q?: string;
  sort?: string;
};

export type ArticleListResult<TDoc = ArticleCardDoc> = {
  docs: TDoc[];
  totalDocs: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type ArticleCardDoc = Pick<
  Article,
  "id" | "title" | "slug" | "excerpt" | "publishedAt"
> & {
  heroImage?: Article["heroImage"];
  categories?: Array<{ id: string; name: string; slug: string }>;
  tags?: Array<{ id: string; name: string; slug: string }>;
  /** Populated byline (depth ≥ 1). May arrive as a bare id string at depth 0. */
  author?: { id?: string | number; name?: string | null } | string | null;
  /**
   * Pre-computed reading time (minutes). Card queries derive this server-side
   * and omit the heavy Lexical `body` so list payloads stay lean.
   */
  readingTime?: number;
  /**
   * Lexical body — only present on raw Payload docs (e.g. detail queries).
   * Card/list mappings strip it; prefer {@link readingTime} on cards.
   */
  body?: unknown;
};

export type ArticleFilterInput = {
  categorySlug?: string;
  tagSlug?: string;
  status?: string;
};

export type ArticleSearchInput = {
  q?: string;
};

export type ArticleWhereClause = Where;
