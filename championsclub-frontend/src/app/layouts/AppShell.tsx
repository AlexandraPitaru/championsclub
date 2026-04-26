import type { ReactNode } from "react";
import Sidebar from "../../components/layout/Sidebar";
import Topbar  from "../../components/layout/Topbar";

type AppShellProps = {
    children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
    return (
        <div className=" min-h-screen bg-slate-100 text-slate-900">
            <div className="flex min-h-screen">
                <Sidebar />
                <div className="flex  min-w-0 flex-1 flex-col">
                    <Topbar />
                    <main className="flex-1 p-4 md:p-6">
                        <div className="mx-auto w-full max-w-7xl">{children}</div>
                    </main>
                </div>
            </div>
        </div>
    );

}