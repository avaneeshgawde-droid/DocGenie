import React from 'react';
import { TriagePriority, CaseStatus } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'urgent' | 'immediate' | 'routine' | 'success' | 'warning' | 'info' | 'purple';
  size?: 'sm' | 'md';
  id?: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  id,
  className = '',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  const variantClasses: Record<string, string> = {
    default: 'bg-slate-100 text-slate-800 border border-slate-200',
    routine: 'bg-teal-50 text-teal-800 border border-teal-200',
    urgent: 'bg-amber-50 text-amber-800 border border-amber-300',
    immediate: 'bg-rose-50 text-rose-800 border border-rose-300 animate-pulse',
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200',
    info: 'bg-sky-50 text-sky-800 border border-sky-200',
    purple: 'bg-indigo-50 text-indigo-800 border border-indigo-200',
  };

  return (
    <span
      id={id}
      className={`inline-flex items-center gap-1 rounded-md font-medium whitespace-nowrap ${sizeClasses} ${
        variantClasses[variant] || variantClasses.default
      } ${className}`}
    >
      {children}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: TriagePriority; id?: string }> = ({
  priority,
  id,
}) => {
  switch (priority) {
    case 'immediate':
      return (
        <Badge id={id} variant="immediate">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
          Immediate Attention
        </Badge>
      );
    case 'urgent':
      return (
        <Badge id={id} variant="urgent">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
          Urgent Triage
        </Badge>
      );
    case 'routine':
    default:
      return (
        <Badge id={id} variant="routine">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-600"></span>
          Routine OPD
        </Badge>
      );
  }
};

export const StatusBadge: React.FC<{ status: CaseStatus; id?: string }> = ({ status, id }) => {
  switch (status) {
    case 'verified':
      return (
        <Badge id={id} variant="success">
          Verified by Doctor
        </Badge>
      );
    case 'doctor_review':
      return (
        <Badge id={id} variant="purple">
          Ready for Review
        </Badge>
      );
    case 'intake_completed':
      return (
        <Badge id={id} variant="info">
          Intake Completed
        </Badge>
      );
    case 'intake_pending':
    default:
      return (
        <Badge id={id} variant="default">
          Intake Pending
        </Badge>
      );
  }
};
