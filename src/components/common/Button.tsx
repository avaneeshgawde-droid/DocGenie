import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700/30 focus-visible:ring-offset-1 disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap cursor-pointer select-none';

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5 rounded-md leading-none font-medium',
    md: 'text-xs px-3.5 py-2 gap-2 rounded-md leading-normal font-semibold',
    lg: 'text-sm px-4 py-2.5 gap-2 rounded-md leading-normal font-semibold',
  };

  const variantClasses = {
    primary:
      'bg-teal-700 text-white hover:bg-teal-800 active:bg-teal-900 border border-teal-800 shadow-xs',
    secondary:
      'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 border border-slate-900 shadow-xs',
    outline:
      'border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 shadow-xs',
    danger:
      'bg-rose-700 text-white hover:bg-rose-800 active:bg-rose-900 border border-rose-800 shadow-xs',
    ghost:
      'text-slate-600 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 border border-transparent',
  };

  return (
    <button
      className={`${base} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
