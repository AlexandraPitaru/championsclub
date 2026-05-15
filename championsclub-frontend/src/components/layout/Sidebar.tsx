import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Bell,
  History,
  LayoutDashboard,
  LogOut,
  Moon,
  PanelLeftOpen,
  Search,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Sun,
  Trophy,
  X,
} from "lucide-react";
import { getLeaderboard } from "../../services/api/dashboardService";
import { useTheme } from "../../app/theme/ThemeProvider";
import BrandLogo from "./BrandLogo";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, isDynamic: true },
  { label: "Sales Coach", to: "/advisor-ai", icon: Sparkles, roleRestrict: "sales_advisor" },
  { label: "Team Coach", to: "/manager-team-coach", icon: Sparkles, roleRestrict: "manager" },
  { label: "Rewards Hub", to: "/shop", icon: ShoppingBag },
  { label: "Checkout", to: "/cart", icon: ShoppingCart },
  { label: "Redemption History", to: "/redemption-history", icon: History },
  { label: "Leaderboard", to: "/leaderboard", icon: Trophy, isLeaderboard: true },
  { label: "Alerts", to: "/alerts", icon: Bell, roleRestrict: "manager" },
  { label: "Alerts", to: "/advisor-alerts", icon: Bell, roleRestrict: "sales_advisor" },
];

