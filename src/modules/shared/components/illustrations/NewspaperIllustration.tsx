import {
  BackgroundBlob,
  IllustrationBase,
  accentStroke,
  inkStroke,
  type IllustrationProps,
} from "./IllustrationBase";

/** Front page with the lead-photo slot still empty — no news yet. */
export function NewspaperIllustration(props: IllustrationProps) {
  return (
    <IllustrationBase {...props}>
      <BackgroundBlob />
      <g {...inkStroke}>
        {/* broadsheet page */}
        <path d="M62 62 C96 59 148 60 178 62 L176 138 C142 141 96 140 64 138 Z" />
        {/* masthead rule */}
        <path d="M74 74 C104 72 140 73 166 74" />

        {/* headlines beside the lead photo */}
        <path d="M130 88 L166 88" />
        <path d="M130 98 L162 98" />
        <path d="M130 108 L166 108" />

        {/* body columns */}
        <path d="M74 124 C104 122 140 123 166 124" />
        <path d="M74 133 L150 133" />
      </g>
      <g {...accentStroke}>
        {/* mustard lead-photo slot */}
        <path d="M74 86 C90 85 104 85 118 86 L118 112 C103 113 89 113 74 112 Z" />
      </g>
    </IllustrationBase>
  );
}
