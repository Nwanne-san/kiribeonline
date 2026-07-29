"use client";

import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import type { PublicCategory } from "@/lib/content/query-categories";
import { CategoryBadge } from "@/modules/shared/components/CategoryBadge";
import { trackEvent } from "@/modules/shared/components/GoogleAnalytics";
import { KiribeTypography, publicRoute } from "@/modules/shared/components/ui";
import { PublicRoutes } from "@/routes/public.routes";
import { CATEGORY_COLORS } from "@/theme/category-colors";

type SearchResult = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  publishedAt?: string;
  categories?: Array<{ name?: string; slug?: string }>;
};

const MIN_QUERY = 2;
const DEBOUNCE_MS = 200;

function getCategoryColor(slug?: string) {
  if (!slug) return "#6B1D2A";
  const key = slug as keyof typeof CATEGORY_COLORS;
  return CATEGORY_COLORS[key]?.border ?? "#6B1D2A";
}

/** Build the /search destination href from a query, using the route enum. */
function searchDestination(query: string) {
  return `${PublicRoutes.search}?q=${encodeURIComponent(query)}`;
}

export function HeaderSearch({ categories = [] }: { categories?: PublicCategory[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Focus the input on open.
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
    setTouched(false);
    setResults([]);
    setTotal(0);
    setQ("");
  }, [open]);

  // Submit the current query to the full /search destination.
  const goToSearch = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed.length < MIN_QUERY) return;
    // Fire the GA4 `search` event on explicit intent (Enter / view-all).
    // The /search page fires the same event on its own settled `q` so
    // deep-links and shared URLs are also counted.
    trackEvent("search", { search_term: trimmed });
    setOpen(false);
    router.push(searchDestination(trimmed));
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      goToSearch(q);
    }
  };

  // Esc closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Debounced search.
  useEffect(() => {
    if (!open) return;
    const trimmed = q.trim();
    if (trimmed.length < MIN_QUERY) {
      setResults([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    setTouched(true);
    const handle = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(
          `/api/articles?q=${encodeURIComponent(trimmed)}&limit=5`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("Search failed");
        const json = (await res.json()) as {
          data?: { docs?: SearchResult[]; totalDocs?: number };
        };
        setResults(json.data?.docs ?? []);
        setTotal(json.data?.totalDocs ?? 0);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setResults([]);
          setTotal(0);
        }
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [q, open]);

  return (
    <>
      <IconButton
        aria-label={open ? "Close search" : "Open search"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="text-ink p-1.5"
        size="small"
      >
        {open ? <CloseIcon fontSize="small" /> : <SearchIcon fontSize="small" />}
      </IconButton>

      {open && (
        <Box
          onClick={() => setOpen(false)}
          className="fixed inset-x-0 bottom-0 top-16 bg-black/40 z-[1099]"
          aria-hidden
        />
      )}

      <Collapse
        in={open}
        timeout={180}
        className="absolute top-16 left-0 right-0 z-[1100]"
      >
        <Box
          onClick={(e) => e.stopPropagation()}
          className="bg-surface border-b border-border shadow-[0_12px_24px_rgba(0,0,0,0.08)]"
        >
          <Box className="editorial-container py-5 md:py-6">
            <TextField
              inputRef={inputRef}
              fullWidth
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search articles… (press Enter for all results)"
              inputProps={{ "aria-label": "Search Kiribé articles" }}
              className="kiribe-field [&_.MuiOutlinedInput-root]:text-lg [&_.MuiOutlinedInput-root]:font-headline [&_.MuiOutlinedInput-root_fieldset]:border-border [&_.MuiOutlinedInput-root:hover_fieldset]:border-burgundy [&_.MuiOutlinedInput-root.Mui-focused_fieldset]:border-burgundy [&_.MuiOutlinedInput-root.Mui-focused_fieldset]:border [&_.MuiOutlinedInput-input]:py-3.5"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon className="text-ink-secondary" />
                  </InputAdornment>
                ),
                endAdornment: loading ? (
                  <InputAdornment position="end">
                    <CircularProgress size={18} thickness={5} color="inherit" />
                  </InputAdornment>
                ) : undefined,
              }}
            />

            <Box className="mt-4 min-h-20">
              {!touched && q.trim().length === 0 && (
                <>
                  <KiribeTypography variant="body2" color="text.secondary">
                    Type a title, topic, or author to search the Kiribé archive.
                  </KiribeTypography>

                  {categories.length > 0 && (
                    <Box className="mt-6">
                      <KiribeTypography
                        component="p"
                        className="text-[0.6875rem] font-semibold tracking-[0.08em] uppercase text-ink-secondary mb-3"
                      >
                        Browse by category
                      </KiribeTypography>
                      <Box className="flex flex-wrap gap-2">
                        {categories.map((category) => (
                          <Box
                            key={category.id}
                            component={NextLink}
                            href={publicRoute(PublicRoutes.categoryDetail, {
                              slug: category.slug,
                            })}
                            onClick={() => setOpen(false)}
                            className="inline-flex items-center px-3.5 py-1.5 rounded-full border border-border font-headline text-xs font-medium tracking-[0.04em] uppercase text-ink no-underline transition-[color,border-color] duration-[120ms] ease-in-out hover:border-burgundy hover:text-burgundy"
                          >
                            {category.name}
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </>
              )}

              {touched && q.trim().length > 0 && q.trim().length < MIN_QUERY && (
                <KiribeTypography variant="body2" color="text.secondary">
                  Keep typing — at least {MIN_QUERY} characters.
                </KiribeTypography>
              )}

              {touched && q.trim().length >= MIN_QUERY && !loading && results.length === 0 && (
                <KiribeTypography variant="body2" color="text.secondary">
                  No matches for &ldquo;{q.trim()}&rdquo;. Try a different term.
                </KiribeTypography>
              )}

              {results.length > 0 && (
                <>
                <Stack divider={<Box className="border-t border-border" />} spacing={0}>
                  {results.map((article) => {
                    const cat = article.categories?.[0];
                    return (
                      <NextLink
                        key={article.id}
                        href={publicRoute(PublicRoutes.articleDetail, { slug: article.slug })}
                        onClick={() => setOpen(false)}
                        style={{ textDecoration: "none", color: "inherit" }}
                      >
                        <Box className="py-3 px-2 -mx-2 rounded transition-colors duration-[120ms] ease-in-out hover:bg-black/5">
                          <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                            {cat?.name && (
                              <Box className="shrink-0 mt-1">
                                <CategoryBadge
                                  label={cat.name}
                                  color={getCategoryColor(cat.slug)}
                                  variant="solid"
                                />
                              </Box>
                            )}
                            <Box className="min-w-0">
                              <KiribeTypography className="font-headline text-base font-semibold leading-[1.35] text-ink">
                                {article.title}
                              </KiribeTypography>
                              {article.excerpt && (
                                <KiribeTypography
                                  variant="body2"
                                  color="text.secondary"
                                  className="mt-1 line-clamp-1"
                                >
                                  {article.excerpt}
                                </KiribeTypography>
                              )}
                            </Box>
                          </Stack>
                        </Box>
                      </NextLink>
                    );
                  })}
                </Stack>

                {total > results.length && (
                  <Box
                    component={NextLink}
                    href={searchDestination(q.trim())}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between mt-3 pt-3 border-t border-border no-underline font-headline text-[0.8125rem] font-semibold tracking-[0.03em] uppercase text-burgundy transition-colors duration-[120ms] ease-in-out hover:text-mustard"
                  >
                    <span>
                      View all {total} {total === 1 ? "result" : "results"}
                    </span>
                    <SearchIcon fontSize="small" />
                  </Box>
                )}
                </>
              )}
            </Box>
          </Box>
        </Box>
      </Collapse>
    </>
  );
}
