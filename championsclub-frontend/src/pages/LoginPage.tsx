import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type React from "react";
import { Gift, Sparkles, Trophy, UsersRound } from "lucide-react";
import { loginUser } from "../services/api/authService";

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

export default function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Email and password are required.");
      return;
    }

    try {
      setIsLoading(true);

      const user = await loginUser({
        email,
        password,
      });

      localStorage.setItem("currentUser", JSON.stringify(user));

      const role = user.role.toLowerCase();

      if (role === "manager") {
        navigate("/dashboard");
        return;
      }

      if (role === "sales_advisor") {
        navigate("/advisor-dashboard");
        return;
      }

      setErrorMessage("Unknown user role.");
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Network error. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className="relative flex min-h-screen overflow-hidden text-[var(--text)]"
      style={{
        backgroundColor: "var(--bg)",
        backgroundImage: "var(--app-shell-gradient)",
      }}
    >
      <div className="pointer-events-none absolute right-[-120px] top-[-80px] h-[340px] w-[340px] rounded-full border border-cyan-400/20 bg-cyan-400/5 blur-2xl" />
      <div className="pointer-events-none absolute bottom-[-120px] left-[-100px] h-[300px] w-[300px] rounded-full border border-sky-400/20 bg-sky-400/5 blur-2xl" />

      <div className="relative z-10 flex w-full flex-col items-center justify-center gap-8 px-6 py-8 lg:flex-row lg:gap-12 lg:px-12">
        {/* Left side - Information */}
        <div className="w-full max-w-2xl lg:w-auto lg:flex-1">
          <div className="mb-6 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 backdrop-blur-sm border border-cyan-400/30">
              <Sparkles className="h-5 w-5 text-cyan-400" />
            </div>
            <span className="text-sm font-semibold text-cyan-300/90">
              Dealership Performance Hub
            </span>
          </div>

          <h1 className="mb-3 text-4xl font-bold leading-tight tracking-tight text-cyan-100 lg:text-5xl">
            ChampionsClub
          </h1>

          <p className="mb-8 text-base leading-relaxed text-slate-300 lg:text-lg">
            A focused workspace for dealership teams to understand performance, support the
            right people at the right time, and turn progress into recognition.
          </p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {focusAreas.map((area) => {
              const Icon = area.icon;

              return (
                <article
                  key={area.title}
                  className="group rounded-lg border p-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                  style={{
                    borderColor: "var(--panel-border)",
                    background: "var(--panel-soft-bg)",
                  }}
                >
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800/50">
                    <Icon className={`h-5 w-5 ${area.accent}`} />
                  </div>
                  <h2 className="mb-2 text-sm font-semibold text-cyan-100">
                    {area.title}
                  </h2>
                  <p className="text-xs leading-relaxed text-slate-400">{area.description}</p>
                </article>
              );
            })}
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="w-full max-w-md lg:w-auto lg:flex-shrink-0">
          <form
            onSubmit={handleLogin}
            className="rounded-2xl border p-8 backdrop-blur-sm shadow-2xl"
            style={{
              borderColor: "var(--card-border)",
              background: "var(--card-bg)",
              boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.3), 0 8px 10px -6px rgb(0 0 0 / 0.3)",
            }}
          >
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300/80">
                Secure Access
              </p>

              <h1 className="mt-2 text-3xl font-bold text-cyan-100">Sign In</h1>

              <p className="mt-1 text-sm text-slate-300">
                Access your performance dashboard
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-200">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  disabled={isLoading}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/20"
                  style={{
                    borderColor: "var(--panel-border-strong)",
                    background: "var(--panel-input-bg)",
                  }}
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-200">
                  Password
                </label>

                <input
                  type="password"
                  value={password}
                  disabled={isLoading}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/20"
                  style={{
                    borderColor: "var(--panel-border-strong)",
                    background: "var(--panel-input-bg)",
                  }}
                  placeholder="Enter your password"
                />
              </div>

              {errorMessage && (
                <div className="rounded-lg border border-rose-400/35 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-300">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg border border-cyan-400/40 bg-cyan-500/15 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/25 hover:border-cyan-400/60 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? "Signing in..." : "Login"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}