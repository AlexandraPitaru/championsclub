import axiosInstance from "./axiosInstance";

export type AvailabilityStatus = "available" | "low_stock" | "out_of_stock";

export interface ShopReward {
  reward_id: number;
  name: string;
  description: string | null;
  image_url: string;
  credit_cost: number;
  stock_quantity: number;
  availability_status: AvailabilityStatus;
}

export interface ShopOverviewResponse {
  available_credit: number;
  rewards: ShopReward[];
}

export interface ShopCartItem {
  cart_item_id: number;
  reward_id: number;
  reward_name: string;
  quantity: number;
  credit_cost_per_item: number;
  total_credit_cost: number;
  image_url: string;
  availability_status: AvailabilityStatus;
  stock_quantity: number;
}

export interface ShopCartResponse {
  cart_id: number;
  available_credit: number;
  total_credit_cost: number;
  remaining_credit_after_checkout: number;
  checkout_eligible: boolean;
  items: ShopCartItem[];
}

export interface AddCartItemPayload {
  reward_id: number;
  quantity?: number;
}

export interface UpdateCartItemPayload {
  quantity: number;
}

export interface CheckoutResponse {
  checkout_status: string;
  redemption_id: number;
  redeemed_items: RedemptionHistoryItem[];
  total_credit_spent: number;
  remaining_credit: number;
  confirmation_message: string;
}

export interface RedemptionHistoryItem {
  reward_id: number;
  reward_name: string;
  quantity: number;
  credit_cost_per_item: number;
  total_credit_cost: number;
}

export interface RedemptionHistoryRecord {
  redemption_id: number;
  created_at: string;
  total_credit_spent: number;
  status: string;
  redeemed_items: RedemptionHistoryItem[];
}

export interface RedemptionHistoryResponse {
  redemptions: RedemptionHistoryRecord[];
}

function buildHeaders(userId: number) {
  return { headers: { "x-user-id": userId } };
}

export async function getShopOverview(userId: number): Promise<ShopOverviewResponse> {
  const response = await axiosInstance.get("/api/sales-advisor/shop", buildHeaders(userId));
  return response.data;
}

export async function getShopCart(userId: number): Promise<ShopCartResponse> {
  const response = await axiosInstance.get("/api/sales-advisor/shop/cart", buildHeaders(userId));
  return response.data;
}

export async function addItemToShopCart(
  userId: number,
  payload: AddCartItemPayload
): Promise<ShopCartResponse> {
  const response = await axiosInstance.post(
    "/api/sales-advisor/shop/cart/items",
    { quantity: 1, ...payload },
    buildHeaders(userId)
  );
  return response.data;
}

export async function updateShopCartItem(
  userId: number,
  cartItemId: number,
  payload: UpdateCartItemPayload
): Promise<ShopCartResponse> {
  const response = await axiosInstance.patch(
    `/api/sales-advisor/shop/cart/items/${cartItemId}`,
    payload,
    buildHeaders(userId)
  );
  return response.data;
}

export async function removeShopCartItem(
  userId: number,
  cartItemId: number
): Promise<ShopCartResponse> {
  const response = await axiosInstance.delete(
    `/api/sales-advisor/shop/cart/items/${cartItemId}`,
    buildHeaders(userId)
  );
  return response.data;
}

export async function checkoutShopCart(userId: number): Promise<CheckoutResponse> {
  const response = await axiosInstance.post(
    "/api/sales-advisor/shop/checkout",
    undefined,
    buildHeaders(userId)
  );
  return response.data;
}

export async function getRedemptionHistory(userId: number): Promise<RedemptionHistoryResponse> {
  const response = await axiosInstance.get(
    "/api/sales-advisor/shop/redemptions",
    buildHeaders(userId)
  );
  return response.data;
}
