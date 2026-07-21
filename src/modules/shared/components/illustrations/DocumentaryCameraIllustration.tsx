import {
  BackgroundBlob,
  IllustrationBase,
  accentStroke,
  inkStroke,
  type IllustrationProps,
} from "./IllustrationBase";

/** Twin-reel film camera on a tripod, lens cap still on. */
export function DocumentaryCameraIllustration(props: IllustrationProps) {
  return (
    <IllustrationBase {...props}>
      <BackgroundBlob />
      <g {...inkStroke}>
        {/* camera body */}
        <path d="M76 94 C102 91 128 92 148 94 L147 128 C124 131 98 130 78 128 Z" />

        {/* twin film reels */}
        <circle cx="96" cy="74" r="16" />
        <circle cx="130" cy="74" r="13" />

        {/* lens cone */}
        <path d="M148 100 L172 92 L172 122 L147 116" />

        {/* tripod */}
        <path d="M98 130 L84 156" />
        <path d="M126 130 L140 156" />
        <path d="M112 130 L112 152" />
      </g>
      <g {...accentStroke}>
        {/* mustard reel hubs */}
        <circle cx="96" cy="74" r="5" />
        <circle cx="130" cy="74" r="4" />
      </g>
    </IllustrationBase>
  );
}
