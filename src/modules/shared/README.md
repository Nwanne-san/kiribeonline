# Shared module

Cross-cutting layouts, MUI-based UI primitives, and types.

## UI stack

All public-site components use **MUI 7** as the base:

```tsx
import { Box, Stack, Grid, Skeleton } from "@/modules/shared/components/ui";
import SearchIcon from "@mui/icons-material/Search";
import {
  KiribeTypography,
  KiribeButton,
  KiribeTextField,
  KiribeLink,
  EditorialContainer,
} from "@/modules/shared/components/ui";
import { DataRenderer, RichTextRenderer } from "@/modules/shared/components/feedback";
import { KiribeImage } from "@/modules/shared/components/media";
import { FormTextField, FormTextArea } from "@/modules/shared/components/form";
```

## Folders

- `components/ui/` — Kiribe wrappers (`KiribeButton`, `KiribeTextField`, `KiribeLink`, layout)
- `components/form/` — React Hook Form field wrappers
- `components/feedback/` — `DataRenderer`, `GlobalEmptyState`, `RichTextRenderer`, `KiribeSnackbarProvider`
- `components/media/` — `KiribeImage`, `KiribeImageViewer`
- `components/SiteHeader/` — AppBar, nav, footer
- `components/skeleton/` — loading states (MUI Skeleton)
- `layouts/` — SiteLayout
- `types/` — content.ts, network.d.ts

## Forms

Shared Zod schemas live in `src/lib/validation/`. Use `useFormValidator` + `FormTextField` / `FormTextArea` with `useMutationService` for POST endpoints.

Move shared components here when **two or more modules** need them.
