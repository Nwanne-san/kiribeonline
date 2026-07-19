"use client";

import { useState } from "react";
import CheckIcon from "@mui/icons-material/Check";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import FacebookIcon from "@mui/icons-material/Facebook";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import TwitterIcon from "@mui/icons-material/Twitter";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { KiribeTypography } from "@/modules/shared/components/ui";
import { trackEvent } from "@/modules/shared/components/GoogleAnalytics";

const pillSx = {
  display: "inline-flex",
  alignItems: "center",
  gap: 1,
  px: 2,
  py: 1,
  border: "none",
  cursor: "pointer",
  color: "#fff",
  fontFamily: "var(--font-headline), 'Outfit', sans-serif",
  fontSize: "0.75rem",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  transition: "opacity var(--duration-fast) ease",
  "&:hover": { opacity: 0.9 },
} as const;

export function ArticleShareRow({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const shareUrl = () => (typeof window !== "undefined" ? window.location.href : "");

  const openShare = (method: string, url: string) => {
    trackEvent("share", { method, content_type: "article", item_id: title });
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=520");
  };

  const encoded = () => encodeURIComponent(shareUrl());
  const encodedTitle = encodeURIComponent(title);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl());
      trackEvent("share", { method: "copy_link", content_type: "article", item_id: title });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — no-op */
    }
  };

  return (
    <Box sx={{ py: 4, borderTop: "1px solid", borderColor: "divider" }}>
      <KiribeTypography
        sx={{
          fontFamily: "var(--font-headline), 'Outfit', sans-serif",
          fontSize: "0.75rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--color-muted)",
          mb: 2,
        }}
      >
        Share
      </KiribeTypography>
      <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap", gap: 1.5 }}>
        <Box
          component="button"
          type="button"
          aria-label="Share on X"
          onClick={() =>
            openShare("x", `https://twitter.com/intent/tweet?url=${encoded()}&text=${encodedTitle}`)
          }
          sx={{ ...pillSx, bgcolor: "#000" }}
        >
          <TwitterIcon sx={{ fontSize: 16 }} />
          X
        </Box>
        <Box
          component="button"
          type="button"
          aria-label="Share on Facebook"
          onClick={() =>
            openShare("facebook", `https://www.facebook.com/sharer/sharer.php?u=${encoded()}`)
          }
          sx={{ ...pillSx, bgcolor: "#1447E6" }}
        >
          <FacebookIcon sx={{ fontSize: 16 }} />
          Facebook
        </Box>
        <Box
          component="button"
          type="button"
          aria-label="Share on LinkedIn"
          onClick={() =>
            openShare(
              "linkedin",
              `https://www.linkedin.com/sharing/share-offsite/?url=${encoded()}`
            )
          }
          sx={{ ...pillSx, bgcolor: "#155DFC" }}
        >
          <LinkedInIcon sx={{ fontSize: 16 }} />
          LinkedIn
        </Box>
        <Box
          component="button"
          type="button"
          onClick={handleCopy}
          sx={{
            ...pillSx,
            bgcolor: "transparent",
            color: copied ? "primary.main" : "#4A5565",
            border: "1px solid",
            borderColor: copied ? "primary.main" : "#D1D5DC",
          }}
        >
          {copied ? <CheckIcon sx={{ fontSize: 16 }} /> : <ContentCopyIcon sx={{ fontSize: 16 }} />}
          {copied ? "Copied" : "Copy Link"}
        </Box>
      </Stack>
    </Box>
  );
}
