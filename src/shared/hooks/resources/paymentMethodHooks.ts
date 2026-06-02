/**
 * Payment Method Hooks — Context-aware hooks for the customer's saved cards.
 *
 * Backed by the Business `PaymentMethodController` (intended routes, business
 * prefix + auth:sanctum):
 *   GET    business/payment-methods            → list masked saved cards
 *   POST   business/payment-methods            → begin Paystack tokenization
 *   DELETE business/payment-methods/{card}     → remove a saved card
 *
 * The full PAN is never received nor stored here — adding a card returns a
 * Paystack `authorization_url` the frontend opens so the card is entered on
 * Paystack's hosted page. The reusable authorization is persisted out of band
 * by the payment-verification / webhook flow.
 *
 * Card listing is masked by `CardResource` (only last4 / brand / expiry).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApiContext } from "@/hooks/useApiContext";
import type { ApiContext } from "@/hooks/useApiContext";
import { apiRegistry } from "../../api/apiRegistry";
import type { SavedCard } from "@/shared/components/ui/payment/types";
import logger from "@/utils/logger";

type AnyRecord = Record<string, unknown>;

const RESOURCE_PATH = "payment-methods";

export type { SavedCard };

/**
 * Payload returned by the add-card init. The frontend redirects the customer
 * to `authorizationUrl` to finish entering the card on Paystack.
 */
export interface AddCardSetup {
  authorizationUrl: string | null;
  accessCode: string | null;
  reference: string | null;
}

/** Optional inputs for the verification charge that begins tokenization. */
export interface AddCardInput {
  amount?: number;
  currency?: string;
  callbackUrl?: string;
}

export const paymentMethodKeys = {
  list: (context: ApiContext) => ["paymentMethods", context] as const,
  all: (context?: ApiContext) =>
    context ? (["paymentMethods", context] as const) : (["paymentMethods"] as const),
};

const extractData = (res: unknown): unknown =>
  res && typeof res === "object" && "data" in res ? (res as AnyRecord).data : res;

/**
 * Fetch the authenticated customer's saved cards. Returns `[]` when none are
 * saved (the backend short-circuits an empty list with `data: []`).
 */
export const useSavedCards = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useQuery<SavedCard[], Error>({
    queryKey: paymentMethodKeys.list(context),
    queryFn: async () => {
      try {
        const res = await entry.silentApi.get<AnyRecord>(`${entry.urlPrefix}/${RESOURCE_PATH}`);
        const data = extractData(res);
        return Array.isArray(data) ? (data as SavedCard[]) : [];
      } catch (err) {
        logger.error("[paymentMethods] Failed to fetch saved cards", err);
        throw err;
      }
    },
  });
};

/**
 * Begin adding a card via Paystack tokenization. On success returns the
 * authorization payload the caller uses to redirect the customer to Paystack.
 */
export const useAddCard = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];

  return useMutation<AddCardSetup, Error, AddCardInput | undefined>({
    mutationFn: async (input) => {
      const payload: AnyRecord = {};
      if (input?.amount !== undefined) payload.amount = input.amount;
      if (input?.currency !== undefined) payload.currency = input.currency;
      if (input?.callbackUrl !== undefined) payload.callback_url = input.callbackUrl;

      const res = await entry.toastApi.post<AnyRecord>(
        `${entry.urlPrefix}/${RESOURCE_PATH}`,
        payload
      );
      const data = (extractData(res) ?? {}) as AnyRecord;

      return {
        authorizationUrl: (data.authorization_url as string | null) ?? null,
        accessCode: (data.access_code as string | null) ?? null,
        reference: (data.reference as string | null) ?? null,
      };
    },
  });
};

/**
 * Remove one of the customer's saved cards by its numeric id (the route is
 * model-bound: `DELETE business/payment-methods/{card}`). Invalidates the saved
 * cards list on success.
 */
export const useRemoveCard = () => {
  const { context } = useApiContext();
  const entry = apiRegistry[context];
  const queryClient = useQueryClient();

  return useMutation<AnyRecord, Error, string | number>({
    mutationFn: async (cardId) =>
      entry.toastApi.delete<AnyRecord>(`${entry.urlPrefix}/${RESOURCE_PATH}/${cardId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentMethodKeys.all(context) });
    },
  });
};
