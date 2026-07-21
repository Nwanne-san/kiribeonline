"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AdminRoutes } from "@/routes/admin.routes";
import {
  AdminAuthShell,
  AuthPasswordField,
} from "@/modules/admin/components/AdminAuthShell";
import { AdminButton } from "@/modules/admin/components/ui/AdminPrimitives";

const MIN_PASSWORD = 10;
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{10,}$/;
const PASSWORD_HINT = `At least ${MIN_PASSWORD} characters, with a letter and a number.`;

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Missing-token branch is shown up-front rather than after submission — the
  // user has nothing to type here without a token, so failing early avoids a
  // wasted round-trip against the sensitive-rate-limit bucket.
  if (!token) {
    return (
      <AdminAuthShell
        title="Reset link missing"
        subtitle="This URL is incomplete or has been used already."
      >
        <div className="space-y-4">
          <p className="text-sm leading-6 text-ink-secondary">
            Request a new reset link and use the button in the email — copying
            the URL by hand can drop the token.
          </p>
          <Link
            href={AdminRoutes.forgotPassword}
            className="inline-block text-sm text-burgundy underline underline-offset-4 hover:text-burgundy-dark"
          >
            Request a new link
          </Link>
        </div>
      </AdminAuthShell>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!PASSWORD_RE.test(password)) {
      setError(PASSWORD_HINT);
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.message ?? "This reset link is invalid or has expired.");
        return;
      }
      setDone(true);
      setTimeout(() => router.replace(AdminRoutes.login), 1500);
    } catch {
      setError("Could not reset your password. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AdminAuthShell
        title="Password updated"
        subtitle="Redirecting you to sign in…"
      >
        <p className="text-sm leading-6 text-ink-secondary">
          You&rsquo;re signed out everywhere. Use your new password to sign back in.
        </p>
      </AdminAuthShell>
    );
  }

  return (
    <AdminAuthShell
      title="Choose a new password"
      subtitle="Enter your new password below. You'll be signed out of all other sessions."
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <AuthPasswordField
          label="New password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint={PASSWORD_HINT}
          required
        />
        <AuthPasswordField
          label="Confirm password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        {error && (
          <p
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        <AdminButton type="submit" disabled={loading} className="w-full">
          {loading ? "Updating…" : "Update password"}
        </AdminButton>
      </form>
    </AdminAuthShell>
  );
}

export function AdminResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}
