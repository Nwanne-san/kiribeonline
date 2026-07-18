/*
  NOTE: These Terms of Use are professionally drafted boilerplate tailored to
  Kiribé Online. They have NOT been reviewed by a lawyer. Have them reviewed by
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

const CONTACT_EMAIL = "legal@kiribe.com";

function ContactLink() {
  return <NextLink href={PublicRoutes.contact}>contact form</NextLink>;
}

const SECTIONS: LegalSection[] = [
  {
    id: "acceptance",
    title: "Acceptance of These Terms",
    body: (
      <LegalProse>
        <p>
          Welcome to Kiribé Online (&ldquo;Kiribé&rdquo;, &ldquo;we&rdquo;,
          &ldquo;us&rdquo;, or &ldquo;our&rdquo;), an entertainment journalism
          publication operated from Nigeria. By accessing or using{" "}
          <strong>kiribe.com</strong> (the &ldquo;Site&rdquo;), you agree to be
          bound by these Terms of Use and by our{" "}
          <NextLink href={PublicRoutes.privacy}>Privacy Policy</NextLink>. If you
          do not agree with these terms, please do not use the Site.
        </p>
        <p>
          We may update these terms from time to time. Your continued use of the
          Site after changes take effect means you accept the revised terms.
        </p>
      </LegalProse>
    ),
  },
  {
    id: "content-ownership",
    title: "Content Ownership and Licence",
    body: (
      <LegalProse>
        <p>
          All content published on Kiribé — including articles, reviews, essays,
          photographs, illustrations, video, audio, logos, and the design of the
          Site itself — is owned by Kiribé or its licensors and is protected by
          copyright and other intellectual property laws.
        </p>
        <p>
          We grant you a limited, personal, non-exclusive, non-transferable, and
          revocable licence to access and read our content for your own
          non-commercial use. This licence does <strong>not</strong> allow you
          to:
        </p>
        <LegalList
          items={[
            "Republish, redistribute, or sell our content without our written permission.",
            "Copy substantial portions of the Site or create derivative works from it.",
            "Use automated systems to scrape, harvest, or mine our content.",
            "Remove or alter any copyright, trademark, or attribution notices.",
          ]}
        />
        <p>
          You are welcome to share links to our articles and to quote briefly
          from them with clear attribution and a link back to the original.
        </p>
      </LegalProse>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable Use",
    body: (
      <LegalProse>
        <p>When using the Site, you agree not to:</p>
        <LegalList
          items={[
            "Use the Site for any unlawful purpose or in violation of these terms.",
            "Attempt to gain unauthorised access to our systems, accounts, or the private admin area.",
            "Interfere with or disrupt the Site, its security, or its infrastructure, including by circumventing rate limits.",
            "Transmit malware, spam, or other harmful or deceptive material.",
            "Misrepresent your identity or impersonate any person or organisation.",
          ]}
        />
      </LegalProse>
    ),
  },
  {
    id: "user-submissions",
    title: "User Submissions",
    body: (
      <LegalProse>
        <p>
          If you send us content through our contact form — such as a story
          pitch, tip, correction, or feedback (a &ldquo;Submission&rdquo;) — you
          are responsible for ensuring it is accurate and that you have the right
          to share it. Please do not send confidential information you do not
          wish us to use.
        </p>
        <p>
          By making a Submission, you grant Kiribé a non-exclusive, royalty-free,
          worldwide licence to use, reproduce, edit, and publish it in connection
          with our journalism and the operation of the Site. We are not obliged
          to use, respond to, or return any Submission, and we may treat
          Submissions as non-confidential.
        </p>
      </LegalProse>
    ),
  },
  {
    id: "third-party-links",
    title: "Third-Party Links and Embeds",
    body: (
      <LegalProse>
        <p>
          The Site may contain links to third-party websites and may embed
          content such as videos, social media posts, or audio from other
          services. We provide these for convenience and context only. We do not
          control and are not responsible for the content, privacy practices, or
          availability of third-party services, and their inclusion does not
          imply our endorsement. Your use of third-party services is governed by
          their own terms.
        </p>
      </LegalProse>
    ),
  },
  {
    id: "disclaimers",
    title: "Disclaimers",
    body: (
      <LegalProse>
        <p>
          Kiribé publishes journalism, criticism, and opinion. Reviews and
          opinion pieces reflect the views of their authors. While we strive for
          accuracy and correct errors when we find them, the Site and its content
          are provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo;
          basis, without warranties of any kind, whether express or implied,
          including as to accuracy, completeness, fitness for a particular
          purpose, or uninterrupted availability.
        </p>
        <p>
          Nothing on the Site constitutes professional advice, and you should not
          rely on it as such.
        </p>
      </LegalProse>
    ),
  },
  {
    id: "limitation-of-liability",
    title: "Limitation of Liability",
    body: (
      <LegalProse>
        <p>
          To the fullest extent permitted by law, Kiribé and its team will not be
          liable for any indirect, incidental, special, consequential, or
          punitive damages, or for any loss of data, revenue, or goodwill,
          arising out of or in connection with your use of — or inability to use
          — the Site or its content. Nothing in these terms excludes or limits
          any liability that cannot lawfully be excluded or limited.
        </p>
      </LegalProse>
    ),
  },
  {
    id: "termination",
    title: "Termination",
    body: (
      <LegalProse>
        <p>
          We may suspend or restrict access to the Site, in whole or in part, at
          any time and without notice, including where we reasonably believe you
          have breached these terms. The provisions concerning content ownership,
          disclaimers, limitation of liability, and governing law survive any
          termination.
        </p>
      </LegalProse>
    ),
  },
  {
    id: "governing-law",
    title: "Governing Law",
    body: (
      <LegalProse>
        <p>
          These Terms of Use are governed by and construed in accordance with the
          laws of the Federal Republic of Nigeria, without regard to its conflict
          of laws principles. You agree that the courts of Nigeria will have
          jurisdiction over any dispute arising from or relating to these terms
          or your use of the Site.
        </p>
      </LegalProse>
    ),
  },
  {
    id: "changes",
    title: "Changes to These Terms",
    body: (
      <LegalProse>
        <p>
          We may revise these Terms of Use from time to time. When we do, we will
          update the &ldquo;Last updated&rdquo; date at the top of this page.
          Material changes may be communicated more prominently. By continuing to
          use the Site after changes take effect, you accept the revised terms.
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
          If you have questions about these Terms of Use, please reach out
          through our <ContactLink /> or email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Kiribé Online
          is operated from Nigeria.
        </p>
      </LegalProse>
    ),
  },
];

export function TermsOfUsePage() {
  return (
    <LegalPageLayout
      kicker="Legal"
      title="Terms of Use"
      intro="The terms that govern your use of Kiribé Online — what you can expect from us, and what we ask of you in return."
      lastUpdated={LEGAL_LAST_UPDATED}
      sections={SECTIONS}
    />
  );
}
