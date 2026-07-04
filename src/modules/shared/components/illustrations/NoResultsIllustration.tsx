import {
  BackgroundBlob,
  IllustrationBase,
  accentStroke,
  inkStroke,
  type IllustrationProps,
} from "./IllustrationBase";

/** Magnifying glass hovering over a blank clapperboard — nothing found. */
export function NoResultsIllustration(props: IllustrationProps) {
  return (
    <IllustrationBase {...props}>
      <BackgroundBlob />
      <g {...inkStroke}>
        {/* clapperboard body */}
        <path d="M48 96 C48 92 51 90 55 90 L150 90 C154 90 157 92 157 96 L157 138 C157 142 154 144 150 144 L55 144 C51 144 48 142 48 138 Z" />
        {/* hinged clap bar */}
        <path d="M46 88 L150 74 C154 73 157 75 158 79 L160 90 C160 90 55 90 50 90 C46 90 45 89 46 88 Z" />
        {/* clap diagonal stripes */}
        <path d="M70 88 L82 75" />
        <path d="M94 87 L106 74" />
        <path d="M118 86 L130 73" />
      </g>
      <g {...accentStroke}>
        {/* magnifying glass lens + handle */}
        <circle cx="150" cy="66" r="26" />
        <path d="M169 84 L192 108" />
      </g>
    </IllustrationBase>
  );
}
