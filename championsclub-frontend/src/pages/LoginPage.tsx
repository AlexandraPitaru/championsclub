import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">ChampionsClub</h1>
        <p className="mt-2 text-slate-600">
          AI-powered sales management platform
        </p>

        <div className="mt-8 space-y-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-700"
          >
            Continue as Manager
          </button>

          <button
            onClick={() => navigate("/advisor/101")}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            Continue as Advisor
          </button>
        </div>
      </div>
    </div>
  );
}