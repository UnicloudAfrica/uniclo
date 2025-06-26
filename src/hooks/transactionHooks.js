import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../index/api";
import silentApi from "../index/silent";

// **PATCH**: verify Transaction
const verifyTransaction = async (transactionIdentifier, userData) => {
  return await api(
    "PATCH",
    `/business/transaction/${transactionIdentifier}`,
    userData
  );
};

const fetchTransactions = async () => {
  const res = await silentApi("GET", "/business/transaction");
  return res.data; // Extract only the data array
};

// Hook to update cart
export const useVerifyTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ transactionIdentifier, userData }) =>
      verifyTransaction(transactionIdentifier, userData),
    onError: (error) => {
      console.error(error);
    },
    onSuccess: (data) => {
      // console.log(data);
      queryClient.invalidateQueries(["cart"]);
    },
  });
};

// **GET**: fetchTransactions

// Hook to fetch transactions
export const useFetchTransactions = (options = {}) => {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: fetchTransactions,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};
