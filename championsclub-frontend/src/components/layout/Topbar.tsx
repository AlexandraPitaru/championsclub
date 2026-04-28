import { Bell } from "lucide-react";

export default function Topbar() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div>
          <p className="text-sm text-slate-500">ChampionsClub Platform</p>
          <h2 className="text-lg font-semibold text-slate-900">
            Performance Management
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <select className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none">
            <option>This Week</option>
            <option>This Month</option>
          </select>

          <button className="relative rounded-full border border-slate-200 p-[clamp(0.5rem,0.7vw,0.8rem)] text-slate-600 transition hover:bg-slate-100">
            <Bell className="h-[clamp(1rem,1.2vw,1.35rem)] w-[clamp(1rem,1.2vw,1.35rem)]" />
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              3
            </span>
          </button>

          <div className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">
            Manager Demo
          </div>
        </div>
      </div>
    </header>
  );
}