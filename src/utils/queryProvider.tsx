"use client";
import { QueryClientProvider } from "@tanstack/react-query";
import { Suspense } from "react";
import { queryClient } from "@/lib/queryClient";

interface QueryProviderProps {
  children: React.ReactNode;
}

const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  // Shared QueryClient lives in src/lib/queryClient.ts so non-React
  // code (e.g. the auth store) can invalidate/clear the cache on
  // logout and tenant switch. See M-08.
  return (
    <Suspense>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Suspense>
  );
};

export default QueryProvider;
