// cartHooks.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../index/api";
import silentApi from "../index/silent";

// **GET**: fetch cart
const fetchCart = async () => {
  const res = await silentApi("GET", "/business/cart");
  return res.data; // Extract only the data array
};

// **POST**: create cart
const createCart = async (userData) => {
  return await api("POST", "/business/cart", userData);
};

// **PATCH**: update cart
const updateCart = async (cartID, userData) => {
  return await api("PATCH", `/business/cart/${cartID}`, userData);
};

// **DELETE**: delete cart
const deleteCart = async (cartID, userData) => {
  return await api("DELETE", `/business/cart/${cartID}`, userData);
};

export const useFetchCart = (options = {}) => {
  return useQuery({
    queryKey: ["cart"],
    queryFn: fetchCart,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
    ...options,
  });
};

export const useCheckoutCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await api("GET", "/business/checkout");
      return res.data;
    },
    onSuccess: (data) => {
      //   console.log("Checkout successful:", data);
      //   queryClient.invalidateQueries(["cart"]);
    },
    onError: (error) => {
      console.error("Checkout failed:", error);
    },
  });
};
export const useEmptyCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await api("GET", "/business/empty-cart");
      return res.data;
    },
    onSuccess: (data) => {
      //   console.log("Checkout successful:", data);
      //   queryClient.invalidateQueries(["cart"]);
    },
    onError: (error) => {
      console.error("Checkout failed:", error);
    },
  });
};

// Hook to create cart
export const useCreateCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCart,
    onError: (error) => {
      // console.error(error);
    },
    onSuccess: (data) => {
      // console.log(data);
      queryClient.invalidateQueries(["cart"]);
    },
  });
};

// Hook to update cart
export const useUpdateCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cartID, userData }) => updateCart(cartID, userData),
    onError: (error) => {
      console.error(error);
    },
    onSuccess: (data) => {
      // console.log(data);
      queryClient.invalidateQueries(["cart"]);
    },
  });
};

// Hook to delete cart
export const useDeleteCart = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cartID, userData }) => deleteCart(cartID, userData),
    onError: (error) => {
      console.error(error);
    },
    onSuccess: (data) => {
      // console.log(data);
      queryClient.invalidateQueries(["cart"]); // Refetch cart after deletion
    },
  });
};
