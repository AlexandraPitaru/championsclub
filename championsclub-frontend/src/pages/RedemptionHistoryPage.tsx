import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Search,
  ShieldCheck,
  Truck,
  XCircle,
} from "lucide-react";
import AppShell from "../app/layouts/AppShell";
import Card from "../components/ui/Card";
import { useTheme } from "../app/theme/ThemeProvider";
import { useRedemptionHistory } from "../services/hooks/useRedemptionHistory";
import { useSearchParams } from "react-router-dom";

const REDEMPTIONS_PER_PAGE = 10;

type RedemptionStatus = "Completed" | "Pending" | "Cancelled";
type DateRangeFilter = "all" | "last30" | "last90";
type SortOrder = "newest" | "oldest";

type RedemptionItem = {
  id: string;
  label: string;
  qty: number;
  accent: string;
  creditCostPerItem: number;
  totalCreditCost: number;
};

type RedemptionRecord = {
  id: string;
  placedAt: string;
  status: RedemptionStatus;
  credits: number;
  deliveryLabel: string;
  items: RedemptionItem[];
};

function formatCredits(value: number): string {
  return value.toLocaleString("en-US");
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function formatTime(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function getStatusClasses(status: RedemptionStatus): string {
  if (status === "Completed") return "border-emerald-500/35 bg-emerald-500/15 text-emerald-300";
  if (status === "Pending") return "border-amber-500/35 bg-amber-500/15 text-amber-300";
  return "border-rose-500/35 bg-rose-500/15 text-rose-300";
}

function getStatusIcon(status: RedemptionStatus) {
  if (status === "Completed") return <CheckCircle2 className="h-3.5 w-3.5" />;
  if (status === "Pending") return <Clock3 className="h-3.5 w-3.5" />;
  return <XCircle className="h-3.5 w-3.5" />;
}

function getAccentFromRewardName(name: string): string {
  const normalized = name.toLowerCase();
  if (normalized.includes("watch")) return "from-amber-500/30 to-orange-500/10";
  if (normalized.includes("voucher") || normalized.includes("card")) return "from-blue-500/30 to-indigo-500/10";
  if (normalized.includes("backpack") || normalized.includes("travel")) return "from-rose-500/30 to-red-500/10";
  if (normalized.includes("earbud")) return "from-emerald-500/30 to-cyan-500/10";
  if (normalized.includes("coffee") || normalized.includes("espresso")) return "from-violet-500/30 to-purple-500/10";
  if (normalized.includes("speaker")) return "from-cyan-500/30 to-blue-500/10";
  return "from-cyan-500/30 to-sky-500/10";
}

function toDisplayStatus(value: string): RedemptionStatus {
  const normalized = value.trim().toLowerCase();
  if (normalized === "completed") return "Completed";
  if (normalized === "pending") return "Pending";
  if (normalized === "cancelled") return "Cancelled";
  return "Completed";
}

export default function RedemptionHistoryPage() {
  const { isLight } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUserRaw = localStorage.getItem("currentUser");
  const currentUser = useMemo(() => {
    if (!currentUserRaw) return null;
    try {
      return JSON.parse(currentUserRaw) as { user_id?: number };
    } catch {
      return null;
    }
  }, [currentUserRaw]);

  const historyQuery = useRedemptionHistory(currentUser?.user_id);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | RedemptionStatus>("All");
  const [dateRange, setDateRange] = useState<DateRangeFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [expandedRedemptionId, setExpandedRedemptionId] = useState<string | null>(null);

  const redemptions = useMemo<RedemptionRecord[]>(() => {
    return (historyQuery.data ?? []).map((entry) => ({
      id: String(entry.redemption_id),
      placedAt: entry.created_at,
      status: toDisplayStatus(entry.status),
      credits: entry.total_credit_spent,
      deliveryLabel:
        toDisplayStatus(entry.status) === "Cancelled"
          ? `Cancelled on ${formatDate(entry.created_at)}`
          : `Updated on ${formatDate(entry.created_at)}`,
      items: entry.redeemed_items.map((item) => ({
        id: `${entry.redemption_id}-${item.reward_id}`,
        label: item.reward_name,
        qty: item.quantity,
        accent: getAccentFromRewardName(item.reward_name),
        creditCostPerItem: item.credit_cost_per_item,
        totalCreditCost: item.total_credit_cost,
      })),
      }));
  }, [historyQuery.data]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const now = Date.now();

    const filteredEntries = redemptions.filter((entry) => {
      const matchesQuery =
        !normalizedQuery ||
        entry.id.toLowerCase().includes(normalizedQuery) ||
        entry.items.some((item) => item.label.toLowerCase().includes(normalizedQuery));

      const matchesStatus = statusFilter === "All" || entry.status === statusFilter;

      let matchesDateRange = true;
      const entryTime = new Date(entry.placedAt).getTime();
      if (dateRange === "last30") matchesDateRange = now - entryTime <= 30 * 24 * 60 * 60 * 1000;
      if (dateRange === "last90") matchesDateRange = now - entryTime <= 90 * 24 * 60 * 60 * 1000;

      return matchesQuery && matchesStatus && matchesDateRange;
    });

    return [...filteredEntries].sort((left, right) => {
      const leftTime = new Date(left.placedAt).getTime();
      const rightTime = new Date(right.placedAt).getTime();
      return sortOrder === "newest" ? rightTime - leftTime : leftTime - rightTime;
    });
  }, [dateRange, query, redemptions, sortOrder, statusFilter]);

  const requestedPage = Number.parseInt(searchParams.get("page") ?? "1", 10);
  const currentPage = Number.isNaN(requestedPage) || requestedPage < 1 ? 1 : requestedPage;
  const totalPages = Math.max(1, Math.ceil(filtered.length / REDEMPTIONS_PER_PAGE));
  const activePage = Math.min(currentPage, totalPages);

  const paginatedRedemptions = useMemo(() => {
    const offset = (activePage - 1) * REDEMPTIONS_PER_PAGE;
    return filtered.slice(offset, offset + REDEMPTIONS_PER_PAGE);
  }, [activePage, filtered]);

  const firstVisibleIndex = filtered.length === 0 ? 0 : (activePage - 1) * REDEMPTIONS_PER_PAGE + 1;
  const lastVisibleIndex = Math.min(activePage * REDEMPTIONS_PER_PAGE, filtered.length);

  function setPage(nextPage: number) {
    const clampedPage = Math.max(1, Math.min(nextPage, totalPages));
    const nextParams = new URLSearchParams(searchParams);
    if (clampedPage === 1) {
      nextParams.delete("page");
    } else {
      nextParams.set("page", String(clampedPage));
    }
    setSearchParams(nextParams);
  }

  const summary = useMemo(() => {
    const totalRedemptions = redemptions.length;
    const totalCreditsSpent = redemptions.reduce((sum, entry) => sum + entry.credits, 0);
    const mostRecent = [...redemptions].sort(
      (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
    )[0];
    const deliveredCount = redemptions.filter((entry) => entry.status === "Completed").length;
    const deliveredPct = totalRedemptions ? Math.round((deliveredCount / totalRedemptions) * 100) : 0;

    return {
      totalRedemptions,
      totalCreditsSpent,
      mostRecent,
      deliveredCount,
      deliveredPct,
    };
  }, [redemptions]);

  return (
    <AppShell>
      <div className="space-y-6">
        <section>
          <h1 className="text-3xl font-bold text-cyan-100">Redemptions</h1>
          <p className="mt-2 text-slate-400">Track your past reward redemptions and deliveries.</p>
        </section>

        <Card
          className="p-0"
          style={{
            borderColor: "var(--panel-border)",
            background: isLight
              ? "linear-gradient(115deg, rgba(255,255,255,0.96), rgba(237,245,252,0.92))"
              : "linear-gradient(115deg, rgba(7,31,62,0.95), rgba(6,22,44,0.75))",
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
            <div className="p-5 md:p-6" style={{ borderBottom: "1px solid var(--panel-border)", borderRight: "1px solid var(--panel-border)" }}>
              <p className="text-xs" style={{ color: isLight ? "#475569" : "#94a3b8" }}>Total Redemptions</p>
              <p className="mt-1 text-3xl font-bold" style={{ color: isLight ? "#0f172a" : "#f8fafc" }}>{summary.totalRedemptions}</p>
              <p className="mt-1 text-xs" style={{ color: isLight ? "#64748b" : "#64748b" }}>All time</p>
            </div>
            <div className="p-5 md:p-6" style={{ borderBottom: "1px solid var(--panel-border)", borderRight: "1px solid var(--panel-border)" }}>
              <p className="text-xs" style={{ color: isLight ? "#475569" : "#94a3b8" }}>Total Credits Spent</p>
              <p className="mt-1 text-3xl font-bold" style={{ color: isLight ? "#0f172a" : "#f8fafc" }}>{formatCredits(summary.totalCreditsSpent)}</p>
              <p className="mt-1 text-xs" style={{ color: isLight ? "#64748b" : "#64748b" }}>Credits</p>
            </div>
            <div className="p-5 md:p-6" style={{ borderBottom: "1px solid var(--panel-border)", borderRight: "1px solid var(--panel-border)" }}>
              <p className="text-xs" style={{ color: isLight ? "#475569" : "#94a3b8" }}>Most Recent</p>
              <p className="mt-1 text-3xl font-bold" style={{ color: isLight ? "#0f172a" : "#f8fafc" }}>{summary.mostRecent ? formatDate(summary.mostRecent.placedAt) : "-"}</p>
              <p className="mt-1 text-xs" style={{ color: isLight ? "#64748b" : "#64748b" }}>#{summary.mostRecent?.id ?? "N/A"}</p>
            </div>
            <div className="p-5 md:p-6" style={{ borderBottom: "1px solid var(--panel-border)" }}>
              <p className="text-xs" style={{ color: isLight ? "#475569" : "#94a3b8" }}>Delivered</p>
              <p className="mt-1 text-3xl font-bold" style={{ color: isLight ? "#0f172a" : "#f8fafc" }}>{summary.deliveredCount}</p>
              <p className="mt-1 text-xs" style={{ color: isLight ? "#64748b" : "#64748b" }}>{summary.deliveredPct}% of all</p>
            </div>
          </div>
        </Card>

        <Card style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)" }}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px_220px]">
            <div
              className="flex items-center gap-2 rounded-xl border px-3"
              style={{ borderColor: "var(--panel-border)", background: "var(--panel-soft-bg)" }}
            >
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by redemption ID or item"
                className="h-11 w-full bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
              />
            </div>

            <label
              className="relative flex items-center rounded-xl border px-3"
              style={{ borderColor: "var(--panel-border)", background: "var(--panel-soft-bg)" }}
            >
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as "All" | RedemptionStatus)}
                className={`h-11 w-full appearance-none bg-transparent pr-6 text-sm outline-none ${
                  isLight ? "text-slate-700" : "text-slate-200"
                }`}
                style={{ colorScheme: isLight ? "light" : "dark" }}
              >
                <option value="All" style={{ backgroundColor: isLight ? "#ffffff" : "#08203f", color: isLight ? "#0f172a" : "#e2e8f0" }}>All Statuses</option>
                <option value="Completed" style={{ backgroundColor: isLight ? "#ffffff" : "#08203f", color: isLight ? "#0f172a" : "#e2e8f0" }}>Completed</option>
                <option value="Pending" style={{ backgroundColor: isLight ? "#ffffff" : "#08203f", color: isLight ? "#0f172a" : "#e2e8f0" }}>Pending</option>
                <option value="Cancelled" style={{ backgroundColor: isLight ? "#ffffff" : "#08203f", color: isLight ? "#0f172a" : "#e2e8f0" }}>Cancelled</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400" />
            </label>

            <label
              className="relative flex items-center rounded-xl border px-3"
              style={{ borderColor: "var(--panel-border)", background: "var(--panel-soft-bg)" }}
            >
              <select
                value={dateRange}
                onChange={(event) => setDateRange(event.target.value as DateRangeFilter)}
                className={`h-11 w-full appearance-none bg-transparent pr-8 text-sm outline-none ${
                  isLight ? "text-slate-700" : "text-slate-200"
                }`}
                style={{ colorScheme: isLight ? "light" : "dark" }}
              >
                <option value="all" style={{ backgroundColor: isLight ? "#ffffff" : "#08203f", color: isLight ? "#0f172a" : "#e2e8f0" }}>Date range</option>
                <option value="last30" style={{ backgroundColor: isLight ? "#ffffff" : "#08203f", color: isLight ? "#0f172a" : "#e2e8f0" }}>Last 30 days</option>
                <option value="last90" style={{ backgroundColor: isLight ? "#ffffff" : "#08203f", color: isLight ? "#0f172a" : "#e2e8f0" }}>Last 90 days</option>
              </select>
              <CalendarDays className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400" />
            </label>

            <label
              className="relative flex items-center rounded-xl border px-3"
              style={{ borderColor: "var(--panel-border)", background: "var(--panel-soft-bg)" }}
            >
              <select
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value as SortOrder)}
                className={`h-11 w-full appearance-none bg-transparent pr-8 text-sm outline-none ${
                  isLight ? "text-slate-700" : "text-slate-200"
                }`}
                style={{ colorScheme: isLight ? "light" : "dark" }}
              >
                <option value="newest" style={{ backgroundColor: isLight ? "#ffffff" : "#08203f", color: isLight ? "#0f172a" : "#e2e8f0" }}>Newest to Oldest</option>
                <option value="oldest" style={{ backgroundColor: isLight ? "#ffffff" : "#08203f", color: isLight ? "#0f172a" : "#e2e8f0" }}>Oldest to Newest</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-slate-400" />
            </label>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border" style={{ borderColor: "var(--panel-border)" }}>
            <div
              className="hidden grid-cols-[180px_minmax(0,1fr)_130px_150px_160px] gap-4 border-b px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 md:grid"
              style={{ background: "var(--panel-soft-bg)", borderColor: "var(--panel-border)" }}
            >
              <span>Redemption</span>
              <span>Items</span>
              <span>Total Credits</span>
              <span>Status</span>
              <span>Date</span>
            </div>

            {historyQuery.isLoading ? (
              <div className="p-8 text-center text-sm text-slate-400">Loading redemptions...</div>
            ) : historyQuery.error ? (
              <div className="p-8 text-center text-sm text-rose-300">Unable to load redemption history.</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">No redemptions match the selected filters.</div>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--panel-border)" }}>
                {paginatedRedemptions.map((entry) => (
                  <div key={entry.id} className="px-4 py-4 md:px-6 md:py-5">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[180px_minmax(0,1fr)_130px_150px_160px] md:items-center">
                      <div>
                        <p className="text-xl font-bold text-slate-100 md:text-lg">#{entry.id}</p>
                        <p className="text-xs text-slate-500">
                          {formatDate(entry.placedAt)} - {formatTime(entry.placedAt)}
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedRedemptionId((current) =>
                              current === entry.id ? null : entry.id
                            )
                          }
                          className="mt-1 text-sm font-semibold text-cyan-300 hover:text-cyan-200"
                        >
                          {expandedRedemptionId === entry.id ? "Hide details" : "View details"}
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {entry.items.slice(0, 3).map((item) => (
                          <div
                            key={`${entry.id}-${item.id}`}
                            className={`inline-flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs text-slate-200 bg-gradient-to-br ${item.accent}`}
                            style={{ borderColor: "var(--panel-border)" }}
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span>{item.qty}x</span>
                          </div>
                        ))}
                        {entry.items.length > 3 ? (
                          <span className="rounded-lg border px-2 py-1 text-xs text-slate-400" style={{ borderColor: "var(--panel-border)" }}>
                            +{entry.items.length - 3} more
                          </span>
                        ) : null}
                      </div>

                      <div>
                        <p className="text-xl font-bold text-slate-100 md:text-2xl">{formatCredits(entry.credits)}</p>
                        <p className="text-xs text-slate-500">Credits</p>
                      </div>

                      <div>
                        <span
                          className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(entry.status)}`}
                        >
                          {getStatusIcon(entry.status)}
                          {entry.status}
                        </span>
                      </div>

                      <div className="inline-flex items-start gap-2 text-xs text-slate-400">
                        {entry.status === "Cancelled" ? (
                          <XCircle className="mt-0.5 h-4 w-4 text-rose-400" />
                        ) : (
                          <Truck className="mt-0.5 h-4 w-4 text-slate-500" />
                        )}
                        <span>{entry.deliveryLabel}</span>
                      </div>
                    </div>

                    {expandedRedemptionId === entry.id && (
                      <div
                        className="mt-4 rounded-xl border"
                        style={{ borderColor: "var(--panel-border)", background: "var(--panel-soft-bg)" }}
                      >
                        <div
                          className="hidden grid-cols-[minmax(0,1fr)_100px_140px_140px] gap-3 border-b px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 md:grid"
                          style={{ borderColor: "var(--panel-border)" }}
                        >
                          <span>Reward</span>
                          <span>Quantity</span>
                          <span>Cost / Item</span>
                          <span>Total</span>
                        </div>

                        <div className="divide-y" style={{ borderColor: "var(--panel-border)" }}>
                          {entry.items.map((item) => (
                            <div
                              key={`details-${entry.id}-${item.id}`}
                              className="grid grid-cols-1 gap-2 px-4 py-3 md:grid-cols-[minmax(0,1fr)_100px_140px_140px] md:items-center"
                            >
                              <div className="inline-flex items-center gap-2 min-w-0">
                                <span
                                  className={`inline-flex h-7 w-7 items-center justify-center rounded-md border bg-gradient-to-br ${item.accent}`}
                                  style={{ borderColor: "var(--panel-border)" }}
                                >
                                  <ShieldCheck className="h-3.5 w-3.5 text-slate-100" />
                                </span>
                                <span className="truncate text-sm font-semibold text-slate-200">{item.label}</span>
                              </div>

                              <p className="text-sm text-slate-300">{item.qty}</p>
                              <p className="text-sm text-slate-300">{formatCredits(item.creditCostPerItem)}</p>
                              <p className="text-sm font-semibold text-cyan-300">{formatCredits(item.totalCreditCost)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 items-center gap-3 text-xs text-slate-500 md:grid-cols-3">
            <span className="text-left">
              Showing {firstVisibleIndex}-{lastVisibleIndex} of {filtered.length} redemptions
            </span>
            <div className="flex justify-center">
              {filtered.length > REDEMPTIONS_PER_PAGE && (
                <div className="inline-flex items-center gap-1 rounded-lg border px-1 py-1" style={{ borderColor: "var(--panel-border)", background: "var(--panel-soft-bg)" }}>
                  <button
                    type="button"
                    onClick={() => setPage(activePage - 1)}
                    disabled={activePage <= 1}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-300 transition hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Previous redemption page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <span className="min-w-[24px] text-center text-xs font-semibold text-slate-300">{activePage}</span>

                  <button
                    type="button"
                    onClick={() => setPage(activePage + 1)}
                    disabled={activePage >= totalPages}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-300 transition hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Next redemption page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <span className="inline-flex items-center justify-start gap-1 text-cyan-300 md:justify-end">
              <CircleDollarSign className="h-3.5 w-3.5" />
              Synced from backend
            </span>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
