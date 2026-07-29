"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CloseIcon from "@mui/icons-material/Close";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
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

type SubscribeModalProps = {
  open: boolean;
  onClose: () => void;
};

/** "Stay in the Story" newsletter modal — Figma V5 node 2044:603. */
export function SubscribeModal({ open, onClose }: SubscribeModalProps) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [touched, setTouched] = useState(false);

  const { mutate, isPending, isSuccess, reset } = useMutationService<
    SubscribeFormInput,
    SubscribeSubmitResponse
  >({
    service: subscribeService.submit,
    options: { successTitle: "Check your inbox to confirm" },
  });

  // Reset the form each time the modal is reopened.
  useEffect(() => {
    if (open) {
      setEmail("");
      setConsent(false);
      setTouched(false);
      reset();
    }
  }, [open, reset]);

  const valid = EMAIL_RE.test(email.trim());
  const canSubmit = valid && consent;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    trackEvent("subscribe", { location: "modal" });
    mutate({ email: email.trim(), consent, website: "" });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="subscribe-modal-title"
      slotProps={{
        paper: {
          className:
            "m-4 max-w-[512px] rounded-none overflow-visible shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)]",
        },
      }}
    >
      {/* Burgundy top bar */}
      <Box className="h-1.5 bg-burgundy" />

      {/* Close button */}
      <IconButton
        aria-label="Close"
        onClick={onClose}
        className="absolute top-3 right-3 text-muted"
      >
        <CloseIcon className="text-[20px]" />
      </IconButton>

      <Box className="p-10">
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box className="w-8 h-8 bg-burgundy flex items-center justify-center shrink-0">
            <MailOutlineIcon className="text-base text-white" />
          </Box>
          <KiribeTypography className="font-headline text-xs leading-4 tracking-[0.1em] uppercase text-burgundy">
            Newsletter
          </KiribeTypography>
        </Stack>

        <KiribeTypography
          id="subscribe-modal-title"
          component="h2"
          className="mt-4 font-headline font-normal text-[1.875rem] leading-tight text-[#101828]"
        >
          Stay in the Story
        </KiribeTypography>

        <KiribeTypography className="mt-3 font-body text-base leading-[1.625] text-ink-secondary">
          Join the Kiribé inner circle — curated film, television, and culture
          stories delivered to your inbox every week. No noise, only what matters.
        </KiribeTypography>

        <Box className="mt-6 w-12 h-0.5 bg-mustard" />

        {isSuccess ? (
          <KiribeTypography className="mt-6 text-burgundy text-base leading-[1.6]">
            Thanks — check your inbox to confirm your subscription.
          </KiribeTypography>
        ) : (
          <>
            <Stack
              component="form"
              onSubmit={onSubmit}
              noValidate
              direction="row"
              className="mt-6"
            >
              <Box
                component="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                aria-label="Your email address"
                aria-invalid={touched && !valid}
                className={cn(
                  "flex-1 min-w-0 border border-r-0 text-[#101828] px-4 py-3 font-body text-sm outline-none placeholder:text-muted-soft focus:border-burgundy",
                  touched && !valid ? "border-danger" : "border-[#D1D5DC]"
                )}
              />
              <Box
                component="button"
                type="submit"
                disabled={isPending || !canSubmit}
                className="inline-flex items-center gap-2 bg-burgundy text-white border-none px-5 py-3 cursor-pointer font-headline text-sm leading-5 tracking-[0.1em] uppercase whitespace-nowrap transition-colors duration-[var(--duration-fast)] ease-in-out hover:bg-burgundy-dark disabled:opacity-60 disabled:cursor-default"
              >
                {isPending ? "…" : "Subscribe"}
                {!isPending && <ArrowForwardIcon className="text-[16px]" />}
              </Box>
            </Stack>

            <FormControlLabel
              className="mt-4 mx-0 items-start"
              control={
                <Checkbox
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  size="small"
                  className="py-0 text-muted-soft [&.Mui-checked]:text-burgundy"
                />
              }
              label={
                <KiribeTypography className="text-[0.8125rem] leading-normal text-ink-secondary text-left">
                  I agree to receive editorial updates and accept the{" "}
                  <Box
                    component={NextLink}
                    href={PublicRoutes.privacy}
                    className="text-burgundy underline"
                  >
                    privacy policy
                  </Box>
                  .
                </KiribeTypography>
              }
            />

            <KiribeTypography className="mt-3 text-xs leading-4 text-muted-soft">
              No spam, unsubscribe anytime. Your privacy is respected.
            </KiribeTypography>

            <Box className="mt-3 text-center">
              <Box
                component="button"
                type="button"
                onClick={onClose}
                className="border-none bg-transparent cursor-pointer font-body text-xs leading-4 text-muted-soft underline hover:text-muted"
              >
                No thanks, I&apos;ll pass for now
              </Box>
            </Box>
          </>
        )}
      </Box>

      {/* Gold bottom bar */}
      <Box className="h-1 bg-mustard" />
    </Dialog>
  );
}
