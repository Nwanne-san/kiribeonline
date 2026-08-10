import { renderEmailShell, type EmailShellOutput } from "./shell";

/**
 * Auto-reply sent to visitors after they submit the contact form. Confirms the
 * message landed and quietly manages expectations on the reply timeline.
 */
export function renderContactReceivedEmail({
  name,
  subject: messageSubject,
  brand = "Kiribé",
}: {
  name: string;
  subject: string;
  brand?: string;
}): EmailShellOutput {
  const firstName = name.trim().split(/\s+/)[0] || "there";

  return renderEmailShell({
    subject: `We've got your note — thanks for reaching out to ${brand}`,
    preheader: `A quick confirmation that your message landed safely with the editorial team.`,
    kicker: "Message received",
    heading: `Thank you, ${firstName}.`,
    paragraphs: [
      `Your message reached the ${brand} editorial team, and someone will read it personally. We answer every message that isn't obvious spam, and we try to reply within two working days — a little longer during festival season.`,
      `A copy of what you sent us is below, in case you want it for your records.`,
    ],
    infoRows: [
      { label: "Subject", value: messageSubject },
      { label: "From", value: name },
    ],
    finePrint:
      "No reply is needed to this note — it is an automatic acknowledgement. Our response will come from a real editor at a real desk.",
    brand,
  });
}
