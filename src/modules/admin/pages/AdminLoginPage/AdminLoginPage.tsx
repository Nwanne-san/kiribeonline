"use client";

import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminRoutes } from "@/routes/admin.routes";
import { KiribeButton, KiribeTextField, KiribeTypography } from "@/modules/shared/components/ui";
import { unwrapApiData } from "@/lib/api/unwrap";

export function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.message ?? "Invalid email or password.");
        return;
      }
      unwrapApiData(json);
      // Route through the admin index so the server picks the right landing
      // page for this user's capabilities (contributors can't open the
      // analytics dashboard and would otherwise hit a 403).
      router.replace(AdminRoutes.home);
    } catch {
      setError("Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#1C1214",
        backgroundImage: "repeating-linear-gradient(90deg, rgba(201,162,39,0.08) 0, rgba(201,162,39,0.08) 1px, transparent 1px, transparent 24px)",
        px: 2,
      }}
    >
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
          Kiribe Admin
        </KiribeTypography>
        <KiribeTypography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Sign in to manage content.
        </KiribeTypography>
        <Stack spacing={2}>
          <KiribeTextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
          />
          <KiribeTextField
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
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
          {error && (
            <KiribeTypography variant="body2" color="error">
              {error}
            </KiribeTypography>
          )}
          <KiribeButton type="submit" fullWidth disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </KiribeButton>
        </Stack>
      </Box>
    </Box>
  );
}
