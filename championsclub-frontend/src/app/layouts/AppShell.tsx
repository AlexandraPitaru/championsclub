import type { ReactNode } from "react";
import Sidebar from "../../components/layout/Sidebar";
import Topbar  from "../../components/layout/Topbar";

type AppShellProps = {
    children: ReactNode;
    showTopbar?: boolean;
};

export default function AppShell({ children, showTopbar = true }: AppShellProps) {
    return (
        <div className="min-h-screen bg-[#060b13] text-slate-100 [background-image:radial-gradient(circle_at_20%_0%,rgba(31,78,121,0.18),transparent_35%),radial-gradient(circle_at_85%_10%,rgba(18,131,177,0.14),transparent_30%)]">
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