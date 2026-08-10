import { sendTransactionalEmail } from "@/lib/email/resend";
import { renderContactReceivedEmail } from "@/lib/email/templates/contact-received";
import { getPayloadClient } from "@/lib/payload/get-payload";
import type { ContactFormOutput } from "@/lib/validation/contact";

export async function submitContactMessage(
  input: ContactFormOutput,
  ipAddress?: string
) {
  if (input.website) {
    throw new Error("Invalid submission");
  }

  const payload = await getPayloadClient();

  await payload.create({
    collection: "contact-messages",
    data: {
      name: input.name,
      email: input.email,
      subject: input.subject,
      message: input.message,
      ipAddress: ipAddress ?? undefined,
    },
    overrideAccess: true,
  });

  const toEmail = process.env.CONTACT_TO_EMAIL;
  if (toEmail) {
    console.info(
      `[contact] New message from ${input.email} — notify ${toEmail} (email integration pending)`
    );
  }

  // Fire-and-forget the auto-reply to the sender. Failure is logged, never
  // surfaced — the message is already recorded in `contact-messages` and an
  // editor will see it in the inbox regardless. Keeping this off the response
  // path means the visitor's form submission stays snappy and rate-limit-safe
  // even if Resend is slow or unconfigured.
  const { subject, html, text } = renderContactReceivedEmail({
    name: input.name,
    subject: input.subject,
  });
  void sendTransactionalEmail({
    to: input.email,
    subject,
    html,
    text,
    context: "[contact] auto-reply",
  }).catch((err) => {
    console.error("[contact] auto-reply failed", err);
  });

  return { message: "Thanks for reaching out. We will get back to you soon." };
}
