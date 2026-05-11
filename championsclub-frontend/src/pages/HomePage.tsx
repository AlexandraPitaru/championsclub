import { Link } from "react-router-dom";
import { Gift, LogIn, Sparkles, Trophy, UsersRound } from "lucide-react";

const focusAreas = [
  {
    title: "For managers",
    description: "A clear place to understand team activity and follow up where attention is needed.",
    icon: UsersRound,
    accent: "text-blue-400",
  },
  {
    title: "For advisors",
    description: "A personal workspace for progress, recognition, and next steps.",
    icon: Trophy,
    accent: "text-amber-400",
  },
  {
    title: "For rewards",
    description: "A simple way to connect performance with meaningful rewards.",
    icon: Gift,
    accent: "text-emerald-400",
  },
];

export default function HomePage() {
  return (
    <main
      className="min-h-screen text-[var(--text)]"
      style={{
        backgroundColor: "var(--bg)",
        backgroundImage: "var(--app-shell-gradient)",
      }}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3" aria-label="ChampionsClub">
            <img
              src="/Logo2.png"
              alt="ChampionsClub logo"
              className="h-12 w-auto object-contain sm:h-14"
            />
          </div>

          <Link
            to="/login"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-cyan-500/45 bg-cyan-500/15 px-4 py-2 text-sm font-bold text-cyan-100 shadow-[0_0_22px_rgba(6,182,212,0.16)] transition hover:bg-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400/45"
          >
            <LogIn className="h-4 w-4" />
            Login
          </Link>
        </header>

        <section className="flex flex-1 items-center py-10 lg:py-14">
          <div className="w-full">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-normal text-cyan-300/80">
              <Sparkles className="h-4 w-4" />
              Dealership performance hub
            </p>

            <h1 className="mb-0 mt-5 max-w-4xl text-4xl font-bold leading-tight tracking-normal text-cyan-100 sm:text-5xl lg:text-6xl">
              ChampionsClub
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
              A focused workspace for dealership teams to understand performance, support the
              right people at the right time, and turn progress into recognition.
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {focusAreas.map((area) => {
                const Icon = area.icon;

                return (
                  <article
                    key={area.title}
                    className="rounded-xl border p-4"
                    style={{
                      borderColor: "var(--panel-border)",
                      background: "var(--panel-soft-bg)",
                    }}
                  >
                    <Icon className={`h-5 w-5 ${area.accent}`} />
                    <h2 className="mt-4 text-base font-semibold tracking-normal text-cyan-100">
                      {area.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{area.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
