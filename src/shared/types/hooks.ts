/**
 * Shared type definitions for React Query hook options.
 *
 * Using a concrete type (without an index signature) prevents `...options`
 * from corrupting TypeScript's generic inference inside `useQuery` / `useMutation`.
 * Previously, `options: any = {}` caused `data` to be inferred as `{}`.
 */

/**
 * Common options forwarded to `useQuery` by custom hook wrappers.
 */
export type QueryHookOptions = {
  enabled?: boolean;
  staleTime?: number;
  gcTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchInterval?: number | false;
  retry?: boolean | number;
  refetchOnMount?: boolean | "always";
  refetchOnReconnect?: boolean | "always";
  networkMode?: "online" | "always" | "offConnected";
};

/**
 * Common options forwarded to `useMutation` by custom hook wrappers.
 */
export type MutationHookOptions<TData = unknown, TError = Error, TVariables = unknown> = {
  onSuccess?: (data: TData, variables: TVariables, context: unknown) => void;
  onError?: (error: TError, variables: TVariables, context: unknown) => void;
  onSettled?: (
    data: TData | undefined,
    error: TError | null,
    variables: TVariables,
    context: unknown
  ) => void;
  retry?: boolean | number;
  networkMode?: "online" | "always" | "offConnected";
};
