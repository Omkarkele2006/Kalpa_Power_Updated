import { mockDrawings } from '@/data/mockData';
import { DashboardHeader } from '@/components/DashboardHeader';
import { StatsCard } from '@/components/StatsCard';
import { DrawingTable } from '@/components/DrawingTable';
import { FileText, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

export default function DesignerDashboard() {
  const myDrawings = mockDrawings.filter(d => d.designer === 'Ahmed Khan');
  const wip = myDrawings.filter(d => d.status === 'working');
  const review = myDrawings.filter(d => d.status === 'under-review' || d.status === 'pending-dept-head');
  const approved = myDrawings.filter(d => d.status === 'approved');
  const rejected = mockDrawings.filter(d => d.status === 'rejected');

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader title="Designer Dashboard" subtitle="Ahmed Khan • Senior CAD Designer" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Work in Progress" value={wip.length} icon={FileText} variant="wip" />
          <StatsCard title="Under Review" value={review.length} icon={Clock} variant="pending" />
          <StatsCard title="Approved" value={approved.length} icon={CheckCircle} variant="approved" />
          <StatsCard title="Needs Revision" value={rejected.length} icon={AlertTriangle} variant="rejected" />
        </div>

        {rejected.length > 0 && (
          <div className="rounded-lg border border-status-rejected/30 bg-status-rejected-bg p-4 animate-fade-in">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-status-rejected">
              <AlertTriangle className="h-4 w-4" /> Rejection Feedback
            </h3>
            {rejected.map(d => (
              <div key={d.id} className="mt-2 rounded-md bg-card p-3 text-sm">
                <span className="font-mono font-medium">{d.drawingNo}</span> — {d.rejectionComment}
              </div>
            ))}
          </div>
        )}

        <div>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">My Drawings</h2>
          <DrawingTable drawings={myDrawings} showDesigner={false} />
        </div>
      </div>
    </div>
  );
}
