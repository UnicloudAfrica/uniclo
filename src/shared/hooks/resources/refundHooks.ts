/**
 * Refund Hooks — Context-aware hook for issuing invoice refunds.
 *
 * Mirrors the URL conventions in `invoiceHooks.ts`:
 *   - admin:  POST /admin/v1/invoices/{invoice}/refund
 *   - tenant: POST /tenant/v1/admin/invoices/{invoice}/refund
 *   - client: (not exposed — clients cannot issue refunds)
 *
 * The endpoint path is appended to the same per-context invoice prefix
 * used by `useMarkInvoicePaid` / `useVoidInvoice`. Goes through
 * `entry.toastApi` so success/error messages surface to the user the
 * same way the sibling invoice mutations do.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApiContext } from "@/hooks/useApiContext";
import type { ApiContext } from "@/hooks/useApiContext";
import { apiRegistry } from "../../api/apiRegistry";
import { invoiceKeys, type Invoice } from "./invoiceHooks";

type AnyRecord = Record<string, unknown>;

/**
 * Per-context invoice base path — kept in lockstep with the private
 * `invoicesPath` helper in `invoiceHooks.ts`. The registry `urlPrefix`
 * already encodes "/admin" for tenant, so the tenant invoice route is
 * "/admin/invoices"; admin and client use the absolute "/invoices".
 */
const invoicesPath = (context: ApiContext): string =>
  context === "tenant" ? "/admin/invoices" : "/invoices";

export interface RefundPayload {
  id: string | number;
  /** Refund amount in the invoice currency. Must be ≤ amount_paid. */
  amount: number;
  /** Optional human reason recorded against the refund transaction. */
  reason?: string;
}

export interface RefundResponse {
  message?: string;
  data?: Invoice;
}

/**
 * Issue a refund against a paid invoice. Refreshes the invoice list +
 * detail caches on success so the status / amount_paid flip immediately.
 */
export function useRefundInvoice() {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<RefundResponse, Error, RefundPayload>({
    mutationFn: async ({ id, amount, reason }) => {
      const res = await entry.toastApi.post<AnyRecord>(
        `${invoicesPath(context)}/${id}/refunds`,
        {
          amount,
          ...(reason ? { reason } : {}),
        }
      );
      return res as RefundResponse;
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all(context) });
      queryClient.invalidateQueries({
        queryKey: invoiceKeys.detail(context, id),
      });
    },
  });
}
