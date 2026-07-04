import {
  EditorialContainer,
  EditorialSection,
} from "@/modules/shared/components/ui";
import { SectionGridSkeleton } from "@/modules/shared/components/skeleton";

export default function TagArchiveLoading() {
  return (
    <EditorialSection>
      <EditorialContainer>
        <SectionGridSkeleton count={9} />
      </EditorialContainer>
    </EditorialSection>
  );
}
