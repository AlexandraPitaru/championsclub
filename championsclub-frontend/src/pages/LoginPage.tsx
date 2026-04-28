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
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <h1 className="text-3xl font-bold text-slate-900">ChampionsClub</h1>

        <p className="mt-2 text-slate-600">
          Sign in to access your performance dashboard.
        </p>

        <div className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </label>

            <input
              type="email"
              value={email}
              disabled={isLoading}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>

            <input
              type="password"
              value={password}
              disabled={isLoading}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
              placeholder="Enter your password"
            />
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Signing in..." : "Login"}
          </button>
        </div>
      </form>
    </div>
  );
}