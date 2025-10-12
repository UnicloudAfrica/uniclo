import { useQuery } from "@tanstack/react-query";
import silentApi from "../../index/admin/silent";

const fetchCountries = async () => {
  const res = await silentApi("GET", "/countries");
  if (!res.data) throw new Error("Failed to fetch countries");
  return res.data;
};

export const useFetchCountries = (options = {}) => {
  return useQuery({
    queryKey: ["countries"],
    queryFn: fetchCountries,
    staleTime: 1000 * 60 * 15, // 15 minutes - countries don't change often
    refetchOnWindowFocus: false,
    ...options,
  });
};