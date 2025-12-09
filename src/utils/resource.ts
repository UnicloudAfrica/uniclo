export const formatPrice = (price: number | string | undefined | null): string => {
  if (!price) return "0";
  return Number(price).toLocaleString();
};

export const getCurrencySymbol = (currencyCode: string): string => {
  switch (currencyCode) {
    case "NGN":
      return "₦";
    case "AED":
      return "د.إ";
    default:
      return "$";
  }
};
