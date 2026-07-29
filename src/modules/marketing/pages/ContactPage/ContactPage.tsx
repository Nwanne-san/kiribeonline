"use client";

import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import {
  EditorialContainer,
  EditorialSection,
  KiribeButton,
  KiribeTypography,
} from "@/modules/shared/components/ui";
import { FormTextField, FormTextArea } from "@/modules/shared/components/form";
import {
  contactFormDefaultValues,
  contactFormSchema,
} from "@/lib/validation/contact";
import { useFormValidator } from "@/utils/hooks/useFormValidator";
import { useMutationService } from "@/utils/hooks/useMutationService";
import type { ContactFormInput } from "@/lib/validation/contact";

import {
  contactService,
  type ContactSubmitResponse,
} from "@/services/marketing.service";

export function ContactPage() {
  const { control, handleSubmit, reset } = useFormValidator<ContactFormInput>({
    validationSchema: contactFormSchema,
    defaultValues: contactFormDefaultValues,
  });

  const { mutate, isPending } = useMutationService<ContactFormInput, ContactSubmitResponse>({
    service: contactService.submit,
    options: {
      successTitle: "Message sent",
      onSuccess: () => reset(),
    },
  });

  const onSubmit = handleSubmit((data) => mutate(data));

  return (
    <EditorialSection>
      <EditorialContainer>
        <KiribeTypography variant="h3">Contact</KiribeTypography>
        <KiribeTypography variant="body1" color="text.secondary" className="mt-2 mb-8">
          Questions, tips, or partnership ideas? Send us a note.
        </KiribeTypography>

        <Box component="form" onSubmit={onSubmit} noValidate>
          <Stack spacing={3} className="max-w-[560px]">
            <FormTextField
              control={control}
              name="name"
              label="Name"
              fullWidth
              required
            />
            <FormTextField
              control={control}
              name="email"
              label="Email"
              type="email"
              fullWidth
              required
            />
            <FormTextField
              control={control}
              name="subject"
              label="Subject"
              fullWidth
              required
            />
            <FormTextArea
              control={control}
              name="message"
              label="Message"
              fullWidth
              required
              minRows={5}
            />
            <Box className="none" aria-hidden="true">
              <FormTextField control={control} name="website" label="Website" />
            </Box>
            <KiribeButton type="submit" loading={isPending}>
              Send message
            </KiribeButton>
          </Stack>
        </Box>
      </EditorialContainer>
    </EditorialSection>
  );
}
