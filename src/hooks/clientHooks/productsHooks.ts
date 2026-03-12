import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import clientSilentApi from "../../index/client/silent";

interface Offer {
  offer_type?: string;
  [key: string]: unknown;
}

const normalizeOfferType = (value = "") => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (!normalized) return "discount";
  if (normalized.includes("trial")) return "trial";
  if (normalized.includes("discount")) return "discount";
  if (normalized.includes("promo")) return "discount";
  return "discount";
};

const groupOffers = (items: Offer[] = []) =>
  items.reduce(
    (acc, offer) => {
      const bucket = normalizeOfferType(offer?.offer_type);
      if (acc[bucket]) {
        acc[bucket].push(offer);
      }
      return acc;
    },
    { trial: [], discount: [] } as Record<string, Offer[]>
  );

// **GET**: fetch product offers grouped for dashboard consumption
const fetchProductOffers = async () => {
  const res = await clientSilentApi<{ data: Offer[] }>("GET", "/product-offers");
  const offers = Array.isArray(res?.data) ? res.data : [];
  return groupOffers(offers);
};

// Hook to fetch products
export const useFetchClientProductOffers = (
  options: Omit<UseQueryOptions<Record<string, Offer[]>, Error>, "queryKey" | "queryFn"> = {}
) => {
  return useQuery({
    queryKey: ["products-offers"],
    queryFn: fetchProductOffers,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};
