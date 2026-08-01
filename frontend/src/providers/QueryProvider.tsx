"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 10 * 60 * 1000,   // 10 min — data is "fresh" for 10 min, no re-fetch
            gcTime: 30 * 60 * 1000,       // 30 min — keep unused data in memory
            refetchOnWindowFocus: false,   // don't re-fetch when switching browser tabs
            refetchOnReconnect: true,      // do re-fetch if internet drops and reconnects
            retry: 1,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
