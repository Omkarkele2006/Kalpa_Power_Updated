import { useDrawings } from '@/hooks/useDrawings';
import { useAuth } from '@/hooks/useAuth';
import { DashboardHeader } from '@/components/DashboardHeader';
import { StatsCard } from '@/components/StatsCard';
import { UploadDrawingDialog } from '@/components/UploadDrawingDialog';
import { FileText, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { useDrawingComments } from '@/hooks/useDrawings';

export default function DesignerDashboard() {
  const { user, profile } = useAuth();
  const { data: allDrawings = [] } = useDrawings();
  const myDrawings = allDrawings.filter(d => d.designer_id === user?.id);
  const wip = myDrawings.filter(d => d.status === 'working');
  const review = myDrawings.filter(d => d.status === 'under-review' || d.status === 'pending-dept-head');
  const approved = myDrawings.filter(d => d.status === 'approved');
  const rejected = myDrawings.filter(d => d.status === 'rejected');

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader title="Designer Dashboard" subtitle={`${profile?.full_name ?? ''} • ${profile?.title ?? 'Designer'}`} />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
            <StatsCard title="Work in Progress" value={wip.length} icon={FileText} variant="wip" />
            <StatsCard title="Under Review" value={review.length} icon={Clock} variant="pending" />
            <StatsCard title="Approved" value={approved.length} icon={CheckCircle} variant="approved" />
            <StatsCard title="Needs Revision" value={rejected.length} icon={AlertTriangle} variant="rejected" />
          </div>
          <div className="ml-4">
            <UploadDrawingDialog />
          </div>
        </div>

        {rejected.length > 0 && <RejectionFeedback drawings={rejected} />}

        {/* <div>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">My Drawings</h2>
          {isLoading ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Loading...</p>
          ) : (
            <DrawingTable
              drawings={myDrawings}
              showDesigner={false}
              renderActions={(d) => d.status === 'working' ? (
                <SubmitForReviewButton drawingId={d.id} drawingNo={d.drawing_no} />
              ) : null}
            />
          )}
        </div> */}
      </div>
    </div>
  );
}

function RejectionFeedback({ drawings }: { drawings: any[] }) {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 animate-fade-in">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-destructive">
        <AlertTriangle className="h-4 w-4" /> Rejection Feedback
      </h3>
      {drawings.map(d => (
        <RejectionItem key={d.id} drawingId={d.id} drawingNo={d.drawing_no} />
      ))}
    </div>
  );
}

function RejectionItem({ drawingId, drawingNo }: { drawingId: string; drawingNo: string }) {
  const { data: comments = [] } = useDrawingComments(drawingId);
  const rejections = comments.filter((c: any) => c.action === 'reject');

  return (
    <div className="mt-2 rounded-md bg-card p-3 text-sm">
      <span className="font-mono font-medium">{drawingNo}</span>
      {rejections.length > 0 ? (
        rejections.map((c: any) => (
          <p key={c.id} className="text-muted-foreground mt-1">— {c.comment} <span className="text-xs">({(c as any).profiles?.full_name})</span></p>
        ))
      ) : (
        <p className="text-muted-foreground mt-1">— Rejected (no comments)</p>
      )}
    </div>
  );
}
