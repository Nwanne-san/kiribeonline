import Stack from "@mui/material/Stack";
import { SkeletonBlock } from "../SkeletonBlock";

export function EditorPicksSkeleton({ count = 5 }: { count?: number }) {
  return (
    <Stack component="aside" spacing={2.5} aria-hidden>
      <Stack spacing={1} className="pb-3 border-b border-border">
        <SkeletonBlock width={144} height={20} />
        <SkeletonBlock width={32} height={2} className="bg-mustard-light" />
      </Stack>
      <Stack spacing={2.5} component="ul" className="list-none m-0 p-0">
        {Array.from({ length: count }).map((_, i) => (
          <Stack key={i} component="li" spacing={1}>
            <SkeletonBlock width={64} height={12} />
            <SkeletonBlock width="100%" height={16} />
            <SkeletonBlock width="90%" height={16} />
          </Stack>
        ))}
      </Stack>
      <SkeletonBlock width={112} height={16} />
    </Stack>
  );
}
