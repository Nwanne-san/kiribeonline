import { ApiMethods } from "../../types/service";
import type { ContactFormInput } from "@/lib/validation/contact";
import type { SubscribeFormInput } from "@/lib/validation/subscribe";

export const contactService = {
  submit: {
    path: "/api/contact",
    method: ApiMethods.POST,
  },
};

export const subscribeService = {
  submit: {
    path: "/api/subscribe",
    method: ApiMethods.POST,
  },
};

export type ContactSubmitResponse = { message: string };
export type SubscribeSubmitResponse = {
  message: string;
  status?: "pending" | "confirmed" | "already-subscribed";
};

export type ContactSubmitRequest = ContactFormInput;
export type SubscribeSubmitRequest = SubscribeFormInput;
