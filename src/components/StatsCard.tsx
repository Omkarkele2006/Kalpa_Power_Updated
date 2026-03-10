import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  variant?: 'default' | 'approved' | 'pending' | 'rejected' | 'wip';
}

const variantStyles: Record<string, string> = {
  default: 'border-border',
  approved: 'border-status-approved/30 bg-status-approved-bg',
  pending: 'border-status-pending/30 bg-status-pending-bg',
  rejected: 'border-status-rejected/30 bg-status-rejected-bg',
  wip: 'border-status-wip/30 bg-status-wip-bg',
};

const iconStyles: Record<string, string> = {
  default: 'text-muted-foreground',
  approved: 'text-status-approved',
  pending: 'text-status-pending',
  rejected: 'text-status-rejected',
  wip: 'text-status-wip',
};

export function StatsCard({ title, value, icon: Icon, trend, variant = 'default' }: StatsCardProps) {
  return (
    <div className={cn('rounded-lg border bg-card p-5 animate-fade-in transition-all hover:shadow-md', variantStyles[variant])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
          {trend && <p className="mt-1 text-xs text-muted-foreground">{trend}</p>}
        </div>
        <div className={cn('rounded-lg p-2', variant === 'default' ? 'bg-muted' : '')}>
          <Icon className={cn('h-5 w-5', iconStyles[variant])} />
        </div>
      </div>
    </div>
  );
}
