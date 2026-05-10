import { useMemo } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Minus,
  Plus,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  Truck,
} from "lucide-react";
import { Link } from "react-router-dom";
import AppShell from "../app/layouts/AppShell";
import Card from "../components/ui/Card";
import type { AxiosError } from "axios";
import {
  useRemoveShopCartItem,
  useCheckoutShopCart,
  useShopCart,
  useUpdateShopCartItem,
} from "../services/hooks/useShopCart";
import type { AvailabilityStatus, ShopCartItem, ShopReward } from "../services/api/shopService";

function formatCredits(value: number): string {
  const rounded = Math.round(value);
  // Handle negative zero
  return (rounded === 0 ? 0 : rounded).toLocaleString("en-US");
}

function getCurrentUserFromStorage() {
  const currentUserRaw = localStorage.getItem("currentUser");
  if (!currentUserRaw) return null;

  try {
    return JSON.parse(currentUserRaw) as { user_id?: number };
  } catch {
    return null;
  }
}

function getErrorMessage(error: unknown): string | null {
  const axiosError = error as AxiosError<{ detail?: string }> | undefined;
  return axiosError?.response?.data?.detail || axiosError?.message || null;
}

function toRewardShape(item: ShopCartItem): ShopReward {
  return {
    reward_id: item.reward_id,
    name: item.reward_name,
    description: null,
    image_url: item.image_url,
    credit_cost: item.credit_cost_per_item,
    stock_quantity: item.stock_quantity,
    availability_status: item.availability_status,
  };
}

function getRewardAccent(reward: ShopReward): string {
  const name = reward.name.toLowerCase();

  if (name.includes("watch")) return "from-amber-500/25 to-orange-500/5";
  if (name.includes("voucher") || name.includes("card")) return "from-blue-500/30 to-indigo-500/10";
  if (name.includes("backpack") || name.includes("travel")) return "from-rose-500/20 to-slate-600/10";
  if (name.includes("earbud")) return "from-emerald-500/20 to-cyan-500/10";
  if (name.includes("coffee") || name.includes("espresso")) return "from-violet-500/25 to-purple-500/5";
  if (name.includes("speaker")) return "from-cyan-500/25 to-blue-500/10";
  if (name.includes("console") || name.includes("gaming")) return "from-rose-500/20 to-red-500/5";
  return "from-sky-500/25 to-cyan-500/5";
}

function getRewardMediaLabel(item: ShopCartItem): string {
  return item.reward_name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment.slice(0, 3).toUpperCase())
    .join(" ");
}

function getAvailabilityText(status: AvailabilityStatus, stockQuantity: number): string {
  if (status === "out_of_stock") {
    return "Out of stock";
  }

  if (status === "low_stock") {
    return `Low stock: ${stockQuantity}`;
  }

  return `In stock: ${stockQuantity}`;
}

