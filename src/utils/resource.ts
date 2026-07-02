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
    case "GBP":
      return "£";
    case "EUR":
      return "€";
    case "USD":
      return "$";
    default:
      // Unknown ISO code — return the code itself rather than assume USD
      // (platform money rule: never hardcode a currency).
      return currencyCode ? `${currencyCode} ` : "$";
  }
};
