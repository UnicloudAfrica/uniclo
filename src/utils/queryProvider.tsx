"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import logger from "./logger";

interface QueryProviderProps {
  children: React.ReactNode;
}

const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1, // Ensures queries are retried once if they fail
          },
          mutations: {
            onError: (error) => {
              logger.error("Mutation Error:", error);
            },
          },
        },
      })
  );

  return (
    <Suspense>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Suspense>
  );
};

export default QueryProvider;
