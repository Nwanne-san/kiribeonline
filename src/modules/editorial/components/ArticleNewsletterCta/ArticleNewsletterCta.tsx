"use client";

import { useState } from "react";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import { KiribeTypography } from "@/modules/shared/components/ui";
import { cn } from "@/modules/shared/components/tw";
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
    <Box component="section" className="bg-[#030712] py-16 md:py-24">
      <Box className="max-w-[640px] mx-auto px-6 text-center">
        <KiribeTypography className="font-headline text-xs tracking-[0.1em] uppercase text-mustard">
          Join the Conversation
        </KiribeTypography>
        <KiribeTypography className="mt-4 font-headline font-normal text-[1.875rem] md:text-4xl text-white">
          Stay Ahead of the Story
        </KiribeTypography>
        <Box className="mx-auto mt-4 w-10 h-0.5 bg-mustard" />
        <KiribeTypography className="mt-6 text-muted text-base leading-[1.6]">
          Subscribe to Kiribé for premium entertainment journalism, exclusive
          interviews, and cultural commentary delivered weekly.
        </KiribeTypography>

        {isSuccess ? (
          <KiribeTypography className="mt-8 text-mustard text-base">
            Thanks — check your inbox to confirm your subscription.
          </KiribeTypography>
        ) : (
          <Box
            component="form"
            onSubmit={onSubmit}
            noValidate
            className="mt-8 max-w-[520px] mx-auto"
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
              className={cn(
                "flex-1 bg-[#1E2939] border text-white px-5 py-3 font-body text-sm outline-none placeholder:text-muted focus:border-mustard",
                touched && !valid ? "border-danger" : "border-[#364153]"
              )}
            />
            <Box
              component="button"
              type="submit"
              disabled={isPending || !canSubmit}
              className="bg-mustard text-white border-none px-8 py-3 cursor-pointer font-headline text-sm tracking-[0.1em] uppercase whitespace-nowrap transition-colors duration-[var(--duration-fast)] ease-in-out hover:bg-mustard-dark disabled:opacity-60 disabled:cursor-default"
            >
              {isPending ? "Subscribing…" : "Subscribe Free"}
            </Box>
            </Stack>

            <FormControlLabel
              className="mt-5 mx-0 items-start"
              control={
                <Checkbox
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  size="small"
                  className="py-0 text-muted-soft [&.Mui-checked]:text-mustard"
                />
              }
              label={
                <KiribeTypography className="text-muted text-[0.8125rem] leading-normal text-left">
                  I agree to receive editorial updates and accept the{" "}
                  <Box
                    component={NextLink}
                    href={PublicRoutes.privacy}
                    className="text-mustard underline"
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
