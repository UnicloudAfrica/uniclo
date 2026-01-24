import { useQuery } from "@tanstack/react-query";
import clientSilentApi from "../../index/client/silent";

const fetchRegions = async () => {
  const res = await clientSilentApi("GET", "/regions");
  if (!res.data) throw new Error("Failed to fetch regions");
  return res.data;
};

export const useFetchClientRegions = (options = {}) => {
  return useQuery({
    queryKey: ["client-regions"],
    queryFn: fetchRegions,
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    ...options,
  });
};
