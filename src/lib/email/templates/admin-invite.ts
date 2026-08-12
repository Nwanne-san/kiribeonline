import { renderEmailShell, type EmailShellOutput } from "./shell";

/** Admin team invite email. Renders through the shared brand shell. */
export function renderAdminInviteEmail({
  acceptUrl,
  inviterName,
  role,
  brand = "Kiribé",
}: {
  acceptUrl: string;
  inviterName?: string;
  role?: string;
  brand?: string;
}): EmailShellOutput {
  const inviter = inviterName ?? "The editorial team";

  return renderEmailShell({
    subject: `An invitation to write for ${brand}`,
    preheader: `${inviter} has a seat for you at ${brand}. Claim it in a minute or two.`,
    kicker: "You are invited",
    heading: `A seat at the ${brand} desk`,
    paragraphs: [
      `${inviter} has invited you to contribute to ${brand}, the home for considered, unhurried writing on film, television, and the culture around them.`,
      `Accepting the invite drops you into the editorial admin, where you can draft pieces, upload art, and file for review. You set your own password on the way in. This link is the only thing standing between you and a blank page.`,
    ],
    infoRows: role
      ? [{ label: "Your role", value: role.replace(/^./, (c) => c.toUpperCase()) }]
      : undefined,
    cta: { label: "Accept invite", url: acceptUrl },
    finePrint:
      "This invite is single-use and expires in 7 days. If it was not meant for you, no reply is needed. The link will quietly expire on its own.",
    brand,
  });
}
