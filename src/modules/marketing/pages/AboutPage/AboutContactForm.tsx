"use client";

import { useState } from "react";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import { useMutationService } from "@/utils/hooks/useMutationService";
import {
  contactFormSchema,
  contactFormDefaultValues,
  type ContactFormInput,
} from "@/lib/validation/contact";
import {
  contactService,
  type ContactSubmitResponse,
} from "@/services/marketing.service";
import { Controller } from "react-hook-form";

const CATEGORIES = ["editorial", "press", "partnership", "other"] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_SUBJECT: Record<Category, string> = {
  editorial: "Editorial enquiry",
  press: "Press & media enquiry",
  partnership: "Partnership enquiry",
  other: "General enquiry",
};

/** Contact form for the About page — matches Figma "Send us a message". */
export function AboutContactForm() {
  const [category, setCategory] = useState<Category>("editorial");

  const { control, handleSubmit, reset } = useFormValidator<ContactFormInput>({
    validationSchema: contactFormSchema,
    defaultValues: contactFormDefaultValues,
  });

  const { mutate, isPending } = useMutationService<
    ContactFormInput,
    ContactSubmitResponse
  >({
    service: contactService.submit,
    options: {
      successTitle: "Message sent",
      onSuccess: () => {
        reset();
        setCategory("editorial");
      },
    },
  });

  const onSubmit = handleSubmit((data) =>
    mutate({ ...data, subject: CATEGORY_SUBJECT[category] }),
  );

  const inputClass =
    "w-full bg-surface-alt border border-border px-4 py-3 font-body text-sm text-ink " +
    "placeholder:text-ink/40 outline-none transition-colors focus:border-burgundy";
  const labelClass =
    "mb-2 block font-headline text-xs uppercase tracking-[0.1em] text-muted";

  return (
    <form onSubmit={onSubmit} noValidate className="bg-white p-10">
      <h3 className="font-headline text-lg font-normal text-[#1e2939]">
        Send us a message
      </h3>

      {/* Category toggle */}
      <div className="mt-6 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const active = category === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              aria-pressed={active}
              className={
                "px-4 py-1.5 font-headline text-xs uppercase tracking-[0.1em] transition-colors " +
                (active
                  ? "border border-burgundy bg-burgundy text-white"
                  : "border border-divider text-ink-secondary hover:border-burgundy hover:text-burgundy")
              }
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Name + email */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <div>
              <label htmlFor="about-name" className={labelClass}>
                Full Name
              </label>
              <input
                {...field}
                id="about-name"
                type="text"
                placeholder="Your name"
                className={inputClass}
              />
              {fieldState.error && (
                <p className="mt-1 font-body text-xs text-danger">
                  {fieldState.error.message}
                </p>
              )}
            </div>
          )}
        />
        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <div>
              <label htmlFor="about-email" className={labelClass}>
                Email Address
              </label>
              <input
                {...field}
                id="about-email"
                type="email"
                placeholder="you@example.com"
                className={inputClass}
              />
              {fieldState.error && (
                <p className="mt-1 font-body text-xs text-danger">
                  {fieldState.error.message}
                </p>
              )}
            </div>
          )}
        />
      </div>

      {/* Message */}
      <div className="mt-6">
        <Controller
          control={control}
          name="message"
          render={({ field, fieldState }) => (
            <div>
              <label htmlFor="about-message" className={labelClass}>
                Message
              </label>
              <textarea
                {...field}
                id="about-message"
                rows={6}
                placeholder="Tell us what's on your mind…"
                className={inputClass + " resize-y"}
              />
              {fieldState.error && (
                <p className="mt-1 font-body text-xs text-danger">
                  {fieldState.error.message}
                </p>
              )}
            </div>
          )}
        />
      </div>

      {/* Honeypot */}
      <div className="hidden" aria-hidden="true">
        <Controller
          control={control}
          name="website"
          render={({ field }) => (
            <input {...field} tabIndex={-1} autoComplete="off" />
          )}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-6 inline-flex items-center gap-3 bg-burgundy px-8 py-3 font-headline text-sm uppercase tracking-[0.1em] text-white transition-colors hover:bg-burgundy-dark disabled:opacity-60"
      >
        {isPending ? "Sending…" : "Send Message"}
        <ArrowForwardIcon sx={{ fontSize: 16 }} />
      </button>
    </form>
  );
}
