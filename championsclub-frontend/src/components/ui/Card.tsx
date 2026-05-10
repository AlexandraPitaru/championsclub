import type { ReactNode, HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
    children: ReactNode;
    className?: string;
};

export default function Card({ children, className = "", style, ...rest }: CardProps) {
    return (
        <div
            className={`rounded-2xl border p-5 backdrop-blur ${className}`}
            style={{
                borderColor: "var(--card-border)",
                background: "var(--card-bg)",
                boxShadow: "var(--card-shadow)",
                ...style,
            }}
            {...rest}
        >
            {children}
        </div>
    );
}