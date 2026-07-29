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
import { cn } from "@/modules/shared/components/tw";
import { trackEvent } from "@/modules/shared/components/GoogleAnalytics";

const pillClass =
  "inline-flex items-center gap-2 px-4 py-2 border-none cursor-pointer text-white font-headline text-xs tracking-[0.1em] uppercase transition-opacity duration-[var(--duration-fast)] ease-in-out hover:opacity-90";

export function ArticleShareRow({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  // `navigator.share` is client-only and may be missing (desktop Firefox, older
  // browsers). Detect after mount to keep SSR output stable and avoid a
  // hydration mismatch.
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function"
    );
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
    try {
      await navigator.share({ title, url: shareUrl() });
      // Track only on successful invocation — a user cancel throws AbortError.
      trackEvent("share", { method: "native", content_type: "article", item_id: title });
    } catch {
      /* user cancelled or share unavailable — no-op */
    }
  };

  return (
    <Box className="py-8 border-t border-border">
      <KiribeTypography className="font-headline text-xs tracking-[0.1em] uppercase text-muted mb-4">
        Share
      </KiribeTypography>
      <Stack direction="row" spacing={1.5} className="flex-wrap gap-3">
        {/*
          WhatsApp first — primary sharing channel for this audience. The
          `wa.me` universal link routes to the native app on mobile and to
          WhatsApp Web on desktop; `text` carries the title + URL.
        */}
        <Box
          component="button"
          type="button"
          aria-label="Share on WhatsApp"
          onClick={() =>
            openShare("whatsapp", `https://wa.me/?text=${encodedTitle}%20${encoded()}`)
          }
          className={cn(pillClass, "bg-[#25D366]")}
        >
          <WhatsAppIcon className="text-[16px]" />
          WhatsApp
        </Box>
        <Box
          component="button"
          type="button"
          aria-label="Share on X"
          onClick={() =>
            openShare("x", `https://twitter.com/intent/tweet?url=${encoded()}&text=${encodedTitle}`)
          }
          className={cn(pillClass, "bg-black")}
        >
          <TwitterIcon className="text-[16px]" />
          X
        </Box>
        <Box
          component="button"
          type="button"
          aria-label="Share on Facebook"
          onClick={() =>
            openShare("facebook", `https://www.facebook.com/sharer/sharer.php?u=${encoded()}`)
          }
          className={cn(pillClass, "bg-[#1447E6]")}
        >
          <FacebookIcon className="text-[16px]" />
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
          className={cn(pillClass, "bg-[#155DFC]")}
        >
          <LinkedInIcon className="text-[16px]" />
          LinkedIn
        </Box>
        <Box
          component="button"
          type="button"
          onClick={handleCopy}
          className={cn(
            pillClass,
            "bg-transparent border border-solid",
            copied ? "text-burgundy border-burgundy" : "text-ink-secondary border-[#D1D5DC]"
          )}
        >
          {copied ? <CheckIcon className="text-[16px]" /> : <ContentCopyIcon className="text-[16px]" />}
          {copied ? "Copied" : "Copy Link"}
        </Box>
        {/*
          Native share (Web Share API) — mobile-first UX. Feature-detected
          after mount; hidden entirely on unsupported browsers (desktop
          Firefox, older Safari) rather than showing a dead button.
        */}
        {canNativeShare && (
          <Box
            component="button"
            type="button"
            aria-label="Share via device"
            onClick={handleNativeShare}
            className={cn(
              pillClass,
              "bg-transparent text-ink-secondary border border-solid border-[#D1D5DC]"
            )}
          >
            <IosShareIcon className="text-[16px]" />
            Share
          </Box>
        )}
      </Stack>
    </Box>
  );
}
