import {
  BackgroundBlob,
  IllustrationBase,
  accentStroke,
  inkStroke,
  type IllustrationProps,
} from "./IllustrationBase";

/** An envelope closed with a mustard wax seal — message received. */
export function InboxIllustration(props: IllustrationProps) {
  return (
    <IllustrationBase {...props}>
      <BackgroundBlob />
      <g {...inkStroke}>
        {/* envelope body */}
        <path d="M52 62 C52 58 55 56 59 56 L181 56 C185 56 188 58 188 62 L188 130 C188 134 185 136 181 136 L59 136 C55 136 52 134 52 130 Z" />
        {/* open flap creases */}
        <path d="M53 60 L120 104 L187 60" />
        {/* side folds */}
        <path d="M53 132 L104 96" />
        <path d="M187 132 L136 96" />
      </g>
      <g {...accentStroke}>
        {/* mustard wax seal + monogram star */}
        <circle cx="120" cy="112" r="15" />
        <path d="M120 103 L123 110 L130 110 L124 114 L126 121 L120 117 L114 121 L116 114 L110 110 L117 110 Z" />
      </g>
    </IllustrationBase>
  );
}
