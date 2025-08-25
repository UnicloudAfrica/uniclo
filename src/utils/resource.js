export const formatPrice = (price) => {
  if (!price) return "0";
  return Number(price).toLocaleString();
};

export const getCurrencySymbol = (currencyCode) => {
  switch (currencyCode) {
    case "NGN":
      return "₦";
    case "AED":
      return "د.إ";
    default:
      return "$";
  }
};
