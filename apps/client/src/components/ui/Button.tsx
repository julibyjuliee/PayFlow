import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "ghost";
    size?: "sm" | "md" | "lg";
    children: ReactNode;
    icon?: string;
    fullWidth?: boolean;
}

export const Button = ({
    variant = "primary",
    size = "md",
    children,
    icon,
    fullWidth = false,
    className = "",
    ...props
}: ButtonProps) => {
    const baseStyles =
        "inline-flex items-center justify-center gap-1.5 font-bold rounded-full transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-sunset-orange text-white shadow-sm hover:bg-sunset-orange/90",
        secondary:
            "bg-sunset-peach text-terracotta hover:bg-sunset-peach/80",
        ghost:
            "text-slate-600 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-slate-800",
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base",
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""
                } ${className}`}
            {...props}
        >
            {icon && <span className="material-symbols-outlined text-base">{icon}</span>}
            {children}
        </button>
    );
};
