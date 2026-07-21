import {
  BackgroundBlob,
  IllustrationBase,
  accentStroke,
  inkStroke,
  type IllustrationProps,
} from "./IllustrationBase";

/** Stage spotlight on a tripod, beam waiting for its next profile. */
export function SpotlightLampIllustration(props: IllustrationProps) {
  return (
    <IllustrationBase {...props}>
      <BackgroundBlob />
      <g {...inkStroke}>
        {/* tripod */}
        <path d="M64 156 L84 110" />
        <path d="M106 156 L88 110" />
        <path d="M86 110 L86 100" />

        {/* tilted lamp housing */}
        <path d="M66 90 L98 74 L110 96 L78 112 Z" />
        <path d="M72 88 L82 100" />

        {/* beam edges opening down-right */}
        <path d="M110 82 C138 84 164 90 190 98" />
        <path d="M106 100 C128 112 148 124 166 136" />
      </g>
      <g {...accentStroke}>
        {/* mustard star caught in the beam */}
        <path d="M184 104 L188 116 L200 120 L188 124 L184 136 L180 124 L168 120 L180 116 Z" />
        <circle cx="160" cy="106" r="2" />
      </g>
    </IllustrationBase>
  );
}
