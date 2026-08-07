import { randomBytes } from "node:crypto";
import { getPayloadClient } from "@/lib/payload/get-payload";
import {
  APP_URL,
  getResendClient,
  sendTransactionalEmail,
} from "@/lib/email/resend";
import { renderSubscribeConfirmationEmail } from "@/lib/email/templates/subscribe-confirmation";
import { subscribeToNewsletter } from "@/server/newsletter";
import type { SubscribeFormOutput } from "@/lib/validation/subscribe";

/**
 * Fire-and-forget push to Mailchimp. Runs on the same edge as the caller so
 * we don't block the confirmation redirect on Mailchimp's response time, and
 * a Mailchimp outage never regresses our own double-opt-in flow.
 */
function pushToMailchimp(email: string, source = "website"): void {
  void subscribeToNewsletter({ email, source, alreadyConfirmed: true }).then(
    (result) => {
      if (!result.ok && result.reason !== "not-configured") {
        console.warn(`[subscribe] Mailchimp sync failed: ${result.reason}`);
      }
    }
  );
}

function newToken() {
  return randomBytes(24).toString("hex");
}

function buildConfirmUrl(token: string) {
  return `${APP_URL}/api/subscribe/confirm?token=${encodeURIComponent(token)}`;
}

async function sendConfirmationEmail(email: string, token: string): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    console.warn(
      "[subscribe] RESEND_API_KEY not set — skipping confirmation email; subscriber auto-confirmed."
    );
    return false;
  }
  const { subject, html, text } = renderSubscribeConfirmationEmail({
    confirmUrl: buildConfirmUrl(token),
  });
  return sendTransactionalEmail({
    to: email,
    subject,
    html,
    text,
    context: "[subscribe] confirmation",
  });
}

export async function submitSubscribe(input: SubscribeFormOutput) {
  if (input.website) {
    throw new Error("Invalid submission");
  }

  const payload = await getPayloadClient();

  const existing = await payload.find({
    collection: "subscribers",
    where: { email: { equals: input.email } },
    limit: 1,
    overrideAccess: true,
  });

  if (existing.docs.length > 0) {
    const sub = existing.docs[0] as {
      id: string | number;
      confirmed?: boolean;
      confirmationToken?: string;
    };
    if (sub.confirmed) {
      return {
        message: "You are already subscribed.",
        status: "already-subscribed" as const,
      };
    }
    const token = sub.confirmationToken ?? newToken();
    if (!sub.confirmationToken) {
      await payload.update({
        collection: "subscribers",
        id: sub.id,
        data: { confirmationToken: token } as never,
        overrideAccess: true,
      });
    }
    const sent = await sendConfirmationEmail(input.email, token);
    if (!sent) {
      await payload.update({
        collection: "subscribers",
        id: sub.id,
        data: { confirmed: true, confirmedAt: new Date().toISOString() } as never,
        overrideAccess: true,
      });
      pushToMailchimp(input.email, "subscribe-auto-confirm");
      return {
        message: "You are subscribed. Watch your inbox for updates.",
        status: "confirmed" as const,
      };
    }
    return {
      message: "We resent the confirmation link. Please check your inbox.",
      status: "pending" as const,
    };
  }

  const token = newToken();
  await payload.create({
    collection: "subscribers",
    data: {
      email: input.email,
      consent: input.consent,
      source: "website",
      confirmed: false,
      confirmationToken: token,
    } as never,
    overrideAccess: true,
  });

  const sent = await sendConfirmationEmail(input.email, token);
  if (!sent) {
    const fresh = await payload.find({
      collection: "subscribers",
      where: { email: { equals: input.email } },
      limit: 1,
      overrideAccess: true,
    });
    const doc = fresh.docs[0] as { id: string | number } | undefined;
    if (doc) {
      await payload.update({
        collection: "subscribers",
        id: doc.id,
        data: { confirmed: true, confirmedAt: new Date().toISOString() } as never,
        overrideAccess: true,
      });
    }
    pushToMailchimp(input.email, "subscribe-auto-confirm");
    return {
      message: "You are subscribed. Watch your inbox for updates.",
      status: "confirmed" as const,
    };
  }

  return {
    message: "Check your inbox to confirm your subscription.",
    status: "pending" as const,
  };
}

export async function confirmSubscriber(token: string): Promise<{
  ok: boolean;
  status: "confirmed" | "already-confirmed" | "invalid";
}> {
  if (!token) return { ok: false, status: "invalid" };
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "subscribers",
    where: { confirmationToken: { equals: token } },
    limit: 1,
    overrideAccess: true,
  });
  const sub = result.docs[0] as
    | { id: string | number; confirmed?: boolean }
    | undefined;
  if (!sub) return { ok: false, status: "invalid" };
  if (sub.confirmed) return { ok: true, status: "already-confirmed" };
  await payload.update({
    collection: "subscribers",
    id: sub.id,
    data: {
      confirmed: true,
      confirmedAt: new Date().toISOString(),
      confirmationToken: null,
    } as never,
    overrideAccess: true,
  });
  // Read the confirmed email back off the row — we intentionally don't accept
  // it as a route arg to avoid a token-mismatch attack.
  const email = String((sub as { email?: unknown }).email ?? "");
  if (email) pushToMailchimp(email, "double-opt-in");
  return { ok: true, status: "confirmed" };
}
