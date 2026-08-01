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
          sx: {
            m: 2,
            maxWidth: 512,
            borderRadius: 0,
            overflow: "visible",
            boxShadow: "0px 25px 50px -12px rgba(0,0,0,0.25)",
          },
        },
      }}
    >
      {/* Burgundy top bar */}
      <Box sx={{ height: 6, bgcolor: "primary.main" }} />

      {/* Close button */}
      <IconButton
        aria-label="Close"
        onClick={onClose}
        sx={{ position: "absolute", top: 12, right: 12, color: "#6A7282" }}
      >
        <CloseIcon sx={{ fontSize: 20 }} />
      </IconButton>

      <Box sx={{ p: { xs: 3, sm: 5 }, pt: { xs: 4.5, sm: 5 } }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 32,
              height: 32,
              bgcolor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <MailOutlineIcon sx={{ fontSize: 16, color: "#fff" }} />
          </Box>
          <KiribeTypography
            sx={{
              fontFamily: "var(--font-headline), 'Outfit', sans-serif",
              fontSize: "0.75rem",
              lineHeight: "1rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "primary.main",
            }}
          >
            Newsletter
          </KiribeTypography>
        </Stack>

        <KiribeTypography
          id="subscribe-modal-title"
          component="h2"
          sx={{
            mt: 2,
            fontFamily: "var(--font-headline), 'Outfit', sans-serif",
            fontWeight: 400,
            fontSize: "1.875rem",
            lineHeight: 1.25,
            color: "#101828",
          }}
        >
          Stay in the Story
        </KiribeTypography>

        <KiribeTypography
          sx={{
            mt: 1.5,
            fontFamily: "var(--font-body), 'Open Sans', sans-serif",
            fontSize: "1rem",
            lineHeight: 1.625,
            color: "#4A5565",
          }}
        >
          Join the Kiribé inner circle — curated film, television, and culture
          stories delivered to your inbox every week. No noise, only what matters.
        </KiribeTypography>

        <Box sx={{ mt: 3, width: 48, height: 2, bgcolor: "var(--color-mustard)" }} />

        {isSuccess ? (
          <KiribeTypography sx={{ mt: 3, color: "primary.main", fontSize: "1rem", lineHeight: 1.6 }}>
            Thanks — check your inbox to confirm your subscription.
          </KiribeTypography>
        ) : (
          <>
            {/* Column on mobile: side-by-side leaves the input ~130px wide, so
                the reader can never see the whole address they typed. */}
            <Stack
              component="form"
              onSubmit={onSubmit}
              noValidate
              direction={{ xs: "column", sm: "row" }}
              sx={{ mt: 3 }}
            >
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
                  minWidth: 0,
                  width: "100%",
                  border: "1px solid",
                  borderColor: touched && !valid ? "var(--color-danger)" : "#D1D5DC",
                  // Only collapse the shared edge when the button sits beside it.
                  borderRight: { xs: "1px solid", sm: "none" },
                  borderRightColor: {
                    xs: touched && !valid ? "var(--color-danger)" : "#D1D5DC",
                    sm: "transparent",
                  },
                  color: "#101828",
                  px: 2,
                  py: 1.5,
                  fontFamily: "var(--font-body), 'Open Sans', sans-serif",
                  // 16px on mobile — anything smaller makes iOS Safari zoom the
                  // viewport on focus and the reader loses the modal.
                  fontSize: { xs: "1rem", sm: "0.875rem" },
                  outline: "none",
                  "&::placeholder": { color: "#99A1AF" },
                  "&:focus": { borderColor: "primary.main" },
                }}
              />
              <Box
                component="button"
                type="submit"
                disabled={isPending || !canSubmit}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  width: { xs: "100%", sm: "auto" },
                  mt: { xs: 1.5, sm: 0 },
                  flexShrink: 0,
                  bgcolor: "primary.main",
                  color: "#fff",
                  border: "none",
                  px: 2.5,
                  py: 1.5,
                  cursor: "pointer",
                  fontFamily: "var(--font-headline), 'Outfit', sans-serif",
                  fontSize: "0.875rem",
                  lineHeight: "1.25rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  transition: "background-color var(--duration-fast) ease",
                  "&:hover": { bgcolor: "var(--color-burgundy-dark)" },
                  "&:disabled": { opacity: 0.6, cursor: "default" },
                }}
              >
                {isPending ? "…" : "Subscribe"}
                {!isPending && <ArrowForwardIcon sx={{ fontSize: 16 }} />}
              </Box>
            </Stack>

            {/* The label wraps to 2–3 lines on mobile, so the row is top-aligned
                and the box is nudged down to sit on the first line's optical
                centre rather than floating above the text. */}
            <FormControlLabel
              sx={{
                mt: 2,
                mx: 0,
                alignItems: "flex-start",
                gap: 1,
                "& .MuiFormControlLabel-label": { mt: "1px" },
              }}
              control={
                <Checkbox
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  size="small"
                  sx={{
                    p: 0,
                    mt: "1px",
                    flexShrink: 0,
                    color: "#99A1AF",
                    "&.Mui-checked": { color: "primary.main" },
                  }}
                />
              }
              label={
                <KiribeTypography sx={{ fontSize: "0.8125rem", lineHeight: 1.5, color: "#4A5565", textAlign: "left" }}>
                  I agree to receive editorial updates and accept the{" "}
                  <Box
                    component={NextLink}
                    href={PublicRoutes.privacy}
                    sx={{ color: "primary.main", textDecoration: "underline" }}
                  >
                    privacy policy
                  </Box>
                  .
                </KiribeTypography>
              }
            />

            <KiribeTypography sx={{ mt: 1.5, fontSize: "0.75rem", lineHeight: "1rem", color: "#99A1AF" }}>
              No spam, unsubscribe anytime. Your privacy is respected.
            </KiribeTypography>

            <Box sx={{ mt: 1.5, textAlign: "center" }}>
              <Box
                component="button"
                type="button"
                onClick={onClose}
                sx={{
                  border: "none",
                  bgcolor: "transparent",
                  cursor: "pointer",
                  fontFamily: "var(--font-body), 'Open Sans', sans-serif",
                  fontSize: "0.75rem",
                  lineHeight: "1rem",
                  color: "#99A1AF",
                  textDecoration: "underline",
                  "&:hover": { color: "#6A7282" },
                }}
              >
                No thanks, I&apos;ll pass for now
              </Box>
            </Box>
          </>
        )}
      </Box>

      {/* Gold bottom bar */}
      <Box sx={{ height: 4, bgcolor: "var(--color-mustard)" }} />
    </Dialog>
  );
}
