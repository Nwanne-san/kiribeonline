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

type ContactFormProps = {
  /**
   * Prefix for the generated input ids. Both the About page and the Contact
   * page render this form, so the ids must be unique per instance for the
   * `<label for>` associations to stay correct.
   */
  idPrefix?: string;
  /** Heading above the fields. */
  title?: string;
};

/** Shared "Send us a message" form — Figma parity across About and Contact. */
export function ContactForm({
  idPrefix = "contact",
  title = "Send us a message",
}: ContactFormProps = {}) {
  const [category, setCategory] = useState<Category>("editorial");

  // `subject` is required by the shared schema but never rendered as a visible
  // field — the category chips derive it. Seed the RHF default (and keep it in
  // sync on category change) so validation passes and the submit reaches the
  // API. Without this, RHF blocks the submit for an empty subject before the
  // handler ever runs, and the user sees nothing happen.
  const { control, handleSubmit, reset, setValue } =
    useFormValidator<ContactFormInput>({
      validationSchema: contactFormSchema,
      defaultValues: {
        ...contactFormDefaultValues,
        subject: CATEGORY_SUBJECT.editorial,
      },
    });

  const handleCategoryChange = (cat: Category) => {
    setCategory(cat);
    setValue("subject", CATEGORY_SUBJECT[cat], { shouldValidate: true });
  };

  const { mutate, isPending } = useMutationService<
    ContactFormInput,
    ContactSubmitResponse
  >({
    service: contactService.submit,
    options: {
      successTitle: "Message sent",
      onSuccess: () => {
        reset({
          ...contactFormDefaultValues,
          subject: CATEGORY_SUBJECT.editorial,
        });
        setCategory("editorial");
      },
    },
  });

  const onSubmit = handleSubmit((data) => mutate(data));

  const inputClass =
    "w-full bg-surface-alt border border-border px-4 py-3 font-body text-sm text-ink " +
    "placeholder:text-ink/40 outline-none transition-colors focus:border-burgundy";
  const labelClass =
    "mb-2 block font-headline text-xs uppercase tracking-[0.1em] text-muted";

  return (
    <form onSubmit={onSubmit} noValidate className="bg-white p-6 sm:p-10">
      <h3 className="font-headline text-lg font-normal text-[#1e2939]">
        {title}
      </h3>

      {/* Category toggle */}
      <div className="mt-6 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const active = category === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryChange(cat)}
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
              <label htmlFor={`${idPrefix}-name`} className={labelClass}>
                Full Name
              </label>
              <input
                {...field}
                id={`${idPrefix}-name`}
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
              <label htmlFor={`${idPrefix}-email`} className={labelClass}>
                Email Address
              </label>
              <input
                {...field}
                id={`${idPrefix}-email`}
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
              <label htmlFor={`${idPrefix}-message`} className={labelClass}>
                Message
              </label>
              <textarea
                {...field}
                id={`${idPrefix}-message`}
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
