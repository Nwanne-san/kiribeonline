import {
  BackgroundBlob,
  IllustrationBase,
  accentStroke,
  inkStroke,
  type IllustrationProps,
} from "./IllustrationBase";

/** An empty ornate picture frame — no media uploaded yet. */
export function EmptyMediaIllustration(props: IllustrationProps) {
  return (
    <IllustrationBase {...props}>
      <BackgroundBlob />
      <g {...inkStroke}>
        {/* outer frame */}
        <path d="M64 48 C64 45 66 43 69 43 L171 43 C174 43 176 45 176 48 L176 142 C176 145 174 147 171 147 L69 147 C66 147 64 145 64 142 Z" />
        {/* inner mat border */}
        <path d="M78 58 L162 58 C164 58 165 59 165 61 L165 129 C165 131 164 132 162 132 L78 132 C76 132 75 131 75 129 L75 61 C75 59 76 58 78 58 Z" />
        {/* faint placeholder: horizon + sun */}
        <path d="M84 122 L104 104 L120 116 L138 96 L156 122" />
        {/* corner flourishes */}
        <path d="M64 56 C58 54 58 48 64 46" />
        <path d="M176 56 C182 54 182 48 176 46" />
        <path d="M64 134 C58 136 58 142 64 144" />
        <path d="M176 134 C182 136 182 142 176 144" />
      </g>
      <g {...accentStroke}>
        {/* mustard hanging ribbon + sun accent */}
        <path d="M120 43 L108 26" />
        <path d="M120 43 L132 26" />
        <circle cx="120" cy="24" r="4" />
        <circle cx="138" cy="82" r="7" />
      </g>
    </IllustrationBase>
  );
}