function normalizeName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function getCurrentUserRole(): string | null {
  try {
    const raw = localStorage.getItem("currentUser");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { role?: string };
    return parsed.role ?? null;
  } catch {
    return null;
  }
}

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLight, theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ user_id: number; first_name: string; last_name: string }>>([]);

  const trimmedSearch = useMemo(() => searchInput.trim(), [searchInput]);
  const userRole = useMemo(() => getCurrentUserRole(), []);
  const normalizedRole = userRole?.toLowerCase();
  const isSalesAdvisor = normalizedRole === "sales_advisor";
  const dashboardRoute = isSalesAdvisor ? "/advisor-dashboard" : "/dashboard";
  const leaderboardRoute = isSalesAdvisor ? "/advisor-leaderboard" : "/leaderboard";
  const canSearchAdvisor = !isSalesAdvisor;
  const visibleNavItems = useMemo(() => {
    return navItems.filter((item) => {
      // If item has roleRestrict, only show if user role matches
      if ("roleRestrict" in item && item.roleRestrict) {
        return userRole?.toLowerCase() === item.roleRestrict.toLowerCase();
      }

      // For managers, exclude sales advisor only features
      if (userRole?.toLowerCase() === "manager") {
        return (
          item.to !== "/shop" &&
          item.to !== "/cart" &&
          item.to !== "/redemption-history" &&
          item.to !== "/advisor-alerts"
        );
      }

      // For sales advisors, show everything except manager-only alerts route
      if (userRole?.toLowerCase() === "sales_advisor") {
        return item.to !== "/alerts";
      }

      return true;
    });
  }, [userRole]);

  useEffect(() => {
    if (!trimmedSearch || !canSearchAdvisor || !isSearchOpen) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        setSearchError("");
        
        const response = await getLeaderboard({
          interval: "all",
          q: trimmedSearch,
          sortBy: "first_name",
          sortDir: "asc",
          page: 1,
          pageSize: 3,
        });

        setSearchResults(response.items.slice(0, 3));
        
        if (response.items.length === 0) {
          setSearchError("No advisors found.");
        }
      } catch (error) {
        setSearchError("Search failed.");
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [trimmedSearch, canSearchAdvisor, isSearchOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobileMenuOpen]);

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  function handleLogout() {
    localStorage.removeItem("currentUser");
    closeMobileMenu();
    navigate("/login", { replace: true });
  }

  function handleAdvisorClick(userId: number) {
    setSearchInput("");
    setSearchResults([]);
    setIsSearchOpen(false);
    closeMobileMenu();
    navigate(`/manager/advisor/${userId}`);
  }

  async function handleAdvisorSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!trimmedSearch) {
      setSearchError("Enter an advisor name.");
      return;
    }

    if (searchResults.length > 0) {
      handleAdvisorClick(searchResults[0].user_id);
    }
  }

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between">
      <div className="px-6 py-5">
        <Link
          to={dashboardRoute}
          onClick={closeMobileMenu}
          className="group mx-auto flex w-full max-w-[260px] cursor-default flex-col items-center gap-0.5 outline-none transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-cyan-500/60"
          aria-label="Go to dashboard"
        >
          <BrandLogo className="h-[172px] w-full object-contain transition group-hover:scale-[1.02]" />
          <p
            className={[
              "text-center text-sm leading-tight",
              isLight ? "text-slate-600" : "text-slate-400",
            ].join(" ")}
          >
            <span className="block">Driven by passion.</span>
            <span className="block">Fueled by you.</span>
          </p>
        </Link>

        <nav className="mt-8 flex flex-col gap-3">
          {canSearchAdvisor ? (
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen((current) => !current);
                setSearchError("");
                setSearchResults([]);
                setSearchInput("");
              }}
              className={[
                "flex cursor-default items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                isSearchOpen
                  ? [
                      "border border-cyan-500/40 bg-cyan-500/15 shadow-[0_0_22px_rgba(6,182,212,0.18)]",
                      isLight ? "text-cyan-800" : "text-cyan-100",
                    ].join(" ")
                  : [
                      isLight
                        ? "text-slate-700 hover:text-cyan-800"
                        : "text-slate-300 hover:text-cyan-100",
                    ].join(" "),
              ].join(" ")}
              style={{ background: isSearchOpen ? undefined : "transparent" }}
              onMouseEnter={(event) => {
                if (!isSearchOpen) event.currentTarget.style.background = "var(--sidebar-hover)";
              }}
              onMouseLeave={(event) => {
                if (!isSearchOpen) event.currentTarget.style.background = "transparent";
              }}
            >
              <Search className="h-5 w-5" />
              <span>Search Advisor</span>
            </button>
          ) : null}

          {canSearchAdvisor && isSearchOpen ? (
            <form
              onSubmit={handleAdvisorSearch}
              className="rounded-xl border p-3"
              style={{
                borderColor: "var(--sidebar-border)",
                background: "var(--sidebar-panel-bg)",
              }}
            >
              <label
                className={[
                  "block text-xs font-semibold uppercase tracking-wide",
                  isLight ? "text-slate-600" : "text-slate-400",
                ].join(" ")}
              >
                Advisor Name
              </label>
              <input
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="e.g. David Enache"
                className={[
                  "mt-2 w-full rounded-lg border px-3 py-2 text-sm outline-none transition placeholder:text-slate-500 focus:border-cyan-500/60",
                  isLight ? "text-slate-800" : "text-slate-100",
                ].join(" ")}
                style={{
                  borderColor: "var(--sidebar-input-border)",
                  background: "var(--sidebar-input-bg)",
                }}
              />
              
              {searchResults.length > 0 && (
                <div className="mt-3 rounded-lg border divide-y" style={{ borderColor: "var(--sidebar-border)", background: "var(--sidebar-panel-bg)" }}>
                  {searchResults.map((advisor, index) => (
                    <button
                      key={advisor.user_id}
                      type="button"
                      onClick={() => handleAdvisorClick(advisor.user_id)}
                      className={[
                        "w-full px-3 py-2.5 text-left text-sm font-medium transition hover:bg-cyan-500/10",
                        "cursor-default",
                        index === 0 ? "rounded-t-lg" : "",
                        index === searchResults.length - 1 ? "rounded-b-lg" : "",
                        isLight ? "text-slate-700 hover:text-cyan-800" : "text-slate-200 hover:text-cyan-100",
                      ].join(" ")}
                      style={{
                        borderColor: "var(--sidebar-border)",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className={[
                          "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                          isLight ? "bg-slate-200 text-slate-700" : "bg-slate-700 text-slate-200"
                        ].join(" ")}>
                          {advisor.first_name[0]}{advisor.last_name[0]}
                        </span>
                        <span>{advisor.first_name} {advisor.last_name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={isSearching || searchResults.length === 0}
                className={[
                  "mt-3 w-full rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-3 py-2 text-sm font-semibold transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60",
                  "cursor-default",
                  isLight ? "text-cyan-800" : "text-cyan-100",
                ].join(" ")}
              >
                {isSearching ? "Searching..." : searchResults.length > 0 ? "Go to first advisor" : "Go to advisor"}
              </button>
              {searchError && !isSearching ? <p className="mt-2 text-xs text-rose-300">{searchError}</p> : null}
            </form>
          ) : null}

          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            
            // Handle dynamic routing for Dashboard
            if (item.isDynamic) {
              const handleDashboardClick = () => {
                navigate(dashboardRoute);
                closeMobileMenu();
              };

              return (
                <button
                  key={item.label}
                  onClick={handleDashboardClick}
                  className={[
                    "flex w-full cursor-default items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                    location.pathname === "/advisor-dashboard" || location.pathname === "/dashboard"
                      ? [
                          "border border-cyan-500/40 bg-cyan-500/15 shadow-[0_0_22px_rgba(6,182,212,0.18)]",
                          isLight ? "text-cyan-800" : "text-cyan-100",
                        ].join(" ")
                      : [
                          isLight
                            ? "text-slate-700 hover:text-cyan-800"
                            : "text-slate-300 hover:text-cyan-100",
                        ].join(" "),
                  ].join(" ")}
                  onMouseEnter={(event) => {
                    const isActive = location.pathname === "/advisor-dashboard" || location.pathname === "/dashboard";
                    if (!isActive) event.currentTarget.style.background = "var(--sidebar-hover)";
                  }}
                  onMouseLeave={(event) => {
                    const isActive = location.pathname === "/advisor-dashboard" || location.pathname === "/dashboard";
                    if (!isActive) event.currentTarget.style.background = "transparent";
                  }}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              );
            }

            if (item.isLeaderboard) {
              return (
                <NavLink
                  key={item.to}
                  to={leaderboardRoute}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                      "cursor-default",
                      isActive
                        ? [
                            "border border-cyan-500/40 bg-cyan-500/15 shadow-[0_0_22px_rgba(6,182,212,0.18)]",
                            isLight ? "text-cyan-800" : "text-cyan-100",
                          ].join(" ")
                        : [
                            isLight
                              ? "text-slate-700 hover:text-cyan-800"
                              : "text-slate-300 hover:text-cyan-100",
                          ].join(" "),
                    ].join(" ")
                  }
                  style={({ isActive }) => ({
                    background: isActive ? undefined : "transparent",
                  })}
                  onMouseEnter={(event) => {
                    const isActive = event.currentTarget.getAttribute("aria-current") === "page";
                    if (!isActive) event.currentTarget.style.background = "var(--sidebar-hover)";
                  }}
                  onMouseLeave={(event) => {
                    const isActive = event.currentTarget.getAttribute("aria-current") === "page";
                    if (!isActive) event.currentTarget.style.background = "transparent";
                  }}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                    "cursor-default",
                    isActive
                      ? [
                          "border border-cyan-500/40 bg-cyan-500/15 shadow-[0_0_22px_rgba(6,182,212,0.18)]",
                          isLight ? "text-cyan-800" : "text-cyan-100",
                        ].join(" ")
                      : [
                          isLight
                            ? "text-slate-700 hover:text-cyan-800"
                            : "text-slate-300 hover:text-cyan-100",
                        ].join(" "),
                  ].join(" ")
                }
                style={({ isActive }) => ({
                  background: isActive ? undefined : "transparent",
                })}
                onMouseEnter={(event) => {
                  const isActive = event.currentTarget.getAttribute("aria-current") === "page";
                  if (!isActive) event.currentTarget.style.background = "var(--sidebar-hover)";
                }}
                onMouseLeave={(event) => {
                  const isActive = event.currentTarget.getAttribute("aria-current") === "page";
                  if (!isActive) event.currentTarget.style.background = "transparent";
                }}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="border-t px-6 py-4" style={{ borderColor: "var(--sidebar-border)" }}>
        <button
          type="button"
          onClick={toggleTheme}
          className={[
            "mb-3 flex w-full cursor-default items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-semibold transition",
            isLight
              ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              : "border-slate-700 bg-slate-900/70 text-slate-200 hover:bg-slate-800/80",
          ].join(" ")}
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
        >
          <span className="inline-flex items-center gap-2">
            {isLight ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span>{isLight ? "Light Theme" : "Dark Theme"}</span>
          </span>
          <span
            className={[
              "inline-flex h-5 w-10 items-center rounded-full p-1 transition",
              isLight ? "bg-cyan-200" : "bg-slate-700",
            ].join(" ")}
          >
            <span
              className={[
                "h-3.5 w-3.5 rounded-full bg-white transition",
                isLight ? "translate-x-5" : "translate-x-0",
              ].join(" ")}
            />
          </span>
        </button>

        <div
          className="rounded-xl border px-3 py-2.5 shadow-[0_10px_24px_rgba(2,8,23,0.22)]"
          style={{
            borderColor: "var(--role-card-border)",
            background: "var(--role-card-grad)",
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <p
              className={[
                "text-[11px] font-bold uppercase tracking-[0.2em] leading-tight",
                isLight ? "text-cyan-800" : "text-cyan-300",
              ].join(" ")}
            >
              Active Role
            </p>

            <span
              className={[
                "inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] shadow-[0_0_16px_rgba(6,182,212,0.22)] whitespace-nowrap",
                isLight
                  ? "border-cyan-600/35 bg-cyan-500/20 text-cyan-950"
                  : "border-cyan-400/35 bg-cyan-500/18 text-cyan-50",
              ].join(" ")}
            >
              {userRole ? userRole.replace(/_/g, " ").toUpperCase() : "UNKNOWN"}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 flex w-full cursor-default items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:opacity-80"
          style={{
            borderColor: "var(--panel-border)",
            background: "var(--panel-soft-bg)",
            color: "var(--text)",
          }}
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        aria-label="Open navigation menu"
        onClick={() => setIsMobileMenuOpen(true)}
        className="fixed left-3 top-3 z-40 inline-flex h-10 w-10 items-center justify-center rounded-lg border shadow-[0_0_18px_rgba(6,182,212,0.22)] backdrop-blur lg:hidden"
        style={{
          borderColor: "var(--card-border)",
          background: "color-mix(in srgb, var(--sidebar-bg) 90%, transparent)",
          color: isLight ? "#0e7490" : "#06b6d4"
        }}
      >
        <PanelLeftOpen className="h-5 w-5" />
      </button>

      <div className={`fixed inset-0 z-50 lg:hidden ${isMobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={closeMobileMenu}
          className={`absolute inset-0 bg-black/35 transition-opacity ${isMobileMenuOpen ? "opacity-100" : "opacity-0"}`}
        />

        <aside
          className={`absolute inset-y-0 left-0 flex h-full w-72 max-w-[86vw] flex-col border-r backdrop-blur transition-transform duration-200 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
          style={{
            borderColor: "var(--sidebar-border)",
            background: "var(--sidebar-bg)",
          }}
        >
          <div className="flex justify-end px-4 pt-4">
            <button
              type="button"
              onClick={closeMobileMenu}
              aria-label="Close menu"
              className="inline-flex h-9 w-9 cursor-default items-center justify-center rounded-lg border border-cyan-500/35 bg-cyan-500/10 text-cyan-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {sidebarContent}
        </aside>
      </div>

      <aside
        className="sticky top-0 hidden h-screen w-64 shrink-0 self-start border-r backdrop-blur lg:block"
        style={{
          borderColor: "var(--sidebar-border)",
          background: "var(--sidebar-bg)",
        }}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
