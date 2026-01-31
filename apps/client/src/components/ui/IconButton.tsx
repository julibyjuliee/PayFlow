import type { ButtonHTMLAttributes } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    icon: string;
    variant?: 'primary' | 'secondary';
    size?: 'sm' | 'md' | 'lg';
    badge?: number;
}

export const IconButton = ({
    icon,
    variant = 'primary',
    size = 'md',
    badge,
    className = '',
    ...props
}: IconButtonProps) => {
    const variants = {
        primary: 'bg-sunset-orange text-white shadow-lg shadow-sunset-orange/30',
        secondary: 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    };

    const sizes = {
        sm: 'size-8 text-lg',
        md: 'size-11 text-xl',
        lg: 'size-14 text-2xl',
    };

    return (
        <button
            className={`relative rounded-full flex items-center justify-center active:scale-90 transition-transform z-10 ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            <span className="material-symbols-outlined">{icon}</span>
            {badge !== undefined && badge > 0 && (
                <span className="absolute -top-1 -right-2 size-4 bg-terracotta text-white text-[9px] flex items-center justify-center rounded-full font-bold">
                    {badge}
                </span>
            )}
        </button>
    );
};
