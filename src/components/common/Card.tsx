import React from 'react';

interface CardProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  id,
  className = '',
  onClick,
  hoverable = false,
}) => {
  return (
    <div
      id={id}
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200 shadow-2xs ${
        hoverable ? 'hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  id?: string;
}> = ({ title, subtitle, action, className = '', id }) => (
  <div
    id={id}
    className={`px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-4 ${className}`}
  >
    <div>
      <h3 className="text-sm font-bold text-slate-900 leading-snug tracking-tight">{title}</h3>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5 leading-normal">{subtitle}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export const CardContent: React.FC<{
  children: React.ReactNode;
  className?: string;
  id?: string;
}> = ({ children, className = '', id }) => (
  <div id={id} className={`p-5 ${className}`}>
    {children}
  </div>
);

export const CardFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
  id?: string;
}> = ({ children, className = '', id }) => (
  <div
    id={id}
    className={`px-5 py-3.5 bg-slate-50/60 border-t border-slate-100 rounded-b-xl flex items-center justify-between gap-3 ${className}`}
  >
    {children}
  </div>
);
