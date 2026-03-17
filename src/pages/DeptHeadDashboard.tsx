import { useState } from 'react';
import { useDrawings } from '@/hooks/useDrawings';
import { useAuth } from '@/hooks/useAuth';
import { DashboardHeader } from '@/components/DashboardHeader';
import { StatsCard } from '@/components/StatsCard';
import { DrawingTable } from '@/components/DrawingTable';
import { RejectDialog } from '@/components/RejectDialog';
import { CheckCircle, Clock, XCircle, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';

export default function DeptHeadDashboard() {
  const { profile, user } = useAuth();
  const { data: allDrawings = [] } = useDrawings();
  const queryClient = useQueryClient();

  const pending = allDrawings.filter(d => d.status === 'pending-dept-head');
  const approved = allDrawings.filter(d => d.status === 'approved');
  const rejected = allDrawings.filter(d => d.status === 'rejected');
  const total = allDrawings.length;
  const approvalRate = total > 0 ? Math.round((approved.length / total) * 100) : 0;

  const [rejectDrawing, setRejectDrawing] = useState<{ id: string; no: string } | null>(null);

  const handleApprove = async (id: string) => {
    const { error } = await supabase.from('drawings').update({
      status: 'approved' as any,
      approved_by: user?.id,
      approved_date: new Date().toISOString(),
      stamp_applied: true,
    }).eq('id', id);
    if (error) { toast.error(error.message); return; }

    if (user) {
      await supabase.from('drawing_comments').insert({
        drawing_id: id, author_id: user.id,
        comment: 'Approved by Dept Head — stamp applied',
        action: 'approve',
      });
    }
    toast.success('Drawing approved — PDF stamp applied and moved to Approved Folder');
    queryClient.invalidateQueries({ queryKey: ['drawings'] });
  };

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader title="Dept Head Dashboard" subtitle={`${profile?.full_name ?? ''} • Final Approval Authority`} />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Awaiting Approval" value={pending.length} icon={Clock} variant="pending" />
          <StatsCard title="Approved" value={approved.length} icon={CheckCircle} variant="approved" />
          <StatsCard title="Rejected" value={rejected.length} icon={XCircle} variant="rejected" />
          <StatsCard title="Approval Rate" value={`${approvalRate}%`} icon={BarChart3} trend={`${approved.length} of ${total} drawings`} />
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Pending My Approval</h2>
          <DrawingTable
            drawings={pending}
            showAging
            renderActions={(d) => (
              <div className="flex gap-2 justify-end">
                <Button size="sm" className="bg-[hsl(var(--status-approved))] hover:bg-[hsl(var(--status-approved))]/90 text-primary-foreground" onClick={() => handleApprove(d.id)}>Approve</Button>
                <Button size="sm" variant="destructive" onClick={() => setRejectDrawing({ id: d.id, no: d.drawing_no })}>Reject</Button>
              </div>
            )}
          />
        </div>
      </div>

      {rejectDrawing && (
        <RejectDialog
          open={!!rejectDrawing}
          onOpenChange={() => setRejectDrawing(null)}
          drawingId={rejectDrawing.id}
          drawingNo={rejectDrawing.no}
          revertStatus="working"
        />
      )}
    </div>
  );
}
