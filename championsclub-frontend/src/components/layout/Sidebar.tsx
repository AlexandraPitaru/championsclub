import { NavLink } from "react-router-dom";
import { Bell, LayoutDashboard, Trophy } from "lucide-react";

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
    
export default function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 self-start border-r border-[#1d2a3a] bg-[#070f1b]/95 backdrop-blur lg:block">
      <div className="flex h-full flex-col justify-between">
        <div className="px-6 py-5">
          <div className="flex flex-col w-fit">
            <h2 className="text-xl font-bold text-cyan-100 w-fit">ChampionsClub</h2>
            <p className="mt-1 text-sm text-slate-400 w-fit">AI Sales Hub</p>
          </div>

          <nav className="mt-8 flex flex-col gap-3">
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
          <div className="rounded-xl border border-[#223246] bg-[#0d1624] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Active Role
            </p>
            <p className="mt-1 text-sm font-semibold text-cyan-100">
              Manager Demo
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}