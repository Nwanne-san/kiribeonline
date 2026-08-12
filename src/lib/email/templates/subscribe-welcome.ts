import { renderEmailShell, type EmailShellOutput } from "./shell";

/** Post-confirmation welcome email. Renders through the shared brand shell. */
export function renderSubscribeWelcomeEmail({
  brand = "Kiribé",
  siteUrl = "https://kiribeonline.com",
}: {
  brand?: string;
  siteUrl?: string;
}): EmailShellOutput {
  return renderEmailShell({
    subject: `Welcome to ${brand}. A seat by the window.`,
    preheader: `You are in. Here is a first look at what is currently on the site.`,
    kicker: "Welcome in",
    heading: "You are in the story.",
    paragraphs: [
      `Thank you for joining ${brand}. From here on you will receive our editorial dispatches directly. Curated pieces on film, television, and the moods that circle around them. No listicles, no algorithmic churn, no unsolicited noise.`,
      `We publish when a story is ready, not when a calendar tells us to. In practice that means fewer emails than you probably expect, and a lot more thought behind each one. In the meantime, the archive is open. Dive in whenever you have twenty minutes and a good drink.`,
    ],
    cta: { label: "Read the latest", url: siteUrl },
    finePrint:
      "You can step away at any time. Every future email carries a one-click unsubscribe link at the bottom. No forms, no follow-ups, no guilt.",
    footerNote: `You subscribed at ${siteUrl}.`,
    brand,
  });
}
