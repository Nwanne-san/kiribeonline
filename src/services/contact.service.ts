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

  return { message: "Thanks for reaching out. We will get back to you soon." };
}
