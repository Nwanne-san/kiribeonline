"use client";

import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AdminRoutes } from "@/routes/admin.routes";
import { KiribeButton, KiribeTextField, KiribeTypography } from "@/modules/shared/components/ui";

const MIN_PASSWORD = 10;
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{10,}$/;

function AcceptInviteForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("This invite link is missing its token. Ask your admin to resend it.");
      return;
    }
    if (!PASSWORD_RE.test(password)) {
      setError(`Password must be at least ${MIN_PASSWORD} characters and include a letter and a number.`);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? "This invite link is invalid or has expired.");
        return;
      }
      setDone(true);
      setTimeout(() => router.replace(AdminRoutes.login), 1500);
    } catch {
      setError("Could not activate your account. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={onSubmit}
      sx={{
        width: "100%",
        maxWidth: 420,
        bgcolor: "background.paper",
        p: { xs: 3, sm: 4 },
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <KiribeTypography variant="h4" sx={{ mb: 0.5 }}>
        Accept your invite
      </KiribeTypography>
      <KiribeTypography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Set a password to activate your Kiribé admin account.
      </KiribeTypography>

      {done ? (
        <KiribeTypography variant="body2" sx={{ color: "primary.main" }}>
          Your account is active. Redirecting you to sign in…
        </KiribeTypography>
      ) : (
        <Stack spacing={2}>
          <KiribeTextField
            label="New password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            autoComplete="new-password"
            helperText={`At least ${MIN_PASSWORD} characters, with a letter and a number.`}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword((v) => !v)} edge="end" aria-label="Toggle password">
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <KiribeTextField
            label="Confirm password"
            type={showPassword ? "text" : "password"}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            fullWidth
            autoComplete="new-password"
          />
          {error && (
            <KiribeTypography variant="body2" color="error">
              {error}
            </KiribeTypography>
          )}
          <KiribeButton type="submit" fullWidth disabled={loading}>
            {loading ? "Activating…" : "Activate account"}
          </KiribeButton>
        </Stack>
      )}
    </Box>
  );
}

export function AdminAcceptInvitePage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#1C1214",
        backgroundImage:
          "repeating-linear-gradient(90deg, rgba(201,162,39,0.08) 0, rgba(201,162,39,0.08) 1px, transparent 1px, transparent 24px)",
        px: 2,
      }}
    >
      <Suspense fallback={null}>
        <AcceptInviteForm />
      </Suspense>
    </Box>
  );
}
