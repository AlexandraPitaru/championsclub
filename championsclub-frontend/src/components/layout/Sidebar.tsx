import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Bell,
  LayoutDashboard,
  LogOut,
  Moon,
  PanelLeftOpen,
  Search,
  Sun,
  Trophy,
  X,
} from "lucide-react";
import { getLeaderboard } from "../../services/api/dashboardService";
import { useTheme } from "../../app/theme/ThemeProvider";

const navItems = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Leaderboard", to: "/leaderboard", icon: Trophy },
  { label: "Alerts", to: "/alerts", icon: Bell },
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
  const { isLight, theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const trimmedSearch = useMemo(() => searchInput.trim(), [searchInput]);
  const userRole = useMemo(() => getCurrentUserRole(), []);

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

  async function handleAdvisorSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!trimmedSearch) {
      setSearchError("Enter an advisor name.");
      return;
    }

    setIsSearching(true);
    setSearchError("");

    try {
      const response = await getLeaderboard({
        interval: "all",
        q: trimmedSearch,
        sortBy: "first_name",
        sortDir: "asc",
        page: 1,
        pageSize: 20,
      });

      const normalizedQuery = normalizeName(trimmedSearch);
      const exactMatch = response.items.find((advisor) => {
        const fullName = normalizeName(`${advisor.first_name} ${advisor.last_name}`);
        return fullName === normalizedQuery;
      });
      const matchedAdvisor = exactMatch ?? response.items[0];

      if (!matchedAdvisor) {
        setSearchError("No advisor found.");
        return;
      }

      setSearchInput("");
      setIsSearchOpen(false);
      closeMobileMenu();
      navigate(`/manager/advisor/${matchedAdvisor.user_id}`);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "Advisor search failed.");
    } finally {
      setIsSearching(false);
    }
  }

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between">
      <div className="px-6 py-5">
        <Link
          to="/dashboard"
          onClick={closeMobileMenu}
          className="group mx-auto flex w-full max-w-[260px] flex-col items-center gap-0.5 outline-none transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-cyan-500/60"
          aria-label="Go to dashboard"
        >
          <img
            src="/Logo2.png"
            alt="ChampionsClub logo"
            className="h-auto w-full object-contain transition group-hover:scale-[1.02]"
          />
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
          <button
            type="button"
            onClick={() => {
              setIsSearchOpen((current) => !current);
              setSearchError("");
            }}
            className={[
              "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
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

          {isSearchOpen ? (
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
              <button
                type="submit"
                disabled={isSearching}
                className={[
                  "mt-3 w-full rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-3 py-2 text-sm font-semibold transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60",
                  isLight ? "text-cyan-800" : "text-cyan-100",
                ].join(" ")}
              >
                {isSearching ? "Searching..." : "Go to advisor"}
              </button>
              {searchError ? <p className="mt-2 text-xs text-rose-300">{searchError}</p> : null}
            </form>
          ) : null}

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
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
            "mb-3 flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-semibold transition",
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
          <div className="flex items-center justify-between gap-2">
            <p
              className={[
                "text-[11px] font-bold uppercase tracking-[0.2em]",
                isLight ? "text-cyan-800" : "text-cyan-300",
              ].join(" ")}
            >
              Active Role
            </p>

            <span
              className={[
                "inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] shadow-[0_0_16px_rgba(6,182,212,0.22)]",
                isLight
                  ? "border-cyan-600/35 bg-cyan-500/20 text-cyan-950"
                  : "border-cyan-400/35 bg-cyan-500/18 text-cyan-50",
              ].join(" ")}
            >
              {userRole ? userRole.toUpperCase() : "UNKNOWN"}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20"
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
        className={[
          "fixed left-3 top-3 z-40 inline-flex h-10 w-10 items-center justify-center rounded-lg border shadow-[0_0_18px_rgba(6,182,212,0.22)] backdrop-blur lg:hidden",
          isLight
            ? "border-cyan-600/30 bg-white/90 text-cyan-800"
            : "border-cyan-500/40 bg-[#081322]/85 text-cyan-100",
        ].join(" ")}
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
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-500/35 bg-cyan-500/10 text-cyan-100"
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
