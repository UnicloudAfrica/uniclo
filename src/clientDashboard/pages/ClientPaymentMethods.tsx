import React, { useState } from "react";
import { CreditCard, Plus, Trash2 } from "lucide-react";
import ClientPageShell from "../components/ClientPageShell";
import {
  useSavedCards,
  useAddCard,
  useRemoveCard,
  type SavedCard,
} from "@/shared/hooks/resources/paymentMethodHooks";
import { resolveCardIdentifier } from "@/shared/components/ui/payment/paymentUtils";
import ToastUtils from "@/utils/toastUtil";
import logger from "@/utils/logger";

const CardRow: React.FC<{
  card: SavedCard;
  onRemove: (card: SavedCard) => void;
  isRemoving: boolean;
}> = ({ card, onRemove, isRemoving }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-lg bg-gray-50">
          <CreditCard className="w-5 h-5 text-gray-500" />
        </div>
        <div>
          <p className="font-medium text-gray-900">
            {(card.card_type || "Card").toUpperCase()} &bull;&bull;&bull;&bull;{" "}
            {card.last4 || "----"}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            Expires {card.exp_month}/{card.exp_year}
            {card.bank ? ` · ${card.bank}` : ""}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-xs font-semibold uppercase text-gray-500">
          {card.payment_gateway || "Paystack"}
        </span>
        <button
          type="button"
          onClick={() => onRemove(card)}
          disabled={isRemoving}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
          Remove
        </button>
      </div>
    </div>
  </div>
);

const ClientPaymentMethods: React.FC = () => {
  const { data: cards, isLoading } = useSavedCards();
  const addCard = useAddCard();
  const removeCard = useRemoveCard();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleAddCard = async () => {
    if (addCard.isPending) return;
    try {
      const setup = await addCard.mutateAsync(undefined);
      if (setup.authorizationUrl) {
        globalThis.window.location.href = setup.authorizationUrl;
        return;
      }
      ToastUtils.error("Could not start card setup. Please try again.");
    } catch (error) {
      logger.error("[ClientPaymentMethods] Add card failed", error);
    }
  };

  const handleRemoveCard = async (card: SavedCard) => {
    const identifier = resolveCardIdentifier(card);
    const cardId = card.id ?? card.identifier;
    if (cardId === undefined || cardId === null || removingId !== null) return;
    setRemovingId(identifier);
    try {
      await removeCard.mutateAsync(cardId);
      ToastUtils.success("Card removed");
    } catch (error) {
      logger.error("[ClientPaymentMethods] Remove card failed", error);
    } finally {
      setRemovingId(null);
    }
  };

  const list = cards ?? [];

  return (
    <ClientPageShell
      title={
        <span className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-600" />
          Payment Methods
        </span>
      }
      description="Manage the cards saved to your account for faster checkout."
      actions={
        <button
          type="button"
          onClick={handleAddCard}
          disabled={addCard.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          {addCard.isPending ? "Starting…" : "Add card"}
        </button>
      }
    >
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-500 mt-3">Loading payment methods…</p>
        </div>
      ) : list.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <CreditCard className="w-12 h-12 text-gray-300 mx-auto" />
          <p className="text-gray-500 mt-3">No saved cards</p>
          <p className="text-sm text-gray-400 mt-1">
            Add a card to pay invoices faster and enable automatic renewals.
          </p>
          <button
            type="button"
            onClick={handleAddCard}
            disabled={addCard.isPending}
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Add card
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((card) => {
            const identifier = resolveCardIdentifier(card);
            return (
              <CardRow
                key={identifier}
                card={card}
                onRemove={handleRemoveCard}
                isRemoving={removingId === identifier}
              />
            );
          })}
        </div>
      )}
    </ClientPageShell>
  );
};

export default ClientPaymentMethods;
