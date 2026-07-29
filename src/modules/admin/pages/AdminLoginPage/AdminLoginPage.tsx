"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AdminRoutes } from "@/routes/admin.routes";
import {
  AdminAuthShell,
  AuthField,
  AuthPasswordField,
} from "@/modules/admin/components/AdminAuthShell";
import { AdminButton } from "@/modules/admin/components/ui/AdminPrimitives";
import { unwrapApiData } from "@/lib/api/unwrap";

/**
 * `?next=` is a raw string from the URL. String-prefix checks (`startsWith`)
 * are the wrong primitive for URL safety — they miss backslash-confusion
 * (`/admin\@evil.com`), match `/adminfoo` as valid, and rely on downstream
 * parsers agreeing with the check. Parse instead against the current origin,
 * then require the resulting URL to stay same-origin under a strict
 * `/admin` subtree.
 *
 * Falls through to `AdminRoutes.home` on any parse failure or off-path input,
 * which also covers the empty-string case.
 */
function sanitizeNextParam(next: string | null): string {
  if (!next) return AdminRoutes.home;
  try {
    const origin = window.location.origin;
    const parsed = new URL(next, origin);
    if (parsed.origin !== origin) return AdminRoutes.home;
    if (
      parsed.pathname !== "/admin" &&
      !parsed.pathname.startsWith("/admin/")
    ) {
      return AdminRoutes.home;
    }
    // Never send the user back to the login page itself — that would loop.
    if (parsed.pathname === "/admin/login") return AdminRoutes.home;
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return AdminRoutes.home;
  }
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const nextTarget = sanitizeNextParam(params.get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      // When `next` came from the shell's session-expiry redirect this lands the
      // reader back where they were; otherwise the admin index picks a landing
      // page appropriate to the user's capabilities.
      router.replace(nextTarget);
    } catch {
      setError("Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminAuthShell
      title="Kiribé Admin"
      subtitle="Sign in to manage content."
      footer={
        <>
          Trouble signing in? Ask a workspace admin — sessions time out after 2
          hours of inactivity.
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <AuthField
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <AuthPasswordField
          label="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && (
          <p
            role="alert"
            className="rounded-none border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        <AdminButton type="submit" disabled={loading} className="w-full">
          {loading ? "Signing in…" : "Sign in"}
        </AdminButton>
        <div className="text-center">
          <Link
            href={AdminRoutes.forgotPassword}
            className="text-sm text-burgundy underline underline-offset-4 hover:text-burgundy-dark"
          >
            Forgot password?
          </Link>
        </div>
      </form>
    </AdminAuthShell>
  );
}

export function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
