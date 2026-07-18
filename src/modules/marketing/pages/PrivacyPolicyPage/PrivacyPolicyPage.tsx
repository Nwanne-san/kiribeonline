/*
  NOTE: This Privacy Policy is professionally drafted boilerplate tailored to
  Kiribé Online. It has NOT been reviewed by a lawyer. Have it reviewed by
  qualified counsel in the relevant jurisdiction(s) before launch.
*/

import NextLink from "next/link";
import { PublicRoutes } from "@/routes/public.routes";
import {
  LegalPageLayout,
  LegalProse,
  LegalList,
  type LegalSection,
} from "@/modules/marketing/components/LegalPageLayout";

/** Date this document was last revised (ISO YYYY-MM-DD). */
const LEGAL_LAST_UPDATED = "2026-07-18";

const CONTACT_EMAIL = "privacy@kiribe.com";

function ContactLink() {
  return (
    <NextLink href={PublicRoutes.contact}>contact form</NextLink>
  );
}

const SECTIONS: LegalSection[] = [
  {
    id: "introduction",
    title: "Introduction",
    body: (
      <LegalProse>
        <p>
          Kiribé Online (&ldquo;Kiribé&rdquo;, &ldquo;we&rdquo;,
          &ldquo;us&rdquo;, or &ldquo;our&rdquo;) is an entertainment journalism
          publication operated from Nigeria. This Privacy Policy explains what
          information we collect when you visit{" "}
          <strong>kiribe.com</strong>, how we use it, who we share it with, and
          the choices you have. It applies to our public website and the forms
          and newsletters we offer through it.
        </p>
        <p>
          We have written this policy in plain English. If anything here is
          unclear, please reach out through our <ContactLink /> and we will be
          glad to explain.
        </p>
      </LegalProse>
    ),
  },
  {
    id: "information-we-collect",
    title: "Information We Collect",
    body: (
      <LegalProse>
        <p>
          We collect only the information we need to run the publication, and we
          keep the amount to a minimum. Specifically:
        </p>
        <LegalList
          items={[
            <>
              <strong>Contact form submissions.</strong> When you write to us
              through our contact form, we receive the name, email address, and
              message you choose to provide, along with any details you include
              in your enquiry.
            </>,
            <>
              <strong>Newsletter subscriptions.</strong> When you subscribe to
              our newsletter you provide an email address. We use a
              double opt-in process: after you sign up, we email you to confirm
              the subscription, and you are only added to the list once you
              confirm.
            </>,
            <>
              <strong>Analytics data.</strong> When analytics are enabled, we
              use Google Analytics 4 to understand, in aggregate, how readers
              use the site — pages viewed, approximate location, device and
              browser type, and referring links. This helps us improve our
              journalism and the reading experience.
            </>,
            <>
              <strong>Server logs and technical data.</strong> Like most
              websites, our servers automatically record technical information
              such as your IP address, request time, and the pages requested. We
              use this to keep the site secure, diagnose problems, and enforce
              rate limits that protect our forms and endpoints from abuse.
            </>,
          ]}
        />
        <p>
          We do not knowingly collect sensitive personal information, and we do
          not ask you to create an account to read Kiribé.
        </p>
      </LegalProse>
    ),
  },
  {
    id: "how-we-use-information",
    title: "How We Use Your Information",
    body: (
      <LegalProse>
        <p>We use the information described above to:</p>
        <LegalList
          items={[
            "Respond to enquiries, pitches, corrections, and other messages you send us.",
            "Deliver our newsletter to subscribers who have confirmed their subscription.",
            "Understand how our content is read so we can improve it.",
            "Keep the website secure, prevent abuse, and enforce rate limits.",
            "Comply with our legal obligations and enforce our Terms of Use.",
          ]}
        />
        <p>
          We do not sell your personal information, and we do not use it to build
          advertising profiles about you.
        </p>
      </LegalProse>
    ),
  },
  {
    id: "legal-basis",
    title: "Legal Basis for Processing",
    body: (
      <LegalProse>
        <p>
          Where data protection law requires a legal basis for processing, we
          rely on the following, depending on the situation:
        </p>
        <LegalList
          items={[
            <>
              <strong>Your consent</strong> — for example, when you subscribe to
              our newsletter or agree to analytics cookies. You can withdraw
              consent at any time.
            </>,
            <>
              <strong>Our legitimate interests</strong> — for example, keeping
              the site secure, preventing abuse, and understanding readership in
              aggregate, balanced against your rights and expectations.
            </>,
            <>
              <strong>Legal obligation</strong> — where we must retain or
              disclose information to comply with applicable law.
            </>,
          ]}
        />
      </LegalProse>
    ),
  },
  {
    id: "cookies",
    title: "Cookies",
    body: (
      <LegalProse>
        <p>We use a small number of cookies and similar technologies:</p>
        <LegalList
          items={[
            <>
              <strong>Administrative session cookie.</strong> A session cookie is
              used only to keep our editorial team signed in to the private admin
              area. It is not set for ordinary readers of the site.
            </>,
            <>
              <strong>Analytics cookies.</strong> When analytics are enabled,
              Google Analytics may set cookies to measure site usage in
              aggregate. These are only used where permitted.
            </>,
          ]}
        />
        <p>
          You can control or delete cookies through your browser settings.
          Blocking cookies will not prevent you from reading Kiribé.
        </p>
      </LegalProse>
    ),
  },
  {
    id: "third-parties",
    title: "Third-Party Service Providers",
    body: (
      <LegalProse>
        <p>
          We rely on trusted third parties to operate the publication. Each
          processes data only as needed to provide its service, and each
          maintains its own privacy practices:
        </p>
        <LegalList
          items={[
            <>
              <strong>Vercel</strong> — website hosting and content delivery.
            </>,
            <>
              <strong>Neon</strong> — the managed PostgreSQL database that stores
              our editorial content and form submissions.
            </>,
            <>
              <strong>Cloudflare R2</strong> — storage and delivery of images and
              other media.
            </>,
            <>
              <strong>Google Analytics</strong> — aggregate website usage
              measurement, when enabled.
            </>,
            <>
              <strong>Our email provider</strong> — sending newsletter
              confirmations, newsletters, and replies to your enquiries.
            </>,
          ]}
        />
        <p>
          Some of these providers may process data outside Nigeria. Where that
          happens, we take reasonable steps to ensure your information remains
          protected.
        </p>
      </LegalProse>
    ),
  },
  {
    id: "data-retention",
    title: "Data Retention",
    body: (
      <LegalProse>
        <p>
          We keep personal information only for as long as we need it for the
          purposes described in this policy:
        </p>
        <LegalList
          items={[
            "Contact form messages are retained while we handle your enquiry and for a reasonable period afterwards for our records.",
            "Newsletter subscriptions are retained until you unsubscribe.",
            "Server logs are retained for a limited period for security and diagnostics, then deleted or anonymised.",
            "Aggregate analytics data is retained according to our analytics provider's settings.",
          ]}
        />
      </LegalProse>
    ),
  },
  {
    id: "your-rights",
    title: "Your Rights and Choices",
    body: (
      <LegalProse>
        <p>
          Depending on where you live, you may have rights over your personal
          information, including the right to access, correct, or delete it, and
          to object to or restrict certain processing. You can:
        </p>
        <LegalList
          items={[
            <>
              Unsubscribe from our newsletter at any time using the link in every
              email.
            </>,
            <>
              Request access to, correction of, or deletion of your personal
              information by contacting us through our <ContactLink /> or by
              emailing{" "}
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            </>,
          ]}
        />
        <p>
          We will respond to legitimate requests within a reasonable time and in
          line with applicable law.
        </p>
      </LegalProse>
    ),
  },
  {
    id: "childrens-privacy",
    title: "Children's Privacy",
    body: (
      <LegalProse>
        <p>
          Kiribé is intended for a general adult audience. We do not knowingly
          collect personal information from children. If you believe a child has
          provided us with personal information, please contact us and we will
          take appropriate steps to delete it.
        </p>
      </LegalProse>
    ),
  },
  {
    id: "changes",
    title: "Changes to This Policy",
    body: (
      <LegalProse>
        <p>
          We may update this Privacy Policy from time to time to reflect changes
          in our practices or the law. When we do, we will revise the &ldquo;Last
          updated&rdquo; date at the top of this page. Significant changes may be
          communicated more prominently. We encourage you to review this page
          periodically.
        </p>
      </LegalProse>
    ),
  },
  {
    id: "contact",
    title: "Contact Us",
    body: (
      <LegalProse>
        <p>
          If you have questions about this Privacy Policy or how we handle your
          information, please reach out through our <ContactLink /> or email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Kiribé Online
          is operated from Nigeria.
        </p>
      </LegalProse>
    ),
  },
];

export function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      kicker="Legal"
      title="Privacy Policy"
      intro="How Kiribé Online collects, uses, and protects your information — written plainly, because trust starts with clarity."
      lastUpdated={LEGAL_LAST_UPDATED}
      sections={SECTIONS}
    />
  );
}
