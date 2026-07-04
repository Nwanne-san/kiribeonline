import * as React from "react";
import { cn } from "./cn";
import { GoldRule } from "./GoldRule";
import { Heading } from "./Heading";
import { Link } from "./Link";

type SectionHeaderProps = {
  title: string;
  viewAllHref?: string;
  showGoldRule?: boolean;
  className?: string;
};

/** Burgundy uppercase title + gold rule + optional "View all →" link. */
export function SectionHeader({
  title,
  viewAllHref,
  showGoldRule = true,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-baseline justify-between mb-6", className)}>
      <div>
        <Heading variant="section" color="primary">
          {title}
        </Heading>
        {showGoldRule && <GoldRule className="mt-1.5" />}
      </div>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="font-headline text-xs font-semibold uppercase tracking-[0.08em] text-burgundy hover:text-burgundy-dark transition-colors"
        >
          View all &gt;
        </Link>
      )}
    </div>
  );
}
