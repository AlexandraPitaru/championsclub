import AppShell from "../app/layouts/AppShell";
import Card from "../components/ui/Card";

export default function ProfilePage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <section>
          <h1 className="text-3xl font-bold text-cyan-100">Profile</h1>
          <p className="mt-2 text-slate-400">Profile page is under construction.</p>
        </section>

        <Card style={{ borderColor: "var(--panel-border)", background: "var(--panel-bg)" }}>
          <p className="text-sm text-slate-300">User profile details will appear here.</p>
        </Card>
      </div>
    </AppShell>
  );
}
