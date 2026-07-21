import {
  BackgroundBlob,
  IllustrationBase,
  accentStroke,
  inkStroke,
  type IllustrationProps,
} from "./IllustrationBase";

/** Player frame with nothing queued — the Videos desk between uploads. */
export function VideoPlayIllustration(props: IllustrationProps) {
  return (
    <IllustrationBase {...props}>
      <BackgroundBlob />
      <g {...inkStroke}>
        {/* player frame */}
        <path d="M64 60 C96 57 146 58 176 60 L175 132 C143 135 95 134 65 132 Z" />
        {/* scrubber */}
        <path d="M76 122 L164 122" />
      </g>
      <g {...accentStroke}>
        {/* mustard play button + playhead */}
        <path d="M108 78 L142 94 L108 110 Z" />
        <circle cx="112" cy="122" r="3" />
      </g>
    </IllustrationBase>
  );
}
