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
const MUSTARD_DARK = "#A88620";
const BURGUNDY = "#7F0400";

type Status = "idle" | "pending" | "confirmed";

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
        sx={{
          bgcolor: NEWSLETTER_BG,
          color: "common.white",
          py: { xs: 8, md: 10 },
          scrollMarginTop: 80,
        }}
      >
        <EditorialContainer>
          <Stack spacing={3} alignItems="center" sx={{ textAlign: "center", maxWidth: 640, mx: "auto" }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                bgcolor: MUSTARD,
                display: "grid",
                placeItems: "center",
              }}
            >
              {isConfirmed ? (
                <CheckCircleIcon sx={{ color: BURGUNDY, fontSize: 32 }} />
              ) : (
                <MailOutlineIcon sx={{ color: BURGUNDY, fontSize: 30 }} />
              )}
            </Box>
            <KiribeTypography
              variant="h2"
              sx={{
                color: "common.white",
                fontFamily: "var(--font-headline), 'Outfit', sans-serif",
                fontSize: { xs: "1.75rem", md: "1.875rem" },
                fontWeight: 700,
                letterSpacing: "-0.01em",
              }}
            >
              {isConfirmed ? "You're on the list" : "Check your inbox"}
            </KiribeTypography>
            <KiribeTypography
              variant="body1"
              sx={{ color: "rgba(255,255,255,0.85)", fontSize: "1rem", lineHeight: 1.6 }}
            >
              {message}
            </KiribeTypography>
            <Button
              onClick={() => {
                setStatus("idle");
                setMessage(null);
              }}
              variant="contained"
              disableElevation
              sx={{
                bgcolor: MUSTARD,
                color: BURGUNDY,
                fontFamily: "var(--font-headline), 'Outfit', sans-serif",
                fontSize: "0.875rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                px: 3,
                py: 1.25,
                borderRadius: 1,
                "&:hover": { bgcolor: MUSTARD_DARK },
              }}
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
      sx={{
        bgcolor: NEWSLETTER_BG,
        color: "common.white",
        py: { xs: 8, md: 10 },
        scrollMarginTop: 80,
      }}
    >
      <EditorialContainer>
        <Stack spacing={2.5} alignItems="center" sx={{ textAlign: "center", maxWidth: 640, mx: "auto" }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              bgcolor: MUSTARD,
              display: "grid",
              placeItems: "center",
            }}
          >
            <MailOutlineIcon sx={{ color: BURGUNDY, fontSize: 30 }} />
          </Box>

          <KiribeTypography
            variant="h2"
            sx={{
              color: "common.white",
              fontFamily: "var(--font-headline), 'Outfit', sans-serif",
              fontSize: { xs: "1.75rem", md: "1.875rem" },
              fontWeight: 700,
              letterSpacing: "-0.01em",
            }}
          >
            Subscribe to Kiribe Online
          </KiribeTypography>

          <KiribeTypography
            variant="body1"
            sx={{ color: "rgba(255,255,255,0.85)", fontSize: "1rem", lineHeight: 1.6, maxWidth: 560 }}
          >
            Get the latest in film, television, and culture delivered to your inbox. Join our
            community of readers who appreciate thoughtful entertainment journalism.
          </KiribeTypography>

          {message && (
            <KiribeTypography
              variant="caption"
              sx={{ color: "#FECACA", fontSize: "0.875rem", mt: -1 }}
            >
              {message}
            </KiribeTypography>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ width: "100%", maxWidth: 480, mt: 1 }}
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
                sx={{
                  bgcolor: "common.white",
                  borderRadius: 1,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1,
                    "& fieldset": { borderColor: "transparent" },
                    "&:hover fieldset": { borderColor: "transparent" },
                    "&.Mui-focused fieldset": { borderColor: MUSTARD, borderWidth: 1 },
                  },
                  "& .MuiOutlinedInput-input": {
                    py: 1.5,
                    px: 1.75,
                    fontSize: "0.9375rem",
                    color: "#1A1A1A",
                  },
                  "& .MuiFormHelperText-root": {
                    color: "#FECACA",
                    textAlign: "left",
                    mx: 0,
                    mt: 0.5,
                    fontWeight: 500,
                  },
                }}
              />
              <Button
                type="submit"
                variant="contained"
                disableElevation
                disabled={isPending || !canSubmit}
                sx={{
                  bgcolor: MUSTARD,
                  color: BURGUNDY,
                  fontFamily: "var(--font-headline), 'Outfit', sans-serif",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  px: 3,
                  py: 1.5,
                  borderRadius: 1,
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  "&:hover": { bgcolor: MUSTARD_DARK },
                  "&.Mui-disabled": {
                    bgcolor: MUSTARD,
                    color: BURGUNDY,
                    opacity: 0.6,
                  },
                }}
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
                sx={{
                  color: "rgba(255,255,255,0.5)",
                  "&.Mui-checked": { color: MUSTARD },
                  py: 0.25,
                }}
              />
            }
            label={
              <KiribeTypography variant="caption" sx={{ color: "rgba(255,255,255,0.85)", fontSize: "0.8125rem" }}>
                I agree to receive editorial updates and accept the{" "}
                <Box
                  component={NextLink}
                  href={PublicRoutes.privacy}
                  sx={{ color: MUSTARD, textDecoration: "underline" }}
                >
                  privacy policy
                </Box>
                .
              </KiribeTypography>
            }
            sx={{ alignItems: "center", mx: 0 }}
          />

          <KiribeTypography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.75rem", mt: 0.5 }}>
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
