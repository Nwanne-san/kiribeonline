import {
  BackgroundBlob,
  IllustrationBase,
  accentStroke,
  inkStroke,
  type IllustrationProps,
} from "./IllustrationBase";

/** A film projector with its strip tangled — something broke mid-reel. */
export function BrokenProjectorIllustration(props: IllustrationProps) {
  return (
    <IllustrationBase {...props}>
      <BackgroundBlob />
      <g {...inkStroke}>
        {/* projector body */}
        <path d="M56 96 C56 92 59 90 63 90 L138 90 C142 90 145 92 145 96 L145 128 C145 132 142 134 138 134 L63 134 C59 134 56 132 56 128 Z" />
        {/* feet */}
        <path d="M70 134 L66 146" />
        <path d="M130 134 L134 146" />
        {/* upper + lower reels */}
        <circle cx="82" cy="72" r="17" />
        <circle cx="124" cy="72" r="17" />
        <path d="M99 76 C104 82 120 82 124 80" />
        {/* lens cone pointing right */}
        <path d="M145 102 L172 94 L172 124 L145 118" />
      </g>
      <g {...accentStroke}>
        {/* mustard tangled film strip spilling out */}
        <path d="M132 128 C150 138 168 122 158 108 C150 98 178 96 186 112" />
        {/* reel hubs */}
        <circle cx="82" cy="72" r="4" />
        <circle cx="124" cy="72" r="4" />
      </g>
    </IllustrationBase>
  );
}
