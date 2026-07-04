import {
  BackgroundBlob,
  IllustrationBase,
  accentStroke,
  inkStroke,
  type IllustrationProps,
} from "./IllustrationBase";

/** A "SCENE 404" film slate — the page that didn't make the cut. */
export function LostSceneIllustration(props: IllustrationProps) {
  return (
    <IllustrationBase {...props}>
      <BackgroundBlob />
      <g {...inkStroke}>
        {/* slate body */}
        <path d="M44 78 C44 74 47 72 51 72 L189 72 C193 72 196 74 196 78 L196 142 C196 146 193 148 189 148 L51 148 C47 148 44 146 44 142 Z" />
        {/* hinged, lifted clap bar */}
        <path d="M42 70 L188 52 C192 51 195 53 196 57 L198 70 C198 71 46 72 46 72 C42 72 41 71 42 70 Z" />
        <path d="M66 71 L80 53" />
        <path d="M92 70 L106 52" />
        <path d="M118 69 L132 51" />
        <path d="M144 68 L158 50" />
        {/* SCENE label line */}
        <path d="M62 96 L138 96" />
      </g>
      <text
        x="120"
        y="134"
        textAnchor="middle"
        fontFamily="var(--font-headline)"
        fontWeight={700}
        fontSize={34}
        letterSpacing={2}
        fill="var(--color-mustard)"
        stroke="none"
      >
        404
      </text>
      <g {...accentStroke}>
        {/* mustard scene marker dot */}
        <circle cx="150" cy="96" r="4" />
      </g>
    </IllustrationBase>
  );
}
