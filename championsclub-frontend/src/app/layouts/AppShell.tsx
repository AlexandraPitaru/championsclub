import type { ReactNode } from "react";
import Sidebar from "../../components/layout/Sidebar";
import Topbar  from "../../components/layout/Topbar";

type AppShellProps = {
    children: ReactNode;
    showTopbar?: boolean;
};

export default function AppShell({ children, showTopbar = false }: AppShellProps) {
    return (
        <div
            className="min-h-screen text-[var(--text)]"
            style={{
                backgroundColor: "var(--bg)",
                backgroundImage: "var(--app-shell-gradient)",
            }}
        >
            <div className="flex min-h-screen">
                <Sidebar />
                <div className="flex  min-w-0 flex-1 flex-col">
                    {showTopbar ? <Topbar /> : null}
                    <main className="flex-1 p-4 md:p-6">
                        <div className="mx-auto w-full max-w-7xl">{children}</div>
                    </main>
                </div>
            </div>
        </div>
    );

}