import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { KiribeLink, KiribeTypography } from "@/modules/shared/components/ui";

type SectionHeaderProps = {
  title: string;
  viewAllHref?: string;
  showGoldRule?: boolean;
};

export function SectionHeader({ title, viewAllHref, showGoldRule = true }: SectionHeaderProps) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="baseline" className="mb-6">
      <Box>
        <KiribeTypography variant="h3" color="primary.main" className="uppercase">
          {title}
        </KiribeTypography>
        {showGoldRule && (
          <Box className="w-12 h-[3px] bg-mustard mt-1.5" />
        )}
      </Box>
      {viewAllHref && (
        <KiribeLink href={viewAllHref} underline="hover" className="font-semibold text-[0.75rem] tracking-[0.08em]">
          VIEW ALL &gt;
        </KiribeLink>
      )}
    </Stack>
  );
}
