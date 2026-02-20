import React from 'react';

interface ButtonProps {
    onClick: () => void;
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger' | 'outline';
    disabled?: boolean;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
    onClick,
    children,
    variant = 'primary',
    disabled = false,
    className = '',
    size = 'md'
}) => {
    const baseStyle = "font-semibold rounded-lg shadow-sm transition-all duration-200 flex items-center justify-center active:scale-95";

    const variants = {
        primary: "bg-brand-primary text-white hover:bg-green-800 disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none",
        secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400",
        danger: "bg-red-500 text-white hover:bg-red-600",
        outline: "border-2 border-brand-primary text-brand-primary hover:bg-brand-primary/10"
    };

    const sizes = {
        sm: "px-2 py-1 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base"
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
        >
            {children}
        </button>
    );
};
