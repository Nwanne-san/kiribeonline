import { z } from "zod";
import { emailSchema, honeypotSchema } from "./helpers";

export const subscribeFormSchema = z.object({
  email: emailSchema,
  consent: z
    .boolean()
    .refine((val) => val === true, { message: "You must agree to receive emails" }),
  website: honeypotSchema,
});

export type SubscribeFormInput = z.infer<typeof subscribeFormSchema>;
export type SubscribeFormOutput = z.output<typeof subscribeFormSchema>;

export const subscribeFormDefaultValues: SubscribeFormInput = {
  email: "",
  consent: false,
  website: "",
};
