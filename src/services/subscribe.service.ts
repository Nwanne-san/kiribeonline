import { getPayloadClient } from "@/lib/payload/get-payload";
import {
  APP_URL,
  getResendClient,
  sendTransactionalEmail,
} from "@/lib/email/resend";
import { renderSubscribeWelcomeEmail } from "@/lib/email/templates/subscribe-welcome";
import { subscribeToNewsletter } from "@/server/newsletter";
import type { SubscribeFormOutput } from "@/lib/validation/subscribe";

/**
 * Fire-and-forget push to Mailchimp. Runs on the same edge as the caller so
 * we don't block the response on Mailchimp's round-trip time, and a Mailchimp
 * outage never regresses our own subscription flow.
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

/**
 * Send the "you're subscribed" welcome email. Returns true when the email was
 * dispatched successfully, false when Resend is not configured (no key set).
 */
async function sendWelcomeEmail(email: string): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    console.warn(
      "[subscribe] RESEND_API_KEY not set — skipping welcome email."
    );
    return false;
  }
  const { subject, html, text } = renderSubscribeWelcomeEmail({
    siteUrl: APP_URL,
  });
  return sendTransactionalEmail({
    to: email,
    subject,
    html,
    text,
    context: "[subscribe] welcome",
  });
}

export async function submitSubscribe(input: SubscribeFormOutput) {
  if (input.website) {
    throw new Error("Invalid submission");
  }

  const payload = await getPayloadClient();

  // Check for an existing subscriber entry.
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
    };

    if (sub.confirmed) {
      return {
        message: "You are already subscribed.",
        status: "already-subscribed" as const,
      };
    }

    // Previously pending — confirm them now and send the welcome email.
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
    pushToMailchimp(input.email, "subscribe-auto-confirm");
    void sendWelcomeEmail(input.email);
    return {
      message: "You're subscribed! Watch your inbox for updates.",
      status: "confirmed" as const,
    };
  }

  // New subscriber — create as confirmed immediately (no double opt-in).
  await payload.create({
    collection: "subscribers",
    data: {
      email: input.email,
      consent: input.consent,
      source: "website",
      confirmed: true,
      confirmedAt: new Date().toISOString(),
      confirmationToken: null,
    } as never,
    overrideAccess: true,
  });

  pushToMailchimp(input.email, "subscribe");
  void sendWelcomeEmail(input.email);

  return {
    message: "You're subscribed! Watch your inbox for updates.",
    status: "confirmed" as const,
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
  const email = String((sub as { email?: unknown }).email ?? "");
  if (email) {
    pushToMailchimp(email, "double-opt-in");
    void sendWelcomeEmail(email);
  }
  return { ok: true, status: "confirmed" };
}
