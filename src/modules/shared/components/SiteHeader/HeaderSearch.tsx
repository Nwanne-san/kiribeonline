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
        sx={{ color: "text.primary", p: 0.75 }}
        size="small"
      >
        {open ? <CloseIcon fontSize="small" /> : <SearchIcon fontSize="small" />}
      </IconButton>

      {open && (
        <Box
          onClick={() => setOpen(false)}
          sx={{
            position: "fixed",
            inset: "64px 0 0 0",
            bgcolor: "rgba(0,0,0,0.4)",
            zIndex: (theme) => theme.zIndex.appBar - 1,
          }}
          aria-hidden
        />
      )}

      <Collapse
        in={open}
        timeout={180}
        sx={{
          position: "absolute",
          top: 64,
          left: 0,
          right: 0,
          zIndex: (theme) => theme.zIndex.appBar,
        }}
      >
        <Box
          onClick={(e) => e.stopPropagation()}
          sx={{
            bgcolor: "background.paper",
            borderBottom: "1px solid",
            borderColor: "divider",
            boxShadow: "0 12px 24px rgba(0,0,0,0.08)",
          }}
        >
          <Box
            sx={{
              maxWidth: "var(--container-editorial)",
              mx: "auto",
              px: { xs: 2, md: 4 },
              py: { xs: 2.5, md: 3 },
            }}
          >
            <TextField
              inputRef={inputRef}
              fullWidth
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search articles… (press Enter for all results)"
              inputProps={{ "aria-label": "Search Kiribé articles" }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: "text.secondary" }} />
                  </InputAdornment>
                ),
                endAdornment: loading ? (
                  <InputAdornment position="end">
                    <CircularProgress size={18} thickness={5} color="inherit" />
                  </InputAdornment>
                ) : undefined,
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  fontSize: "1.125rem",
                  fontFamily: "var(--font-headline), 'Outfit', sans-serif",
                  "& fieldset": { borderColor: "divider" },
                  "&:hover fieldset": { borderColor: "primary.main" },
                  "&.Mui-focused fieldset": { borderColor: "primary.main", borderWidth: 1 },
                },
                "& .MuiOutlinedInput-input": { py: 1.75 },
              }}
            />

            <Box sx={{ mt: 2, minHeight: 80 }}>
              {!touched && q.trim().length === 0 && (
                <>
                  <KiribeTypography variant="body2" color="text.secondary">
                    Type a title, topic, or author to search the Kiribé archive.
                  </KiribeTypography>

                  {categories.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <KiribeTypography
                        component="p"
                        sx={{
                          fontSize: "0.6875rem",
                          fontWeight: 600,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "text.secondary",
                          mb: 1.5,
                        }}
                      >
                        Browse by category
                      </KiribeTypography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        {categories.map((category) => (
                          <Box
                            key={category.id}
                            component={NextLink}
                            href={publicRoute(PublicRoutes.categoryDetail, {
                              slug: category.slug,
                            })}
                            onClick={() => setOpen(false)}
                            sx={{
                              display: "inline-flex",
                              alignItems: "center",
                              px: 1.75,
                              py: 0.75,
                              borderRadius: 999,
                              border: "1px solid",
                              borderColor: "divider",
                              fontFamily: "var(--font-headline), 'Outfit', sans-serif",
                              fontSize: "0.75rem",
                              fontWeight: 500,
                              letterSpacing: "0.04em",
                              textTransform: "uppercase",
                              color: "text.primary",
                              textDecoration: "none",
                              transition: "color 120ms ease, border-color 120ms ease",
                              "&:hover": {
                                borderColor: "primary.main",
                                color: "primary.main",
                              },
                            }}
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
                <Stack divider={<Box sx={{ borderTop: "1px solid", borderColor: "divider" }} />} spacing={0}>
                  {results.map((article) => {
                    const cat = article.categories?.[0];
                    return (
                      <NextLink
                        key={article.id}
                        href={publicRoute(PublicRoutes.articleDetail, { slug: article.slug })}
                        onClick={() => setOpen(false)}
                        style={{ textDecoration: "none", color: "inherit" }}
                      >
                        <Box
                          sx={{
                            py: 1.5,
                            px: 1,
                            mx: -1,
                            borderRadius: 1,
                            transition: "background 120ms ease",
                            "&:hover": { bgcolor: "action.hover" },
                          }}
                        >
                          <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                            {cat?.name && (
                              <Box sx={{ flexShrink: 0, mt: 0.5 }}>
                                <CategoryBadge
                                  label={cat.name}
                                  color={getCategoryColor(cat.slug)}
                                  variant="solid"
                                />
                              </Box>
                            )}
                            <Box sx={{ minWidth: 0 }}>
                              <KiribeTypography
                                sx={{
                                  fontFamily: "var(--font-headline), 'Outfit', sans-serif",
                                  fontSize: "1rem",
                                  fontWeight: 600,
                                  lineHeight: 1.35,
                                  color: "text.primary",
                                }}
                              >
                                {article.title}
                              </KiribeTypography>
                              {article.excerpt && (
                                <KiribeTypography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{
                                    mt: 0.5,
                                    display: "-webkit-box",
                                    WebkitLineClamp: 1,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                  }}
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
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mt: 1.5,
                      pt: 1.5,
                      borderTop: "1px solid",
                      borderColor: "divider",
                      textDecoration: "none",
                      fontFamily: "var(--font-headline), 'Outfit', sans-serif",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      letterSpacing: "0.03em",
                      textTransform: "uppercase",
                      color: "primary.main",
                      transition: "color 120ms ease",
                      "&:hover": { color: "secondary.main" },
                    }}
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
