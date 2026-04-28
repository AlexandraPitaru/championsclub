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
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 self-start border-r border-slate-200 bg-white lg:block">
      <div className="flex h-full flex-col justify-between">
        <div className="px-6 py-5">
          <div className="flex flex-col w-fit">
            <h2 className="text-xl font-bold text-slate-900 w-fit">ChampionsClub</h2>
            <p className="mt-1 text-sm text-slate-500 w-fit">AI Sales Hub</p>
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
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
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

        <div className="border-t border-slate-200 px-6 py-4">
          <div className="rounded-xl bg-slate-100 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Active Role
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              Manager Demo
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}