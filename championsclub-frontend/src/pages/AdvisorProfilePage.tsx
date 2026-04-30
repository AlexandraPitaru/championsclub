import { useParams } from "react-router-dom";
import AppShell from "../app/layouts/AppShell";

export default function AdvisorProfilePage() {
  const { id } = useParams();

  return (
    <AppShell>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-cyan-100">Advisor Profile</h1>
        <p className="text-slate-400">Advisor ID: {id}</p>
      </div>
    </AppShell>
  );
}