export default function CartPage() {
  const currentUser = useMemo(getCurrentUserFromStorage, []);
  const userId = currentUser?.user_id;
  const cartQuery = useShopCart(userId);
  const updateCartItemMutation = useUpdateShopCartItem(userId);
  const removeCartItemMutation = useRemoveShopCartItem(userId);
  const checkoutMutation = useCheckoutShopCart(userId);

  const items = cartQuery.data?.items ?? [];
  const totalCreditCost = cartQuery.data?.total_credit_cost ?? 0;
  const availableCredits = cartQuery.data?.available_credit ?? 0;
  const remainingCredits = cartQuery.data?.remaining_credit_after_checkout ?? availableCredits;
  const canCheckout = cartQuery.data?.checkout_eligible ?? false;

  const actionError =
    getErrorMessage(updateCartItemMutation.error) ||
    getErrorMessage(removeCartItemMutation.error) ||
    getErrorMessage(checkoutMutation.error);
  const hasCheckoutSuccess = checkoutMutation.isSuccess && Boolean(checkoutMutation.data);

  function updateQuantity(item: ShopCartItem, delta: number) {
    const next = item.quantity + delta;
    if (next <= 0) {
      return;
    }

    updateCartItemMutation.mutate({
      cartItemId: item.cart_item_id,
      payload: { quantity: next },
    });
  }

  function removeItem(item: ShopCartItem) {
    removeCartItemMutation.mutate(item.cart_item_id);
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section>
          <h1 className="text-3xl font-bold text-cyan-100">Your Cart</h1>
          <p className="mt-2 text-slate-400">Review your items and redeem your rewards.</p>
        </section>

        {!currentUser && (
          <Card className="border border-rose-500/40 bg-rose-500/10">
            <h2 className="text-lg font-semibold text-rose-200">Session not found</h2>
            <p className="mt-2 text-sm text-rose-100/90">
              The cart requires an authenticated sales advisor session.
            </p>
          </Card>
        )}

        {currentUser && cartQuery.error && (
          <Card className="border border-rose-500/40 bg-rose-500/10">
            <h2 className="text-lg font-semibold text-rose-200">Unable to load cart</h2>
            <p className="mt-2 text-sm text-rose-100/90">{getErrorMessage(cartQuery.error)}</p>
          </Card>
        )}

        {actionError && (
          <Card className="border border-rose-500/40 bg-rose-500/10">
            <p className="text-sm text-rose-100/90">{actionError}</p>
          </Card>
        )}

        {hasCheckoutSuccess ? (
          <Card style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)" }}>
            <div
              className="flex items-start gap-3 rounded-xl border p-4"
              style={{
                borderColor: "rgba(16,185,129,0.35)",
                background: "rgba(16,185,129,0.08)",
              }}
            >
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-300" />
              <div className="flex-1">
                <p className="text-base font-semibold text-emerald-300">Redemption submitted successfully</p>
                <p className="mt-1 text-sm text-slate-300">{checkoutMutation.data?.confirmation_message}</p>
                <p className="mt-2 text-xs text-slate-400">Refresh the page to view the updated cart state.</p>
                <Link
                  to="/shop"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold text-slate-200 transition hover:text-cyan-200"
                  style={{ borderColor: "rgba(16,185,129,0.35)", background: "rgba(16,185,129,0.15)" }}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Shop
                </Link>
              </div>
            </div>
          </Card>
        ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-4">
            <Card style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)" }}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-xl border p-4" style={{ borderColor: "var(--panel-border)", background: "var(--panel-soft-bg)" }}>
                  <p className="inline-flex items-center gap-2 text-sm text-slate-400">
                    <ShoppingBag className="h-4 w-4 text-cyan-300" />
                    Available Credit
                  </p>
                  <p className="mt-2 text-4xl font-bold text-slate-100">
                    {cartQuery.isLoading ? "..." : formatCredits(availableCredits)}
                    <span className="ml-2 text-base font-semibold text-cyan-300">Credits</span>
                  </p>
                </div>

                <div className="rounded-xl border p-4" style={{ borderColor: "var(--panel-border)", background: "var(--panel-soft-bg)" }}>
                  <p className="inline-flex items-center gap-2 text-sm text-slate-400">
                    <ShoppingCart className="h-4 w-4 text-cyan-300" />
                    Remaining After Checkout
                  </p>
                  <p className="mt-2 text-4xl font-bold text-slate-100">
                    {cartQuery.isLoading ? "..." : formatCredits(remainingCredits)}
                    <span className="ml-2 text-base font-semibold text-cyan-300">Credits</span>
                  </p>
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden p-0" style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)" }}>
              <div
                className="hidden grid-cols-[minmax(0,1fr)_100px_120px_100px_40px] gap-4 border-b px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 md:grid"
                style={{ borderColor: "var(--panel-border)", background: "var(--panel-soft-bg)" }}
              >
                <span>Items ({items.length})</span>
                <span>Credit Cost</span>
                <span>Quantity</span>
                <span>Total</span>
                <span />
              </div>

              {cartQuery.isLoading ? (
                <div className="p-8 text-center text-sm text-slate-400">Loading cart...</div>
              ) : items.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-400">Your cart is empty.</div>
              ) : (
                <div className="divide-y" style={{ borderColor: "var(--panel-border)" }}>
                  {items.map((item) => (
                    <div key={item.cart_item_id} className="grid grid-cols-1 gap-4 px-4 py-4 md:grid-cols-[minmax(0,1fr)_100px_120px_100px_40px] md:items-center md:px-5">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className={`relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-gradient-to-br text-xs font-extrabold tracking-[0.18em] text-slate-100 ${getRewardAccent(toRewardShape(item))}`} style={{ borderColor: "var(--panel-border)" }}>
                          <img src={item.image_url} alt={item.reward_name} className="absolute inset-0 h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-slate-950/30" />
                          <span className="relative z-10">{getRewardMediaLabel(item)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-lg font-semibold leading-tight text-slate-100 md:text-base">{item.reward_name}</p>
                          <p className="mt-1 text-sm text-slate-400">Reward selected for redemption.</p>
                          <p className={`mt-2 text-sm font-semibold ${item.availability_status === "out_of_stock" ? "text-rose-300" : item.availability_status === "low_stock" ? "text-amber-300" : "text-emerald-300"}`}>
                            {getAvailabilityText(item.availability_status, item.stock_quantity)}
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-2xl font-bold text-slate-100 md:text-xl">{formatCredits(item.credit_cost_per_item)}</p>
                        <p className="text-xs text-slate-500">Credits</p>
                      </div>

                      <div>
                        <div className="inline-flex items-center rounded-lg border" style={{ borderColor: "var(--panel-border)", background: "var(--panel-soft-bg)" }}>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item, -1)}
                            disabled={updateCartItemMutation.isPending}
                            className="inline-flex h-8 w-8 items-center justify-center text-slate-300 hover:text-cyan-200"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold text-slate-200">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item, 1)}
                            disabled={updateCartItemMutation.isPending || item.quantity >= item.stock_quantity}
                            className="inline-flex h-8 w-8 items-center justify-center text-slate-300 hover:text-cyan-200 disabled:opacity-40"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Max: {item.stock_quantity}</p>
                      </div>

                      <div>
                        <p className="text-2xl font-bold text-slate-100 md:text-xl">{formatCredits(item.total_credit_cost)}</p>
                        <p className="text-xs text-slate-500">Credits</p>
                      </div>

                      <div>
                        <button
                          type="button"
                          onClick={() => removeItem(item)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border text-slate-400 transition hover:text-rose-300"
                          style={{ borderColor: "var(--panel-border)", background: "var(--panel-soft-bg)" }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)" }}>
              <div
                className="flex items-start gap-3 rounded-xl border p-3"
                style={{ borderColor: "var(--panel-border)", background: "var(--panel-soft-bg)" }}
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 text-cyan-300" />
                <div>
                  <p className="text-sm font-semibold text-slate-200">You can remove items or update quantities.</p>
                  <p className="text-sm text-slate-400">Credit and stock will be validated again during checkout.</p>
                </div>
              </div>
            </Card>

            <Card style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)" }}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-xl border p-4" style={{ borderColor: "var(--panel-border)", background: "var(--panel-soft-bg)" }}>
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-200">
                    <Shield className="h-4 w-4 text-cyan-300" />
                    Secure Checkout
                  </p>
                  <p className="mt-1 text-sm text-slate-400">Your redemption is safe and protected.</p>
                </div>
                <div className="rounded-xl border p-4" style={{ borderColor: "var(--panel-border)", background: "var(--panel-soft-bg)" }}>
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-200">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    Instant Confirmation
                  </p>
                  <p className="mt-1 text-sm text-slate-400">Get confirmation once your redemption is complete.</p>
                </div>
                <div className="rounded-xl border p-4" style={{ borderColor: "var(--panel-border)", background: "var(--panel-soft-bg)" }}>
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-200">
                    <Truck className="h-4 w-4 text-cyan-300" />
                    Track Your Orders
                  </p>
                  <p className="mt-1 text-sm text-slate-400">View your redemption history anytime.</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)" }}>
              <h2 className="text-2xl font-semibold text-slate-100 md:text-xl">Cart Summary</h2>

              <div className="mt-5 space-y-3 border-b pb-4" style={{ borderColor: "var(--panel-border)" }}>
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>Total Credit Cost</span>
                  <span className="font-semibold text-slate-100">{formatCredits(totalCreditCost)} Credits</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>Available Credit</span>
                  <span className="font-semibold text-slate-100">{formatCredits(availableCredits)} Credits</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-slate-400">Remaining After Checkout</span>
                <span className={`text-2xl font-bold ${remainingCredits >= 0 ? "text-cyan-300" : "text-rose-300"}`}>
                  {formatCredits(remainingCredits)}
                </span>
              </div>

              <div
                className="mt-4 flex items-start gap-3 rounded-xl border p-3"
                style={{
                  borderColor: canCheckout ? "rgba(16,185,129,0.35)" : "rgba(244,63,94,0.35)",
                  background: canCheckout ? "rgba(16,185,129,0.08)" : "rgba(244,63,94,0.08)",
                }}
              >
                {canCheckout ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-rose-300" />
                )}
                <div>
                  <p className={`text-sm font-semibold ${canCheckout ? "text-emerald-300" : "text-rose-300"}`}>
                    {canCheckout ? "You're good to go!" : "Unable to checkout"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {canCheckout ? "You have enough credit to checkout." : "Adjust cart quantity or remove items to continue."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={!canCheckout}
                onClick={() => checkoutMutation.mutate()}
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 text-sm font-semibold text-slate-900 transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Lock className="h-4 w-4" />
                {checkoutMutation.isPending ? "Processing redemption..." : "Confirm Redemption"}
              </button>

              {checkoutMutation.isSuccess && checkoutMutation.data && (
                <div
                  className="mt-3 flex items-start gap-3 rounded-xl border p-3"
                  style={{
                    borderColor: "rgba(16,185,129,0.35)",
                    background: "rgba(16,185,129,0.08)",
                  }}
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-300">Checkout complete</p>
                    <p className="text-xs text-slate-400">{checkoutMutation.data.confirmation_message}</p>
                  </div>
                </div>
              )}

              <Link
                to="/shop"
                className="mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl border text-sm font-semibold text-slate-200 transition hover:text-cyan-200"
                style={{ borderColor: "var(--panel-border)", background: "var(--panel-soft-bg)" }}
              >
                Continue Shopping
              </Link>
            </Card>

            <Card style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)" }}>
              <h3 className="text-lg font-semibold text-slate-100">Important</h3>
              <ul className="mt-3 space-y-3 text-sm text-slate-400">
                <li className="inline-flex items-start gap-2">
                  <Shield className="mt-0.5 h-4 w-4 text-cyan-300" />
                  Stock and credit are verified again at checkout.
                </li>
                <li className="inline-flex items-start gap-2">
                  <ShoppingBag className="mt-0.5 h-4 w-4 text-cyan-300" />
                  Rewards in your cart are not reserved until checkout.
                </li>
              </ul>
            </Card>
          </div>
        </div>
        )}
      </div>
    </AppShell>
  );
}
