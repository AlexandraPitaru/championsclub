import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Ticket,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { AxiosError } from "axios";

import AppShell from "../app/layouts/AppShell";
import { useTheme } from "../app/theme/ThemeProvider";
import Card from "../components/ui/Card";
import {
  useAddShopCartItem,
  useRemoveShopCartItem,
  useShopCart,
  useUpdateShopCartItem,
} from "../services/hooks/useShopCart";
import { useShopOverview } from "../services/hooks/useShopOverview";
import { useRedemptionHistory } from "../services/hooks/useRedemptionHistory";
import type {
  AvailabilityStatus,
  RedemptionHistoryRecord,
  ShopCartItem,
  ShopReward,
} from "../services/api/shopService";

type RewardCategory = "all" | "electronics" | "cards" | "travel";
const CREDIT_EPSILON = 1e-6;

function getCurrentUserFromStorage() {
  const currentUserRaw = localStorage.getItem("currentUser");
  if (!currentUserRaw) return null;

  try {
    return JSON.parse(currentUserRaw) as {
      user_id?: number;
      role?: string;
    };
  } catch {
    return null;
  }
}

function formatCredits(value: number): string {
  const rounded = Math.round(value);
  return (rounded === 0 ? 0 : rounded).toLocaleString("en-US");
}

function formatHistoryDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function deriveCategory(reward: ShopReward): RewardCategory {
  const name = reward.name.toLowerCase();

  if (name.includes("voucher") || name.includes("card")) {
    return "cards";
  }

  if (name.includes("travel") || name.includes("backpack") || name.includes("trip")) {
    return "travel";
  }

  return "electronics";
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

function getRewardMediaLabel(reward: ShopReward): string {
  return reward.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment.slice(0, 3).toUpperCase())
    .join(" ");
}

function getStatusStyles(status: AvailabilityStatus): string {
  if (status === "available") return "border-emerald-500/35 bg-emerald-500/15 text-emerald-300";
  if (status === "low_stock") return "border-amber-500/35 bg-amber-500/15 text-amber-300";
  return "border-rose-500/35 bg-rose-500/15 text-rose-300";
}

function getStatusLabel(status: AvailabilityStatus): string {
  if (status === "available") return "Available";
  if (status === "low_stock") return "Low stock";
  return "Out of stock";
}

function getErrorMessage(error: unknown): string | null {
  const axiosError = error as AxiosError<{ detail?: string }> | undefined;
  return axiosError?.response?.data?.detail || axiosError?.message || null;
}

