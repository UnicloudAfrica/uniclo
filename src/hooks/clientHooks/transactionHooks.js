import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import clientSilentApi from "../../index/client/silent";
import clientApi from "../../index/client/api";
// **PATCH**: verify Transaction
const verifyTransaction = async (transactionIdentifier, userData) => {
  return await clientApi(
    "PATCH",
    `/business/transaction/${transactionIdentifier}`,
    userData
  );
};

const fetchTransactions = async () => {
  const res = await clientSilentApi("GET", "/business/transaction");
  return res.data; // Extract only the data array
};

// Hook to update cart
export const useVerifyClientTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ transactionIdentifier, userData }) =>
      verifyTransaction(transactionIdentifier, userData),
    retry: false,
    onError: (error) => {
      console.error(error);
    },
    onSuccess: (data) => {
      // console.log(data);
      // queryClient.invalidateQueries(["cart"]);
    },
  });
};

// **GET**: fetchTransactions

// Hook to fetch transactions
export const useFetchClientTransactions = (options = {}) => {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: fetchTransactions,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};
