import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addItemToShopCart,
  checkoutShopCart,
  getShopCart,
  removeShopCartItem,
  updateShopCartItem,
  type AddCartItemPayload,
  type CheckoutResponse,
  type ShopCartResponse,
  type UpdateCartItemPayload,
} from "../api/shopService";


export function useShopCart(userId?: number) {
  return useQuery<ShopCartResponse>({
    queryKey: ["shop-cart", userId],
    queryFn: () => getShopCart(userId!),
    enabled: typeof userId === "number",
  });
}


export function useAddShopCartItem(userId?: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddCartItemPayload) => addItemToShopCart(userId!, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["shop-cart", userId] });
      void queryClient.invalidateQueries({ queryKey: ["shop-overview", userId] });
    },
  });
}


export function useUpdateShopCartItem(userId?: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cartItemId, payload }: { cartItemId: number; payload: UpdateCartItemPayload }) =>
      updateShopCartItem(userId!, cartItemId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["shop-cart", userId] });
      void queryClient.invalidateQueries({ queryKey: ["shop-overview", userId] });
    },
  });
}


export function useRemoveShopCartItem(userId?: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cartItemId: number) => removeShopCartItem(userId!, cartItemId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["shop-cart", userId] });
      void queryClient.invalidateQueries({ queryKey: ["shop-overview", userId] });
    },
  });
}


export function useCheckoutShopCart(userId?: number) {
  const queryClient = useQueryClient();

  return useMutation<CheckoutResponse>({
    mutationFn: () => checkoutShopCart(userId!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["shop-cart", userId] });
      void queryClient.invalidateQueries({ queryKey: ["shop-overview", userId] });
      void queryClient.invalidateQueries({ queryKey: ["shop-redemptions", userId] });
    },
  });
}
