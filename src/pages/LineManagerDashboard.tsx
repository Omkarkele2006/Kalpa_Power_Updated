import { mockDrawings, getAgingDays } from '@/data/mockData';
import { DashboardHeader } from '@/components/DashboardHeader';
import { StatsCard } from '@/components/StatsCard';
import { DrawingTable } from '@/components/DrawingTable';
import { Inbox, Clock, Users, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function LineManagerDashboard() {
  const queue = mockDrawings.filter(d => d.status === 'under-review');
  const pendingDH = mockDrawings.filter(d => d.status === 'pending-dept-head');
  const overdue = queue.filter(d => d.reviewStarted && getAgingDays(d.reviewStarted) > 2);

  const designers = [...new Set(mockDrawings.map(d => d.designer))];
  const workload = designers.map(name => ({
    name,
    count: mockDrawings.filter(d => d.designer === name && d.status !== 'approved').length,
  }));

  const handleApprove = (id: string) => {
    toast.success(`Drawing forwarded to Dept Head for final approval`);
  };
  const handleReject = (id: string) => {
    toast.error(`Drawing returned to Designer with comments`);
  };

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader title="Line Manager Dashboard" subtitle="Eng. Khalid Bin Saeed • Technical Review" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="In My Queue" value={queue.length} icon={Inbox} variant="wip" />
          <StatsCard title="Pending Dept Head" value={pendingDH.length} icon={Clock} variant="pending" />
          <StatsCard title="Overdue (>48h)" value={overdue.length} icon={AlertTriangle} variant="rejected" />
          <StatsCard title="Active Designers" value={designers.length} icon={Users} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {workload.map(w => (
            <div key={w.name} className="rounded-lg border bg-card p-4 animate-fade-in">
              <p className="text-sm font-medium">{w.name}</p>
              <p className="text-2xl font-bold mt-1">{w.count}</p>
              <p className="text-xs text-muted-foreground">active drawings</p>
            </div>
          ))}
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Review Queue</h2>
          <DrawingTable drawings={queue} showAging onApprove={handleApprove} onReject={handleReject} showActions />
        </div>
      </div>
    </div>
  );
}
