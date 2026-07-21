import {
  BackgroundBlob,
  IllustrationBase,
  accentStroke,
  inkStroke,
  type IllustrationProps,
} from "./IllustrationBase";

/** Speech bubble with an unfinished argument — the Opinion desk is quiet. */
export function OpinionBubbleIllustration(props: IllustrationProps) {
  return (
    <IllustrationBase {...props}>
      <BackgroundBlob />
      <g {...inkStroke}>
        {/* bubble with a hand-drawn tail */}
        <path d="M64 58 C96 54 144 55 176 58 L175 106 C144 110 104 110 84 107 L66 126 L73 105 C66 104 63 88 64 58 Z" />
        {/* lines of copy */}
        <path d="M84 72 C108 70 132 71 152 72" />
        <path d="M84 84 C106 82 128 83 144 84" />
      </g>
      <g {...accentStroke}>
        {/* the mustard line still being written */}
        <path d="M84 96 C96 95 108 95 118 96" />
        <circle cx="130" cy="96" r="2" />
      </g>
    </IllustrationBase>
  );
}
