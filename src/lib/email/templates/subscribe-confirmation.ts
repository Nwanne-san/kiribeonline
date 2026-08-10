import { renderEmailShell, type EmailShellOutput } from "./shell";

/** Subscription double opt-in email. Renders through the shared brand shell. */
export function renderSubscribeConfirmationEmail({
  confirmUrl,
  brand = "Kiribé",
}: {
  confirmUrl: string;
  brand?: string;
}): EmailShellOutput {
  return renderEmailShell({
    subject: `One tap and you're in — confirm your ${brand} subscription`,
    preheader: `Tap the button to finish signing up. It takes about two seconds.`,
    kicker: "Almost there",
    heading: "Confirm your subscription",
    paragraphs: [
      `Thank you for signing up for the ${brand} newsletter. Before we start writing to you, we need to make sure this inbox is really yours — tap the button below to lock in your subscription.`,
      `Once you confirm, you'll receive our editorial dispatches: film, television, and culture, written slowly and sent sparingly. No promotions, no reshuffled headlines, no filler.`,
    ],
    cta: { label: "Confirm subscription", url: confirmUrl },
    finePrint:
      "Didn't ask to subscribe? No action needed — this email is the only one you'll hear from us until you confirm. It self-destructs quietly if you ignore it.",
    footerNote: "You are receiving this because someone entered your email at kiribeonline.com.",
    brand,
  });
}
