import { useState } from 'react';
import { useDrawings } from '@/hooks/useDrawings';
import { useAuth } from '@/hooks/useAuth';
import { DashboardHeader } from '@/components/DashboardHeader';
import { StatsCard } from '@/components/StatsCard';
import { DrawingTable } from '@/components/DrawingTable';
import { RejectDialog } from '@/components/RejectDialog';
import { createNotification } from '@/lib/notifications';
import { Inbox, Clock, Users, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';

export default function LineManagerDashboard() {
  const { profile, user } = useAuth();
  const { data: allDrawings = [] } = useDrawings();
  const queryClient = useQueryClient();

  const queue = allDrawings.filter(d => d.status === 'under-review');
  const pendingDH = allDrawings.filter(d => d.status === 'pending-dept-head');

  const getAgingDays = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };
  const overdue = queue.filter(d => d.review_started && getAgingDays(d.review_started) > 2);

  const [rejectDrawing, setRejectDrawing] = useState<{ id: string; no: string } | null>(null);

  const handleApprove = async (id: string) => {
    const drawing = allDrawings.find(d => d.id === id);

    if (!drawing) return;

    const { error } = await supabase
      .from('drawings')
      .update({
        status: 'pending-dept-head' as any,
      })
      .eq('id', id);

    if (error) {
      toast.error(error.message);
      return;
    }

    // Approval comment
    if (user) {
      await supabase.from('drawing_comments').insert({
        drawing_id: id,
        author_id: user.id,
        comment:
          'Approved by Line Manager — forwarded to Dept Head',
        action: 'approve',
      });
    }

    // Notify designer
    if (drawing.designer_id) {
      await createNotification({
        userId: drawing.designer_id,
        title: 'Line Manager Approved',
        message: `${drawing.drawing_no} approved by Line Manager and forwarded to Dept Head`,
        type: 'approved',
        drawingId: drawing.id,
      });
    }

    // Notify all dept heads
    const { data: deptHeads } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'dept-head');

    if (deptHeads) {
      for (const dh of deptHeads) {
        await createNotification({
          userId: dh.id,
          title: 'Drawing Pending Approval',
          message: `${drawing.drawing_no} is awaiting Dept Head approval`,
          type: 'pending-dept-head',
          drawingId: drawing.id,
        });
      }
    }

    toast.success(
      'Drawing forwarded to Dept Head for final approval'
    );

    queryClient.invalidateQueries({
      queryKey: ['drawings'],
    });
  };

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader title="Line Manager Dashboard" subtitle={`${profile?.full_name ?? ''} • Technical Review`} />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="In My Queue" value={queue.length} icon={Inbox} variant="wip" />
          <StatsCard title="Pending Dept Head" value={pendingDH.length} icon={Clock} variant="pending" />
          <StatsCard title="Overdue (>48h)" value={overdue.length} icon={AlertTriangle} variant="rejected" />
          <StatsCard title="Total Active" value={allDrawings.filter(d => d.status !== 'approved').length} icon={Users} />
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Review Queue</h2>
          <DrawingTable
            drawings={queue}
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
          designerId={
            allDrawings.find(d => d.id === rejectDrawing.id)?.designer_id ?? ''
          }
          drawingId={rejectDrawing.id}
          drawingNo={rejectDrawing.no}
          revertStatus="rejected"
        />
      )}
    </div>
  );
}
