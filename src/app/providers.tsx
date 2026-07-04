"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { LIST_STALE_TIME_MS, QUERY_RETRY_COUNT } from "@/constants";
import { KiribeSnackbarProvider } from "@/modules/shared/components/feedback/KiribeSnackbar";
import { muiTheme } from "@/theme/muiTheme";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: LIST_STALE_TIME_MS,
            refetchOnWindowFocus: false,
            retry: QUERY_RETRY_COUNT,
            networkMode: "online",
          },
        },
      })
  );

  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline enableColorScheme />
        <QueryClientProvider client={queryClient}>
          <KiribeSnackbarProvider>{children}</KiribeSnackbarProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
