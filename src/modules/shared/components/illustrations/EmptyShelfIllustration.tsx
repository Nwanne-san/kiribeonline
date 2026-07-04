import {
  BackgroundBlob,
  IllustrationBase,
  accentStroke,
  inkStroke,
  type IllustrationProps,
} from "./IllustrationBase";

/** Film-reel canister resting on an otherwise empty shelf. */
export function EmptyShelfIllustration(props: IllustrationProps) {
  return (
    <IllustrationBase {...props}>
      <BackgroundBlob />
      <g {...inkStroke}>
        {/* shelf plank with slightly wobbly bracket ends */}
        <path d="M44 132 C90 129 150 130 196 132" />
        <path d="M60 132 L52 150" />
        <path d="M180 132 L188 150" />

        {/* canister cylinder standing on the shelf */}
        <ellipse cx="120" cy="76" rx="34" ry="11" />
        <path d="M86 76 L86 118" />
        <path d="M154 76 L154 118" />
        <path d="M86 118 C97 126 143 126 154 118" />

        {/* winding arms on the reel face */}
        <path d="M120 62 L120 90" />
        <path d="M106 76 L134 76" />
      </g>
      <g {...accentStroke}>
        {/* mustard reel hub */}
        <circle cx="120" cy="76" r="6" />
        <circle cx="120" cy="76" r="15" />
      </g>
    </IllustrationBase>
  );
}
