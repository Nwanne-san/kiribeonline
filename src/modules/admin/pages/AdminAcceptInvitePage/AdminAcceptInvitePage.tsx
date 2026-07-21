"use client";

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

function AcceptInviteForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
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
      setError(PASSWORD_HINT);
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

  if (done) {
    return (
      <AdminAuthShell title="Account activated" subtitle="Redirecting you to sign in…">
        <p className="text-sm leading-6 text-ink-secondary">
          Your password is set. You&rsquo;ll be sent to the sign-in page in a moment.
        </p>
      </AdminAuthShell>
    );
  }

  return (
    <AdminAuthShell
      title="Accept your invite"
      subtitle="Set a password to activate your Kiribé admin account."
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
          {loading ? "Activating…" : "Activate account"}
        </AdminButton>
      </form>
    </AdminAuthShell>
  );
}

export function AdminAcceptInvitePage() {
  return (
    <Suspense fallback={null}>
      <AcceptInviteForm />
    </Suspense>
  );
}
