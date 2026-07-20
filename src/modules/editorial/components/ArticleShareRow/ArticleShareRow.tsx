"use client";

import { useEffect, useState } from "react";
import CheckIcon from "@mui/icons-material/Check";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import FacebookIcon from "@mui/icons-material/Facebook";
import IosShareIcon from "@mui/icons-material/IosShare";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import TwitterIcon from "@mui/icons-material/Twitter";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
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
  // Feature-detect native share on the client only. Guarding with a mounted
  // flag keeps SSR + hydration deterministic — the button paints on first
  // client render on devices that support Web Share (mostly iOS, Android,
  // some macOS Safari) and stays hidden everywhere else.
  const [canNativeShare, setCanNativeShare] = useState(false);
  useEffect(() => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      setCanNativeShare(true);
    }
  }, []);

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

  const handleNativeShare = async () => {
    const url = shareUrl();
    if (!url) return;
    try {
      await navigator.share({ title, text: title, url });
      trackEvent("share", { method: "native", content_type: "article", item_id: title });
    } catch {
      // User cancelled the OS share sheet (AbortError) or the API rejected —
      // native share is a best-effort enhancement, so we swallow silently and
      // never surface an error toast.
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
        {/*
          Order (spec): copy-link first, then WhatsApp (primary channel for
          this audience), then X / Facebook / LinkedIn. The native "Share…"
          button, when available, sits last as a catch-all that surfaces the
          OS sheet (Messages, Mail, other installed apps).
        */}
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
        <Box
          component="button"
          type="button"
          aria-label="Share on WhatsApp"
          onClick={() =>
            openShare("whatsapp", `https://wa.me/?text=${encodedTitle}%20${encoded()}`)
          }
          sx={{ ...pillSx, bgcolor: "#25D366" }}
        >
          <WhatsAppIcon sx={{ fontSize: 16 }} />
          WhatsApp
        </Box>
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
        {canNativeShare && (
          <Box
            component="button"
            type="button"
            aria-label="Share via device"
            onClick={handleNativeShare}
            sx={{
              ...pillSx,
              bgcolor: "transparent",
              color: "#4A5565",
              border: "1px solid",
              borderColor: "#D1D5DC",
            }}
          >
            <IosShareIcon sx={{ fontSize: 16 }} />
            Share…
          </Box>
        )}
      </Stack>
    </Box>
  );
}
