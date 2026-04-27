import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type React from "react";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    form?: string;
  }>({});

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();

    const nextErrors: {
      email?: string;
      password?: string;
    } = {};

    if (!email.trim()) {
      nextErrors.email = "Email is required.";
    }

    if (!password.trim()) {
      nextErrors.password = "Password is required.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail === "manager") {
      navigate("/dashboard");
      return;
    }

    if (normalizedEmail === "advisor") {
      navigate("/advisor-dashboard");
      return;
    }

    setErrors({
      form: "Invalid email. Use manager or advisor to access the mock views.",
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="m-0 text-3xl font-bold text-slate-900">ChampionsClub</h1>
        <p className="mt-2 text-slate-600">
          Sign in as a manager or sales advisor to access the platform.
        </p>
        <p className="mt-3 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
          Mock access: <strong>manager</strong> for the manager dashboard or <strong>advisor</strong> for the sales advisor view. Any non-empty password is accepted.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
          <div className="space-y-2">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-slate-700"
            >
              Email address
            </label>
            <input
              id="username"
              name="email"
              type="text"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setErrors((currentErrors) => ({
                  ...currentErrors,
                  email: undefined,
                  form: undefined,
                }));
              }}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
              autoComplete="email"
            />
            {errors.email ? (
              <p id="email-error" className="text-sm text-red-600">
                {errors.email}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setErrors((currentErrors) => ({
                  ...currentErrors,
                  password: undefined,
                  form: undefined,
                }));
              }}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
              autoComplete="current-password"
            />
            {errors.password ? (
              <p id="password-error" className="text-sm text-red-600">
                {errors.password}
              </p>
            ) : null}
          </div>

          {errors.form ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errors.form}
            </p>
          ) : null}

          <button
            type="submit"
            className="w-full rounded-xl bg-slate-900 px-[clamp(1rem,1.6vw,1.5rem)] py-[clamp(0.75rem,1vw,1.1rem)] text-[clamp(0.95rem,1vw,1.08rem)] font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}