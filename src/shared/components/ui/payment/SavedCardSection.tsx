import { CreditCard, Trash2 } from "lucide-react";
import { designTokens } from "@/styles/designTokens";
import type { SavedCard } from "./types";
import { resolveCardIdentifier } from "./paymentUtils";

interface SavedCardSectionProps {
  savedCards: SavedCard[];
  selectedSavedCard: string | null;
  onSelectCard: (identifier: string) => void;
  onRemoveCard: (identifier: string) => void;
}

const SavedCardSection = ({
  savedCards,
  selectedSavedCard,
  onSelectCard,
  onRemoveCard,
}: SavedCardSectionProps) => {
  if (savedCards.length === 0) return null;

  return (
    <div
      className="mt-6 space-y-3 rounded-2xl border border-dashed px-4 py-4"
      style={{
        borderColor: designTokens.colors.neutral[200],
        backgroundColor: designTokens.colors.neutral[50],
      }}
    >
      <div
        className="flex items-center gap-2 text-sm font-semibold"
        style={{ color: designTokens.colors.neutral[900] }}
      >
        <CreditCard className="h-4 w-4" />
        Choose a saved card
      </div>
      <div className="space-y-2">
        {savedCards.map((card, index) => {
          const identifier = resolveCardIdentifier(card, String(index));
          const isSelectedCard = identifier === selectedSavedCard;
          return (
            <label
              key={identifier}
              className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2 text-sm ${
                isSelectedCard ? "shadow-sm" : ""
              }`}
              style={{
                borderColor: isSelectedCard
                  ? designTokens.colors.primary[500]
                  : designTokens.colors.neutral[200],
                backgroundColor: isSelectedCard
                  ? designTokens.colors.primary[50]
                  : designTokens.colors.neutral[0],
              }}
            >
              <div>
                <p className="font-semibold" style={{ color: designTokens.colors.neutral[900] }}>
                  {(card.card_type || "Card").toUpperCase()} &bull;&bull;&bull;&bull;{" "}
                  {card.last4 || "----"}
                </p>
                <p className="text-xs" style={{ color: designTokens.colors.neutral[600] }}>
                  Expires {card.exp_month}/{card.exp_year}
                  {card.bank ? ` \u00b7 ${card.bank}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-semibold uppercase"
                  style={{ color: designTokens.colors.neutral[500] }}
                >
                  {card.payment_gateway || "Paystack"}
                </span>
                <input
                  type="radio"
                  className="h-4 w-4 border-slate-300 text-primary-600 focus:ring-primary-500"
                  checked={isSelectedCard}
                  onChange={() => onSelectCard(identifier)}
                />
                <button
                  type="button"
                  onClick={() => onRemoveCard(identifier)}
                  className="rounded px-2 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                >
                  <span className="inline-flex items-center gap-1">
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </span>
                </button>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default SavedCardSection;
