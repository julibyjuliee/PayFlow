import type { ReactNode } from 'react';

interface FormInputProps {
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => void;
    error?: string;
    placeholder?: string;
    type?: string;
    maxLength?: number;
    className?: string;
    icon?: ReactNode;
    hint?: string;
}

/**
 * Reusable form input component
 * Follows Single Responsibility Principle by handling only input rendering
 * Follows Open/Closed Principle by being open for extension (props) but closed for modification
 */
export const FormInput = ({
    label,
    name,
    value,
    onChange,
    onBlur,
    error,
    placeholder,
    type = 'text',
    maxLength,
    className = '',
    icon,
    hint,
}: FormInputProps) => {
    return (
        <div className={className}>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                {label}
            </label>
            <div className="relative">
                <input
                    name={name}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    className={`w-full px-4 py-3 ${icon ? 'pr-20' : ''} rounded-xl border ${
                        error ? 'border-red-500' : 'border-orange-100'
                    } bg-white focus:ring-1 focus:ring-terracotta transition-all`}
                    placeholder={placeholder}
                    type={type}
                    maxLength={maxLength}
                />
                {icon && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        {icon}
                    </div>
                )}
            </div>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            {hint && !error && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
        </div>
    );
};
