"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useEffect, useState } from "react";

import { queryClient } from "@/lib/query-client";
import { initializeOfflineRetryQueue } from "@/services/http";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const [client] = useState(() => queryClient);

  useEffect(() => {
    initializeOfflineRetryQueue();
  }, []);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