export default function ShopPage() {
  const { isLight } = useTheme();
  const currentUser = useMemo(getCurrentUserFromStorage, []);
  const userId = currentUser?.user_id;

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<RewardCategory>("all");
  const [sortBy, setSortBy] = useState<"featured" | "priceAsc" | "priceDesc">("featured");

  const overviewQuery = useShopOverview(userId);
  const cartQuery = useShopCart(userId);
  const historyQuery = useRedemptionHistory(userId);

  const addCartItemMutation = useAddShopCartItem(userId);
  const updateCartItemMutation = useUpdateShopCartItem(userId);
  const removeCartItemMutation = useRemoveShopCartItem(userId);

  const rewards = overviewQuery.data?.rewards ?? [];
  const cartItems = cartQuery.data?.items ?? [];
  const totalCost = cartQuery.data?.total_credit_cost ?? 0;
  const availableCredits = overviewQuery.data?.available_credit ?? cartQuery.data?.available_credit ?? 0;
  const remainingCredits = cartQuery.data?.remaining_credit_after_checkout ?? availableCredits;
  const hasEnoughCredits = totalCost - availableCredits <= CREDIT_EPSILON;
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const redemptions = historyQuery.data ?? [];

  const cartItemByRewardId = useMemo(() => {
    return new Map(cartItems.map((item) => [item.reward_id, item]));
  }, [cartItems]);

  const filteredRewards = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    let items = rewards.filter((reward) => {
      const rewardCategory = deriveCategory(reward);
      const matchesCategory = category === "all" || rewardCategory === category;
      const matchesQuery =
        !normalizedQuery ||
        reward.name.toLowerCase().includes(normalizedQuery) ||
        (reward.description ?? "").toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });

    if (sortBy === "priceAsc") {
      items = [...items].sort((left, right) => left.credit_cost - right.credit_cost);
    }
    if (sortBy === "priceDesc") {
      items = [...items].sort((left, right) => right.credit_cost - left.credit_cost);
    }

    return items;
  }, [category, query, rewards, sortBy]);

  const actionError =
    getErrorMessage(addCartItemMutation.error) ||
    getErrorMessage(updateCartItemMutation.error) ||
    getErrorMessage(removeCartItemMutation.error);

  const overviewError = getErrorMessage(overviewQuery.error);
  const cartError = getErrorMessage(cartQuery.error);
  const historyError = getErrorMessage(historyQuery.error);

  function addToCart(rewardId: number) {
    addCartItemMutation.mutate({ reward_id: rewardId, quantity: 1 });
  }

  function updateQuantity(item: ShopCartItem, delta: number) {
    const nextQuantity = item.quantity + delta;

    if (nextQuantity <= 0) {
      removeCartItemMutation.mutate(item.cart_item_id);
      return;
    }

    updateCartItemMutation.mutate({
      cartItemId: item.cart_item_id,
      payload: { quantity: nextQuantity },
    });
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section>
          <h1 className="text-3xl font-bold text-cyan-100">Shop</h1>
          <p className="mt-2 text-slate-400">Redeem your credits for exclusive rewards.</p>
        </section>

        {!currentUser && (
          <Card className="border border-rose-500/40 bg-rose-500/10">
            <h2 className="text-lg font-semibold text-rose-200">Session not found</h2>
            <p className="mt-2 text-sm text-rose-100/90">
              The shop requires an authenticated sales advisor session.
            </p>
          </Card>
        )}

        {currentUser && (overviewError || cartError) && (
          <Card className="border border-rose-500/40 bg-rose-500/10">
            <h2 className="text-lg font-semibold text-rose-200">Unable to load shop data</h2>
            <p className="mt-2 text-sm text-rose-100/90">{overviewError || cartError}</p>
          </Card>
        )}

        {currentUser && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-4">
              <Card
                className="p-0"
                style={{
                  borderColor: "var(--panel-border)",
                  background: isLight
                    ? "linear-gradient(115deg, rgba(255,255,255,0.96), rgba(234,243,252,0.92))"
                    : "linear-gradient(115deg, rgba(7,31,62,0.95), rgba(6,22,44,0.75))",
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="p-5 md:p-6 md:border-r" style={{ borderColor: "var(--panel-border)" }}>
                    <div className="flex items-center gap-2 text-sm" style={{ color: isLight ? "#334155" : "#cbd5e1" }}>
                      <Ticket className={`h-4 w-4 ${isLight ? "text-cyan-700" : "text-cyan-300"}`} />
                      <span>Your Available Credit</span>
                    </div>
                    <p className="mt-2 text-4xl font-bold" style={{ color: isLight ? "#0f172a" : "#f1f5f9" }}>
                      {overviewQuery.isLoading ? "..." : formatCredits(availableCredits)}
                      <span className="ml-2 text-base font-semibold" style={{ color: isLight ? "#0e7490" : "#67e8f9" }}>
                        Credits
                      </span>
                    </p>
                  </div>
                  <div className="p-5 md:p-6">
                    <p className="text-sm font-semibold" style={{ color: isLight ? "#1e293b" : "#e2e8f0" }}>
                      How it works
                    </p>
                    <p className="mt-1 text-sm" style={{ color: isLight ? "#475569" : "#94a3b8" }}>
                      Rewards and available credit come directly from the backend. Add items to your cart and checkout when you are ready.
                    </p>
                  </div>
                </div>
              </Card>

              {actionError && (
                <Card className="border border-rose-500/40 bg-rose-500/10">
                  <p className="text-sm text-rose-100/90">{actionError}</p>
                </Card>
              )}

              <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px]">
                <div
                  className="flex items-center gap-2 rounded-xl border px-3"
                  style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)" }}
                >
                  <Search className="h-4 w-4 text-slate-500" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search rewards..."
                    className="h-11 w-full bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
                  />
                </div>

                <label
                  className="relative flex items-center rounded-xl border px-3"
                  style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)" }}
                >
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value as RewardCategory)}
                    className={`h-11 w-full appearance-none bg-transparent pr-6 text-sm outline-none ${
                      isLight ? "text-slate-700" : "text-slate-200"
                    }`}
                    style={{ colorScheme: isLight ? "light" : "dark" }}
                  >
                    <option value="all" style={{ backgroundColor: isLight ? "#ffffff" : "#08203f", color: isLight ? "#0f172a" : "#e2e8f0" }}>All Categories</option>
                    <option value="electronics" style={{ backgroundColor: isLight ? "#ffffff" : "#08203f", color: isLight ? "#0f172a" : "#e2e8f0" }}>Electronics</option>
                    <option value="cards" style={{ backgroundColor: isLight ? "#ffffff" : "#08203f", color: isLight ? "#0f172a" : "#e2e8f0" }}>Cards</option>
                    <option value="travel" style={{ backgroundColor: isLight ? "#ffffff" : "#08203f", color: isLight ? "#0f172a" : "#e2e8f0" }}>Travel</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400" />
                </label>

                <label
                  className="relative flex items-center rounded-xl border px-3"
                  style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)" }}
                >
                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value as "featured" | "priceAsc" | "priceDesc")}
                    className={`h-11 w-full appearance-none bg-transparent pr-6 text-sm outline-none ${
                      isLight ? "text-slate-700" : "text-slate-200"
                    }`}
                    style={{ colorScheme: isLight ? "light" : "dark" }}
                  >
                    <option value="featured" style={{ backgroundColor: isLight ? "#ffffff" : "#08203f", color: isLight ? "#0f172a" : "#e2e8f0" }}>Sort by: Featured</option>
                    <option value="priceAsc" style={{ backgroundColor: isLight ? "#ffffff" : "#08203f", color: isLight ? "#0f172a" : "#e2e8f0" }}>Sort by: Price Low-High</option>
                    <option value="priceDesc" style={{ backgroundColor: isLight ? "#ffffff" : "#08203f", color: isLight ? "#0f172a" : "#e2e8f0" }}>Sort by: Price High-Low</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400" />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                {overviewQuery.isLoading &&
                  Array.from({ length: 6 }).map((_, index) => (
                    <Card
                      key={`shop-skeleton-${index}`}
                      className="overflow-hidden p-3"
                      style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)" }}
                    >
                      <div className="mb-3 h-28 animate-pulse rounded-xl border bg-slate-800/50" style={{ borderColor: "var(--panel-border)" }} />
                      <div className="h-4 w-3/4 animate-pulse rounded bg-slate-700/50" />
                      <div className="mt-2 h-10 animate-pulse rounded bg-slate-800/40" />
                      <div className="mt-3 h-4 w-24 animate-pulse rounded bg-slate-700/50" />
                      <div className="mt-3 h-10 animate-pulse rounded-lg bg-slate-800/50" />
                    </Card>
                  ))}

                {!overviewQuery.isLoading && filteredRewards.length === 0 && (
                  <Card
                    className="col-span-full p-8 text-center"
                    style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)" }}
                  >
                    <p className="text-base font-semibold text-slate-100">No rewards available.</p>
                    <p className="mt-2 text-sm text-slate-400">Try a different filter or check back later.</p>
                  </Card>
                )}

                {filteredRewards.map((reward) => {
                  const status = reward.availability_status;
                  const isOut = status === "out_of_stock";
                  const cartItem = cartItemByRewardId.get(reward.reward_id);

                  return (
                    <Card
                      key={reward.reward_id}
                      className="overflow-hidden p-3"
                      style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)" }}
                    >
                      <div className="relative mb-3 h-28 overflow-hidden rounded-xl border bg-gradient-to-br" style={{ borderColor: "var(--panel-border)" }}>
                        <img
                          src={reward.image_url}
                          alt={reward.name}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                        <div className={`absolute inset-0 bg-gradient-to-br ${getRewardAccent(reward)}`} />
                        <div className="absolute inset-0 bg-slate-950/25" />
                        <span
                          className={`absolute left-2 top-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getStatusStyles(status)}`}
                        >
                          {getStatusLabel(status)}
                        </span>
                        <div className="absolute inset-0 flex items-center justify-center text-lg font-extrabold tracking-[0.2em] text-slate-100/85">
                          {getRewardMediaLabel(reward)}
                        </div>
                      </div>

                      <h3 className="text-base font-semibold text-slate-100">{reward.name}</h3>
                      <p className="mt-1 min-h-10 text-sm text-slate-400">{reward.description || "No description available."}</p>

                      <p className="mt-3 text-base font-bold text-cyan-300">{formatCredits(reward.credit_cost)} Credits</p>
                      <p className={`mt-0.5 text-xs ${isOut ? "text-rose-400" : status === "low_stock" ? "text-amber-300" : "text-slate-400"}`}>
                        {isOut ? "Out of stock" : status === "low_stock" ? `Low stock: ${reward.stock_quantity}` : `In stock: ${reward.stock_quantity}`}
                      </p>

                      <button
                        type="button"
                        onClick={() => addToCart(reward.reward_id)}
                        disabled={isOut || addCartItemMutation.isPending}
                        className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg border text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40"
                        style={{
                          borderColor: isOut ? "var(--panel-border)" : isLight ? "#0891b2" : "var(--panel-border)",
                          background: isOut
                            ? "var(--panel-subtle-bg)"
                            : isLight
                            ? "#0e7490"
                            : "color-mix(in srgb, var(--panel-bg) 72%, #0ea5e9 28%)",
                          color: isOut ? "#64748b" : isLight ? "#f8fafc" : "#e0f2fe",
                        }}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        {isOut ? "Unavailable" : cartItem ? "Add another" : "Add to cart"}
                      </button>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <Card style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)" }}>
                <div className="flex items-center justify-between">
                  <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-slate-100">
                    <ShoppingCart className="h-5 w-5 text-cyan-300" />
                    Your Cart
                  </h2>
                  <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs font-semibold text-cyan-200">
                    {cartCount}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {cartQuery.isLoading ? (
                    <p className="text-sm text-slate-400">Loading cart...</p>
                  ) : cartItems.length === 0 ? (
                    <p className="text-sm text-slate-400">Your cart is empty.</p>
                  ) : (
                    cartItems.map((item) => (
                      <div key={item.cart_item_id} className="flex items-start gap-3 rounded-xl border p-3" style={{ borderColor: "var(--panel-border)", background: "var(--panel-soft-bg)" }}>
                        <div className={`relative h-12 w-12 overflow-hidden rounded-lg bg-gradient-to-br ${getRewardAccent({
                          reward_id: item.reward_id,
                          name: item.reward_name,
                          description: null,
                          image_url: item.image_url,
                          credit_cost: item.credit_cost_per_item,
                          stock_quantity: item.stock_quantity,
                          availability_status: item.availability_status,
                        })}`}>
                          <img src={item.image_url} alt={item.reward_name} className="absolute inset-0 h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-slate-950/25" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-100">{item.reward_name}</p>
                          <p className="text-xs text-slate-400">{formatCredits(item.credit_cost_per_item)} Credits each</p>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item, -1)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border text-slate-300"
                            style={{ borderColor: "var(--panel-border)" }}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-6 text-center text-sm font-semibold text-slate-200">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item, 1)}
                            disabled={item.quantity >= item.stock_quantity || updateCartItemMutation.isPending}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border text-slate-300 disabled:opacity-40"
                            style={{ borderColor: "var(--panel-border)" }}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-semibold text-cyan-300">
                            {formatCredits(item.total_credit_cost)}
                          </p>
                          <button
                            type="button"
                            className="mt-1 inline-flex items-center text-xs text-slate-500 hover:text-slate-300"
                            onClick={() => removeCartItemMutation.mutate(item.cart_item_id)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4 space-y-2 border-t pt-4" style={{ borderColor: "var(--panel-border)" }}>
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>Total Credit Cost</span>
                    <span className="font-semibold text-slate-100">{formatCredits(totalCost)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>Available Credit</span>
                    <span className="font-semibold text-slate-100">{formatCredits(availableCredits)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Remaining Credit</span>
                    <span className={`font-bold ${hasEnoughCredits ? "text-cyan-300" : "text-rose-300"}`}>
                      {formatCredits(remainingCredits)}
                    </span>
                  </div>
                </div>

                <Link
                  to="/cart"
                  className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 text-sm font-semibold text-slate-900 transition hover:bg-cyan-500"
                >
                  View Cart & Checkout
                  <ChevronRight className="h-4 w-4" />
                </Link>

                <div
                  className="mt-4 flex items-start gap-2 rounded-xl border p-3"
                  style={{
                    borderColor: hasEnoughCredits ? "rgba(16,185,129,0.35)" : "rgba(244,63,94,0.35)",
                    background: hasEnoughCredits ? "rgba(16,185,129,0.08)" : "rgba(244,63,94,0.08)",
                  }}
                >
                  {hasEnoughCredits ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                  ) : (
                    <Clock3 className="mt-0.5 h-4 w-4 text-rose-300" />
                  )}
                  <div>
                    <p className={`text-sm font-semibold ${hasEnoughCredits ? "text-emerald-300" : "text-rose-300"}`}>
                      {hasEnoughCredits ? "You're good to go!" : "Not enough credits"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {hasEnoughCredits
                        ? "You have enough credit to checkout. Credit and stock will be revalidated during checkout."
                        : "Add fewer items or earn more credits."}
                    </p>
                  </div>
                </div>
              </Card>

              <Card style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)" }}>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-100">Redemption History</h2>
                  <Link to="/redemption-history" className="text-sm font-semibold text-cyan-300 hover:text-cyan-200">
                    View all
                  </Link>
                </div>

                <div className="mt-4 space-y-3">
                  {historyQuery.isLoading ? (
                    <p className="text-sm text-slate-400">Loading redemption history...</p>
                  ) : historyError ? (
                    <p className="text-sm text-rose-300">{historyError}</p>
                  ) : redemptions.length === 0 ? (
                    <p className="text-sm text-slate-400">No redemptions yet.</p>
                  ) : (
                    redemptions.slice(0, 3).map((item) => (
                      <HistoryRow key={item.redemption_id} item={item} />
                    ))
                  )}
                </div>

                <p className="mt-4 border-t pt-3 text-xs text-slate-500" style={{ borderColor: "var(--panel-border)" }}>
                  Track your past redemptions and deliveries.
                </p>
              </Card>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function HistoryRow({ item }: { item: RedemptionHistoryRecord }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-sm">
      <div className="min-w-0">
        <p className="truncate text-slate-200">Redemption #{item.redemption_id}</p>
        <p className="text-xs text-slate-500">{formatHistoryDate(item.created_at)}</p>
      </div>

      <div className="text-right">
        <p className="font-semibold text-slate-200">-{formatCredits(item.total_credit_spent)}</p>
        <p className="text-xs font-semibold text-emerald-300">{item.status}</p>
      </div>
    </div>
  );
}
