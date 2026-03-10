import { DrawingStatus } from '@/data/mockData';
import { cn } from '@/lib/utils';

const statusConfig: Record<DrawingStatus, { label: string; className: string }> = {
  'working': { label: 'Working', className: 'status-wip' },
  'under-review': { label: 'Under Review', className: 'status-review' },
  'pending-dept-head': { label: 'Pending Dept Head', className: 'status-pending' },
  'approved': { label: 'Approved', className: 'status-approved' },
  'rejected': { label: 'Revision Required', className: 'status-rejected' },
};

export function StatusBadge({ status, className }: { status: DrawingStatus; className?: string }) {
  const config = statusConfig[status];
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', config.className, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', {
        'bg-status-wip': status === 'working',
        'bg-status-review': status === 'under-review',
        'bg-status-pending': status === 'pending-dept-head',
        'bg-status-approved': status === 'approved',
        'bg-status-rejected': status === 'rejected',
      })} />
      {config.label}
    </span>
  );
}
