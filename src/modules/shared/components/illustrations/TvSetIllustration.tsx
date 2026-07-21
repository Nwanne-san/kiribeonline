import {
  BackgroundBlob,
  IllustrationBase,
  accentStroke,
  inkStroke,
  type IllustrationProps,
} from "./IllustrationBase";

/** Retro television with rabbit-ear antennae waiting for a signal. */
export function TvSetIllustration(props: IllustrationProps) {
  return (
    <IllustrationBase {...props}>
      <BackgroundBlob />
      <g {...inkStroke}>
        {/* cabinet with softly rounded corners */}
        <path d="M64 74 C63 68 68 64 74 64 L166 64 C172 64 177 68 176 74 L177 126 C177 132 172 136 166 136 L74 136 C68 136 63 132 64 126 Z" />
        {/* screen */}
        <path d="M78 78 C108 76 138 77 162 78 L161 122 C134 124 106 123 79 122 Z" />

        {/* rabbit-ear antennae */}
        <path d="M106 62 L86 32" />
        <path d="M134 62 L154 34" />

        {/* stubby legs */}
        <path d="M88 136 L84 150" />
        <path d="M152 136 L156 150" />
      </g>
      <g {...accentStroke}>
        {/* mustard antenna tips + standby dot */}
        <circle cx="85" cy="30" r="3" />
        <circle cx="155" cy="32" r="3" />
        <circle cx="120" cy="100" r="5" />
      </g>
    </IllustrationBase>
  );
}
