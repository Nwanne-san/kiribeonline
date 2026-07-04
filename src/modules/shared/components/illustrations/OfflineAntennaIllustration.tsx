import {
  BackgroundBlob,
  IllustrationBase,
  accentStroke,
  inkStroke,
  type IllustrationProps,
} from "./IllustrationBase";

/** A retro TV antenna with broken signal arcs — the connection dropped. */
export function OfflineAntennaIllustration(props: IllustrationProps) {
  return (
    <IllustrationBase {...props}>
      <BackgroundBlob />
      <g {...inkStroke}>
        {/* tv set */}
        <path d="M60 96 C60 92 63 90 67 90 L156 90 C160 90 163 92 163 96 L163 140 C163 144 160 146 156 146 L67 146 C63 146 60 144 60 140 Z" />
        {/* screen inset */}
        <path d="M72 100 L138 100 C140 100 141 101 141 103 L141 133 C141 135 140 136 138 136 L72 136 C70 136 69 135 69 133 L69 103 C69 101 70 100 72 100 Z" />
        {/* control knobs on the right */}
        <circle cx="152" cy="108" r="3" />
        <circle cx="152" cy="122" r="3" />
        {/* antenna base + rods */}
        <path d="M104 90 L112 74 L120 90" />
        <path d="M112 74 L86 44" />
        <path d="M112 74 L140 46" />
        <circle cx="84" cy="42" r="3" />
        <circle cx="142" cy="44" r="3" />
      </g>
      <g {...accentStroke}>
        {/* broken signal arcs radiating from the right rod */}
        <path d="M150 40 C158 46 162 56 160 66" />
        <path d="M162 30 C176 40 182 58 176 76" />
        {/* mustard "no signal" cross */}
        <path d="M186 52 L198 64" />
        <path d="M198 52 L186 64" />
      </g>
    </IllustrationBase>
  );
}
