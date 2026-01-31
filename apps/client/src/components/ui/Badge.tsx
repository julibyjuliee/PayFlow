import type { ReactNode } from "react";

interface BadgeProps {
    children: ReactNode;
    variant?: "default" | "animated";
    className?: string;
}

export const Badge = ({
    children,
    variant = "default",
    className = "",
}: BadgeProps) => {
    return (
        <div
            className={`px-2 py-1 bg-white/95 backdrop-blur rounded-lg text-[9px] font-bold text-sunset-gold flex items-center gap-1 border border-sunset-gold/10 ${className}`}
        >
            <span
                className={`size-1.5 rounded-full bg-sunset-gold ${variant === "animated" ? "animate-pulse" : ""
                    }`}
            />
            {children}
        </div>
    );
};
