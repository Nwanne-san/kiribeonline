"use client";

import { useState } from "react";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import { KiribeTypography } from "@/modules/shared/components/ui";
import { trackEvent } from "@/modules/shared/components/GoogleAnalytics";
import { PublicRoutes } from "@/routes/public.routes";
import { useMutationService } from "@/utils/hooks/useMutationService";
import {
  subscribeService,
  type SubscribeSubmitResponse,
} from "@/services/marketing.service";
import type { SubscribeFormInput } from "@/lib/validation/subscribe";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** "Stay Ahead of the Story" newsletter CTA — Figma V5 article footer. */
export function ArticleNewsletterCta() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [touched, setTouched] = useState(false);

  const { mutate, isPending, isSuccess } = useMutationService<
    SubscribeFormInput,
    SubscribeSubmitResponse
  >({
    service: subscribeService.submit,
    options: { successTitle: "Check your inbox to confirm" },
  });

  const valid = EMAIL_RE.test(email.trim());
  const canSubmit = valid && consent;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    trackEvent("subscribe", { location: "article_footer" });
    mutate({ email: email.trim(), consent, website: "" });
  };

  return (
    <Box component="section" sx={{ bgcolor: "#030712", py: { xs: 8, md: 12 } }}>
      <Box sx={{ maxWidth: 640, mx: "auto", px: 3, textAlign: "center" }}>
        <KiribeTypography
          sx={{
            fontFamily: "var(--font-headline), 'Outfit', sans-serif",
            fontSize: "0.75rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--color-mustard)",
          }}
        >
          Join the Conversation
        </KiribeTypography>
        <KiribeTypography
          sx={{
            mt: 2,
            fontFamily: "var(--font-headline), 'Outfit', sans-serif",
            fontWeight: 400,
            fontSize: { xs: "1.875rem", md: "2.25rem" },
            color: "#fff",
          }}
        >
          Stay Ahead of the Story
        </KiribeTypography>
        <Box sx={{ mx: "auto", mt: 2, width: 40, height: 2, bgcolor: "var(--color-mustard)" }} />
        <KiribeTypography sx={{ mt: 3, color: "var(--color-muted)", fontSize: "1rem", lineHeight: 1.6 }}>
          Subscribe to Kiribé for premium entertainment journalism, exclusive
          interviews, and cultural commentary delivered weekly.
        </KiribeTypography>

        {isSuccess ? (
          <KiribeTypography sx={{ mt: 4, color: "var(--color-mustard)", fontSize: "1rem" }}>
            Thanks — check your inbox to confirm your subscription.
          </KiribeTypography>
        ) : (
          <Box
            component="form"
            onSubmit={onSubmit}
            noValidate
            sx={{ mt: 4, maxWidth: 520, mx: "auto" }}
          >
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <Box
              component="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              aria-label="Your email address"
              aria-invalid={touched && !valid}
              sx={{
                flex: 1,
                bgcolor: "#1E2939",
                border: "1px solid",
                borderColor: touched && !valid ? "var(--color-danger)" : "#364153",
                color: "#fff",
                px: 2.5,
                py: 1.5,
                fontFamily: "var(--font-body)",
                fontSize: "0.875rem",
                outline: "none",
                "&::placeholder": { color: "#6A7282" },
                "&:focus": { borderColor: "var(--color-mustard)" },
              }}
            />
            <Box
              component="button"
              type="submit"
              disabled={isPending || !canSubmit}
              sx={{
                bgcolor: "var(--color-mustard)",
                color: "#fff",
                border: "none",
                px: 4,
                py: 1.5,
                cursor: "pointer",
                fontFamily: "var(--font-headline), 'Outfit', sans-serif",
                fontSize: "0.875rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                transition: "background-color var(--duration-fast) ease",
                "&:hover": { bgcolor: "var(--color-mustard-dark)" },
                "&:disabled": { opacity: 0.6, cursor: "default" },
              }}
            >
              {isPending ? "Subscribing…" : "Subscribe Free"}
            </Box>
            </Stack>

            <FormControlLabel
              sx={{ mt: 2.5, mx: 0, alignItems: "flex-start" }}
              control={
                <Checkbox
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  size="small"
                  sx={{
                    py: 0,
                    color: "var(--color-muted-soft)",
                    "&.Mui-checked": { color: "var(--color-mustard)" },
                  }}
                />
              }
              label={
                <KiribeTypography
                  sx={{ color: "var(--color-muted)", fontSize: "0.8125rem", lineHeight: 1.5, textAlign: "left" }}
                >
                  I agree to receive editorial updates and accept the{" "}
                  <Box
                    component={NextLink}
                    href={PublicRoutes.privacy}
                    sx={{ color: "var(--color-mustard)", textDecoration: "underline" }}
                  >
                    privacy policy
                  </Box>
                  .
                </KiribeTypography>
              }
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
