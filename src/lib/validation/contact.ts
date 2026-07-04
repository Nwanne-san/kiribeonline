import { z } from "zod";
import { emailSchema, honeypotSchema, shortTextSchema } from "./helpers";

export const contactFormSchema = z.object({
  name: shortTextSchema("Name", 120),
  email: emailSchema,
  subject: shortTextSchema("Subject", 200),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(5000, "Message is too long"),
  website: honeypotSchema,
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;
export type ContactFormOutput = z.output<typeof contactFormSchema>;

export const contactFormDefaultValues: ContactFormInput = {
  name: "",
  email: "",
  subject: "",
  message: "",
  website: "",
};
