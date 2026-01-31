import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    icon?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ icon, className = "", ...props }, ref) => {
        return (
            <div className="relative group flex-1">
                {icon && (
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                        {icon}
                    </span>
                )}
                <input
                    ref={ref}
                    className={`w-full h-10 bg-slate-100 dark:bg-slate-800 border-none rounded-xl ${icon ? "pl-10" : "pl-4"
                        } pr-4 text-sm focus:ring-2 focus:ring-sunset-orange/20 placeholder:text-slate-400 ${className}`}
                    {...props}
                />
            </div>
        );
    }
);

Input.displayName = "Input";
