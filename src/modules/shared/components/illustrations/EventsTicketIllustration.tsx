import {
  BackgroundBlob,
  IllustrationBase,
  accentStroke,
  inkStroke,
  type IllustrationProps,
} from "./IllustrationBase";

/** Admission ticket with its stub still attached — nothing on the bill yet. */
export function EventsTicketIllustration(props: IllustrationProps) {
  return (
    <IllustrationBase {...props}>
      <BackgroundBlob />
      <g {...inkStroke}>
        {/* gently skewed ticket */}
        <path d="M60 80 C60 76 63 73 67 73 L172 68 C176 68 179 71 179 75 L181 112 C181 116 178 119 174 119 L69 126 C65 126 62 123 62 119 Z" />

        {/* perforation between ticket and stub */}
        <path d="M142 71 L142 76" />
        <path d="M143 83 L143 88" />
        <path d="M144 95 L144 100" />
        <path d="M145 107 L145 112" />
        <path d="M146 117 L146 122" />

        {/* stub detail lines */}
        <path d="M156 84 L172 83" />
        <path d="M157 95 L170 94" />
      </g>
      <g {...accentStroke}>
        {/* mustard star on the ticket face */}
        <path d="M100 80 L104 92 L116 96 L104 100 L100 112 L96 100 L84 96 L96 92 Z" />
      </g>
    </IllustrationBase>
  );
}
