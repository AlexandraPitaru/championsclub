import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { FormEvent } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Bell,
  LayoutDashboard,
  LogOut,
  Search,
  Sparkles,
  Trophy,
} from "lucide-react";
import { getLeaderboard } from "../../services/api/dashboardService";

const navItems = [
  {
    label: "Dashboard",
    to: "/dashboard",
    icon: LayoutDashboard
  },
  {
    label: "Leaderboard",
    to: "/leaderboard",
    icon: Trophy
  },
  {
    label: "Alerts",
    to: "/alerts",
    icon: Bell
  },
]

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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const trimmedSearch = useMemo(() => searchInput.trim(), [searchInput]);
  const userRole = useMemo(() => getCurrentUserRole(), []);

  function handleLogout() {
    localStorage.removeItem("currentUser");
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
      navigate(`/manager/advisor/${matchedAdvisor.user_id}`);
    } catch (error) {
      setSearchError(
        error instanceof Error ? error.message : "Advisor search failed."
      );
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 self-start border-r border-[#1d2a3a] bg-[#070f1b]/95 backdrop-blur lg:block">
      <div className="flex h-full flex-col justify-between">
        <div className="px-6 py-5">
          <Link
            to="/dashboard"
            className="group flex w-fit items-center gap-3 rounded-xl outline-none transition hover:opacity-95 focus-visible:ring-2 focus-visible:ring-cyan-500/60"
            aria-label="Go to dashboard"
          >
            <img
              src="/mascot.png"
              alt="ChampionsClub mascot"
              className="h-12 w-12 rounded-lg border border-cyan-500/25 bg-[#081322] object-cover shadow-[0_0_20px_rgba(6,182,212,0.2)] transition group-hover:scale-[1.03]"
            />
            <div>
              <h2 className="w-fit text-xl font-bold text-cyan-100">ChampionsClub</h2>
              <p className="mt-1 w-fit text-sm text-slate-400">AI Sales Hub</p>
            </div>
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
                  ? "border border-cyan-500/40 bg-cyan-500/15 text-cyan-100 shadow-[0_0_22px_rgba(6,182,212,0.18)]"
                  : "text-slate-300 hover:bg-[#0f1a2a] hover:text-cyan-100",
              ].join(" ")}
            >
              <Search className="h-5 w-5" />
              <span>Search Advisor</span>
            </button>

            {isSearchOpen ? (
              <form
                onSubmit={handleAdvisorSearch}
                className="rounded-xl border border-[#223246] bg-[#0d1624] p-3"
              >
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Advisor Name
                </label>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="e.g. David Enache"
                  className="mt-2 w-full rounded-lg border border-[#29405b] bg-[#081322] px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-500/60"
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="mt-3 w-full rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-3 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSearching ? "Searching..." : "Go to advisor"}
                </button>
                {searchError ? (
                  <p className="mt-2 text-xs text-rose-300">{searchError}</p>
                ) : null}
              </form>
            ) : null}

            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                      isActive
                        ? "border border-cyan-500/40 bg-cyan-500/15 text-cyan-100 shadow-[0_0_22px_rgba(6,182,212,0.18)]"
                        : "text-slate-300 hover:bg-[#0f1a2a] hover:text-cyan-100",
                    ].join(" ")
                  }
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-[#1d2a3a] px-6 py-4">
          <div className="rounded-xl border border-[#223246] bg-[#0d1624] px-4 py-3 shadow-[0_12px_24px_rgba(2,8,23,0.22)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Active Role
                </p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-cyan-100">
                  {userRole ?? "Unknown"}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Team oversight enabled
                </p>
              </div>

              <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-medium text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                Live
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
    </aside>
  );
}