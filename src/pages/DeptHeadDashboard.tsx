import { mockDrawings, mockNotifications } from '@/data/mockData';
import { DashboardHeader } from '@/components/DashboardHeader';
import { StatsCard } from '@/components/StatsCard';
import { DrawingTable } from '@/components/DrawingTable';
import { CheckCircle, Clock, XCircle, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

export default function DeptHeadDashboard() {
  const pending = mockDrawings.filter(d => d.status === 'pending-dept-head');
  const approved = mockDrawings.filter(d => d.status === 'approved');
  const rejected = mockDrawings.filter(d => d.status === 'rejected');
  const total = mockDrawings.length;
  const approvalRate = total > 0 ? Math.round((approved.length / total) * 100) : 0;

  const handleApprove = (id: string) => {
    toast.success('Drawing approved — PDF stamp will be applied and moved to Approved Folder');
  };
  const handleReject = (id: string) => {
    toast.error('Drawing rejected — Designer and Line Manager have been notified');
  };

  const approvalLog = mockNotifications.filter(n => n.type === 'approval' || n.type === 'rejection');

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader title="Dept Head Dashboard" subtitle="Dr. Sara Al-Rashid • Final Approval Authority" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Awaiting Approval" value={pending.length} icon={Clock} variant="pending" />
          <StatsCard title="Approved" value={approved.length} icon={CheckCircle} variant="approved" />
          <StatsCard title="Rejected" value={rejected.length} icon={XCircle} variant="rejected" />
          <StatsCard title="Approval Rate" value={`${approvalRate}%`} icon={BarChart3} trend={`${approved.length} of ${total} drawings`} />
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Pending My Approval</h2>
          <DrawingTable drawings={pending} showActions showAging onApprove={handleApprove} onReject={handleReject} />
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Approval / Rejection Log</h2>
          <div className="rounded-lg border bg-card divide-y">
            {approvalLog.map(n => (
              <div key={n.id} className="flex items-start gap-3 p-3 animate-fade-in">
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${n.type === 'approval' ? 'bg-status-approved' : 'bg-status-rejected'}`} />
                <div>
                  <p className="text-sm">{n.message}</p>
                  <p className="text-xs text-muted-foreground">{new Date(n.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
