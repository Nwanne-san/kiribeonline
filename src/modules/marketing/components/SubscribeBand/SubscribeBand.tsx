"use client";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import NextLink from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  EditorialContainer,
  KiribeTypography,
} from "@/modules/shared/components/ui";
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

// Figma 2001:411 — newsletter band uses a slightly deeper burgundy than the
// theme primary (#6B1D2A). Keep this literal here.
const NEWSLETTER_BG = "#710A0A";
const MUSTARD = "#C9A227";
const BURGUNDY = "#7F0400";

type Status = "idle" | "pending" | "confirmed";

const sectionClass = "text-white py-16 md:py-20 scroll-mt-20";

const mustardButtonClass =
  "font-headline text-sm font-bold tracking-[0.06em] uppercase px-6 rounded hover:opacity-90";

function SubscribeBandInner() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  // Consent must be explicitly given per privacy guidance — default unchecked
  // and require the box before the submit is enabled.
  const [consent, setConsent] = useState(false);
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  // If the confirmation route landed here with ?subscribed=…, show the
  // appropriate state on mount (one-shot, no input rendered).
  useEffect(() => {
    const value = params?.get("subscribed");
    if (!value) return;
    if (value === "confirmed") {
      setStatus("confirmed");
      setMessage("You're confirmed — welcome to Kiribé.");
    } else if (value === "already") {
      setStatus("confirmed");
      setMessage("You were already subscribed. Welcome back.");
    } else if (value === "invalid") {
      setStatus("idle");
      setMessage("That confirmation link is invalid or expired. Try subscribing again.");
    }
  }, [params]);

  const trimmed = email.trim();
  const emailError = (() => {
    if (!touched) return null;
    if (!trimmed) return "Email is required";
    if (!EMAIL_RE.test(trimmed)) return "Enter a valid email address";
    return null;
  })();
  const canSubmit = trimmed.length > 0 && !emailError && consent;

  const { mutate, isPending } = useMutationService<
    SubscribeFormInput,
    SubscribeSubmitResponse & { status?: Status | "already-subscribed" }
  >({
    service: subscribeService.submit,
    options: {
      successTitle: "Thanks",
      onSuccess: (response) => {
        const next =
          response?.status === "confirmed"
            ? "confirmed"
            : response?.status === "already-subscribed"
            ? "confirmed"
            : "pending";
        setStatus(next as Status);
        setMessage(
          response?.message ?? "Check your inbox to confirm your subscription."
        );
        setEmail("");
        setTouched(false);
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    setMessage(null);
    trackEvent("subscribe", { location: "band" });
    mutate({ email: trimmed, consent, website: "" });
  };

  if (status === "pending" || status === "confirmed") {
    const isConfirmed = status === "confirmed";
    return (
      <Box
        id="newsletter"
        component="section"
        className={sectionClass}
        style={{ backgroundColor: NEWSLETTER_BG }}
      >
        <EditorialContainer>
          <Stack spacing={3} alignItems="center" className="text-center max-w-[640px] mx-auto">
            <Box className="w-16 h-16 rounded-full grid place-items-center" style={{ backgroundColor: MUSTARD }}>
              {isConfirmed ? (
                <CheckCircleIcon style={{ color: BURGUNDY, fontSize: 32 }} />
              ) : (
                <MailOutlineIcon style={{ color: BURGUNDY, fontSize: 30 }} />
              )}
            </Box>
            <KiribeTypography
              variant="h2"
              className="text-white font-headline text-[1.75rem] md:text-[1.875rem] font-bold tracking-tight"
            >
              {isConfirmed ? "You're on the list" : "Check your inbox"}
            </KiribeTypography>
            <KiribeTypography variant="body1" className="text-white/85 text-base leading-[1.6]">
              {message}
            </KiribeTypography>
            <Button
              onClick={() => {
                setStatus("idle");
                setMessage(null);
              }}
              variant="contained"
              disableElevation
              className={cn(mustardButtonClass, "py-2.5")}
              style={{ backgroundColor: MUSTARD, color: BURGUNDY }}
            >
              Subscribe another email
            </Button>
          </Stack>
        </EditorialContainer>
      </Box>
    );
  }

  return (
    <Box
      id="newsletter"
      component="section"
      className={sectionClass}
      style={{ backgroundColor: NEWSLETTER_BG }}
    >
      <EditorialContainer>
        <Stack spacing={2.5} alignItems="center" className="text-center max-w-[640px] mx-auto">
          <Box className="w-16 h-16 rounded-full grid place-items-center" style={{ backgroundColor: MUSTARD }}>
            <MailOutlineIcon style={{ color: BURGUNDY, fontSize: 30 }} />
          </Box>

          <KiribeTypography
            variant="h2"
            className="text-white font-headline text-[1.75rem] md:text-[1.875rem] font-bold tracking-tight"
          >
            Subscribe to Kiribe Online
          </KiribeTypography>

          <KiribeTypography variant="body1" className="text-white/85 text-base leading-[1.6] max-w-[560px]">
            Get the latest in film, television, and culture delivered to your inbox. Join our
            community of readers who appreciate thoughtful entertainment journalism.
          </KiribeTypography>

          {message && (
            <KiribeTypography variant="caption" className="text-[#FECACA] text-sm -mt-1">
              {message}
            </KiribeTypography>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            className="w-full max-w-[480px] mt-2"
          >
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                fullWidth
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(true)}
                error={Boolean(emailError)}
                helperText={emailError ?? undefined}
                inputProps={{ "aria-label": "Email address", inputMode: "email", autoComplete: "email" }}
                className="bg-white rounded [&_.MuiOutlinedInput-root]:rounded [&_.MuiOutlinedInput-root_fieldset]:border-transparent [&_.MuiOutlinedInput-root:hover_fieldset]:border-transparent [&_.MuiOutlinedInput-input]:py-3 [&_.MuiOutlinedInput-input]:px-3.5 [&_.MuiOutlinedInput-input]:text-[0.9375rem] [&_.MuiOutlinedInput-input]:text-[#1A1A1A] [&_.MuiFormHelperText-root]:text-[#FECACA] [&_.MuiFormHelperText-root]:text-left [&_.MuiFormHelperText-root]:mx-0 [&_.MuiFormHelperText-root]:mt-1 [&_.MuiFormHelperText-root]:font-medium"
                slotProps={{
                  input: {
                    className: cn(
                      emailError ? "" : "[&_.MuiOutlinedInput-root.Mui-focused_fieldset]:border-[#C9A227]"
                    ),
                  },
                }}
              />
              <Button
                type="submit"
                variant="contained"
                disableElevation
                disabled={isPending || !canSubmit}
                className={cn(mustardButtonClass, "py-3 shrink-0 whitespace-nowrap disabled:opacity-60")}
                style={{ backgroundColor: MUSTARD, color: BURGUNDY }}
              >
                {isPending ? "Subscribing…" : "Subscribe"}
              </Button>
            </Stack>
          </Box>

          <FormControlLabel
            control={
              <Checkbox
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                size="small"
                className="text-white/50 py-0.5 [&.Mui-checked]:text-mustard"
              />
            }
            label={
              <KiribeTypography variant="caption" className="text-white/85 text-[0.8125rem]">
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
            className="items-center mx-0"
          />

          <KiribeTypography variant="caption" className="text-white/60 text-xs mt-1">
            We respect your privacy. Unsubscribe at any time.
          </KiribeTypography>
        </Stack>
      </EditorialContainer>
    </Box>
  );
}

export function SubscribeBand() {
  return (
    <Suspense fallback={null}>
      <SubscribeBandInner />
    </Suspense>
  );
}
