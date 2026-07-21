"use client";

import Link from "next/link";
import { useState } from "react";
import { AdminRoutes } from "@/routes/admin.routes";
import {
  AdminAuthShell,
  AuthField,
} from "@/modules/admin/components/AdminAuthShell";
import { AdminButton } from "@/modules/admin/components/ui/AdminPrimitives";

export function AdminForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // The server intentionally returns the same generic 200 for every branch
      // so this UI has no user-enumeration surface either — success and
      // "unknown email" both land here.
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.message ?? "Could not send reset link. Try again.");
        return;
      }
      setSent(true);
    } catch {
      setError("Could not send reset link. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AdminAuthShell
        title="Check your inbox"
        subtitle="If an account exists for that email, a reset link is on its way."
      >
        <div className="space-y-4">
          <p className="text-sm leading-6 text-ink-secondary">
            The link is single-use and expires in 30 minutes. If nothing arrives
            in a few minutes, check your spam folder or try again.
          </p>
          <Link
            href={AdminRoutes.login}
            className="inline-block text-sm text-burgundy underline underline-offset-4 hover:text-burgundy-dark"
          >
            Back to sign in
          </Link>
        </div>
      </AdminAuthShell>
    );
  }

  return (
    <AdminAuthShell
      title="Reset your password"
      subtitle="Enter the email you sign in with. We'll send a link to choose a new password."
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
        {error && (
          <p
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        <AdminButton type="submit" disabled={loading} className="w-full">
          {loading ? "Sending…" : "Send reset link"}
        </AdminButton>
        <div className="text-center">
          <Link
            href={AdminRoutes.login}
            className="text-sm text-burgundy underline underline-offset-4 hover:text-burgundy-dark"
          >
            Back to sign in
          </Link>
        </div>
      </form>
    </AdminAuthShell>
  );
}
