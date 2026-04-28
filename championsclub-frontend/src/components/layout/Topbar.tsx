import { Bell } from "lucide-react";

export default function Topbar() {
  return (
    <header className="border-b border-[#1d2a3a] bg-[#081120]/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div>
          <p className="text-sm text-slate-400">ChampionsClub Platform</p>
          <h2 className="text-lg font-semibold text-cyan-100">
            Performance Management
          </h2>
        </div>

        <div className="flex items-center gap-4">

          <button className="relative rounded-full border border-[#28415f] bg-[#0d1c30] p-[clamp(0.5rem,0.7vw,0.8rem)] text-cyan-100 transition hover:bg-[#122845]">
            <Bell className="h-[clamp(1rem,1.2vw,1.35rem)] w-[clamp(1rem,1.2vw,1.35rem)]" />
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-[#031018]">
              3
            </span>
          </button>

          <div className="rounded-xl border border-cyan-500/40 bg-cyan-500/15 px-4 py-2 text-sm font-medium text-cyan-100">
            Manager Demo
          </div>
        </div>
      </div>
    </header>
  );
}