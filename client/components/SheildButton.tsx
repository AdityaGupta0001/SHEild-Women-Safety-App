
import React from 'react';
import { cn } from '@/lib/utils';

interface SheildButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const SheildButton: React.FC<SheildButtonProps> = ({
  variant = 'primary',
  fullWidth = false,
  size = 'md',
  children,
  className,
  ...props
}) => {
  const variantClasses = {
    primary: 'bg-sheild-lightpurple hover:bg-sheild-purple text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
  };

  const sizeClasses = {
    sm: 'text-sm py-1.5 px-3',
    md: 'py-2.5 px-5',
    lg: 'text-lg py-3.5 px-7',
  };

  return (
    <button
      className={cn(
        'rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sheild-purple disabled:opacity-50 active:scale-95 shadow-md',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default SheildButton;
