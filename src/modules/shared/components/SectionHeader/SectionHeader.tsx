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
    <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 3 }}>
      <Box>
        <KiribeTypography variant="h3" color="primary.main" sx={{ textTransform: "uppercase" }}>
          {title}
        </KiribeTypography>
        {showGoldRule && (
          <Box sx={{ width: 48, height: 3, bgcolor: "secondary.main", mt: 0.75 }} />
        )}
      </Box>
      {viewAllHref && (
        <KiribeLink href={viewAllHref} underline="hover" sx={{ fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.08em" }}>
          VIEW ALL &gt;
        </KiribeLink>
      )}
    </Stack>
  );
}
