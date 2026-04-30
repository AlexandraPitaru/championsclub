import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type React from "react";
import { loginUser } from "../services/api/authService";

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
        navigate(`/advisor/${user.user_id}`);
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#060b13] px-6">
      <div className="pointer-events-none absolute inset-0 [background-image:radial-gradient(circle_at_15%_15%,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_85%_10%,rgba(56,189,248,0.14),transparent_30%),linear-gradient(to_bottom,rgba(6,11,19,0.85),rgba(6,11,19,1))]" />

      <div className="pointer-events-none absolute right-[-120px] top-[-80px] h-[340px] w-[340px] rounded-full border border-cyan-400/20 bg-cyan-400/5 blur-2xl" />
      <div className="pointer-events-none absolute bottom-[-120px] left-[-100px] h-[300px] w-[300px] rounded-full border border-sky-400/20 bg-sky-400/5 blur-2xl" />

      <form
        onSubmit={handleLogin}
        className="relative z-10 w-full max-w-md rounded-2xl border border-[#24405b] bg-[#0b1524]/90 p-8 shadow-[0_20px_50px_rgba(2,8,20,0.55)] backdrop-blur"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
          Secure Access
        </p>

        <h1 className="mt-2 text-3xl font-bold text-cyan-100">ChampionsClub</h1>

        <p className="mt-2 text-slate-300">
          Sign in to access your performance dashboard.
        </p>

        <div className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Email
            </label>

            <input
              type="email"
              value={email}
              disabled={isLoading}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-[#2e4663] bg-[#0f1d31] px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/20"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">
              Password
            </label>

            <input
              type="password"
              value={password}
              disabled={isLoading}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-[#2e4663] bg-[#0f1d31] px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/70 focus:ring-2 focus:ring-cyan-400/20"
              placeholder="Enter your password"
            />
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-rose-400/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-4 py-3 font-semibold text-cyan-100 transition hover:bg-cyan-500/25 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Signing in..." : "Login"}
          </button>
        </div>
      </form>
    </div>
  );
}