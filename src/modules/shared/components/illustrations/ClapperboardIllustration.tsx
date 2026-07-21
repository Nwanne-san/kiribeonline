import {
  BackgroundBlob,
  IllustrationBase,
  accentStroke,
  inkStroke,
  type IllustrationProps,
} from "./IllustrationBase";

/** Clapperboard with its arm swung open — the Film desk between takes. */
export function ClapperboardIllustration(props: IllustrationProps) {
  return (
    <IllustrationBase {...props}>
      <BackgroundBlob />
      <g {...inkStroke}>
        {/* slate body */}
        <path d="M70 92 C104 89 138 90 170 92 L168 140 C134 143 104 142 72 140 Z" />
        {/* scene / take rows */}
        <path d="M80 106 C110 104 140 105 160 106" />
        <path d="M80 120 C110 118 140 119 158 120" />

        {/* closed lower clap bar */}
        <path d="M70 92 L68 78 C102 75 138 76 172 78 L170 92" />
        <path d="M90 77 L84 91" />
        <path d="M114 76 L108 91" />
        <path d="M138 76 L132 91" />
        <path d="M158 77 L152 91" />

        {/* open clap arm, hinged bottom-left */}
        <path d="M68 74 L156 44" />
        <path d="M74 86 L160 56" />
        <path d="M156 44 L160 56" />
        <path d="M92 66 L96 78" />
        <path d="M114 59 L118 71" />
        <path d="M136 51 L140 63" />
      </g>
      <g {...accentStroke}>
        {/* mustard hinge bolt */}
        <circle cx="70" cy="80" r="3" />
        <circle cx="70" cy="80" r="8" />
      </g>
    </IllustrationBase>
  );
}
