import type { ReactNode } from "react";

type CardProps = {
    children: ReactNode;
    className?: string;
};

export default function Card({ children, className = "" }: CardProps) {
    return (
        <div className={`rounded-2xl border border-[#1f3045] bg-[#0b1524]/90 p-5 shadow-[0_12px_30px_rgba(2,8,20,0.35)] backdrop-blur ${className}`}>
            {children}
        </div>
    );
}