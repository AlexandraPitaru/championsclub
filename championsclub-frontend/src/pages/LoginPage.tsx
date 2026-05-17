import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type React from "react";
import { Gift, LockKeyhole, Mail, Shield, Sparkles, Trophy, UsersRound } from "lucide-react";
import LoginRaceHero from "../components/login/LoginRaceHero";
import { loginPageStyles } from "../components/login/loginPageStyles";
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
    <>
      <style>{loginPageStyles}</style>

      <div className="login-page-shell">
        <div className="pointer-events-none absolute right-[-120px] top-[-80px] h-[340px] w-[340px] rounded-full border border-cyan-400/20 bg-cyan-400/5 blur-2xl" />
        <div className="pointer-events-none absolute bottom-[-120px] left-[-100px] h-[300px] w-[300px] rounded-full border border-sky-400/20 bg-sky-400/5 blur-2xl" />

        <div className="login-page-layout">
          {/* Left side - Information */}
          <div className="login-page-left">
            <div className="login-page-brand">
              <div className="login-page-brand-badge">
                <Sparkles className="h-5 w-5 text-cyan-400" />
              </div>
              <span className="login-page-brand-text">
                Dealership Performance Hub
              </span>
            </div>

            <LoginRaceHero />

            <p className="login-page-intro">
              A focused workspace for dealership teams to understand performance, support the
              right people at the right time, and turn progress into recognition.
            </p>

            <div className="login-page-cards">
              {focusAreas.map((area) => {
                const Icon = area.icon;

                return (
                  <article key={area.title} className="login-page-card">
                    <div className="login-page-card-icon">
                      <Icon className={`h-5 w-5 ${area.accent}`} />
                    </div>
                    <h2 className="login-page-card-title">{area.title}</h2>
                    <p className="login-page-card-copy">{area.description}</p>
                  </article>
                );
              })}
            </div>
          </div>

          {/* Right side - Login Form */}
          <div className="login-form-wrap">
            <form onSubmit={handleLogin} className="login-form-card">
              <div className="mb-7">
                <div className="login-form-header-icon" aria-hidden="true">
                  <Shield className="h-7 w-7 text-cyan-400" strokeWidth={2.1} />
                </div>

                <p className="login-form-kicker">Secure Access</p>

                <h1 className="login-form-title">Sign In</h1>

                <p className="login-form-copy">Access your performance dashboard</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="login-form-label">Email</label>

                  <div className="login-form-field">
                    <Mail className="login-form-field-icon h-4 w-4" strokeWidth={2} />
                    <input
                      type="email"
                      value={email}
                      disabled={isLoading}
                      onChange={(event) => setEmail(event.target.value)}
                      className="login-form-input"
                      placeholder="name@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="login-form-label">Password</label>

                  <div className="login-form-field">
                    <LockKeyhole className="login-form-field-icon h-4 w-4" strokeWidth={2} />
                    <input
                      type="password"
                      value={password}
                      disabled={isLoading}
                      onChange={(event) => setPassword(event.target.value)}
                      className="login-form-input"
                      placeholder="Enter your password"
                    />
                  </div>
                  <span className="login-form-forgot">Forgot password?</span>
                </div>

                {errorMessage && (
                  <div className="rounded-lg border border-rose-400/35 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-300">
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="login-form-button"
                >
                  {isLoading ? "Signing in..." : "Login"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
