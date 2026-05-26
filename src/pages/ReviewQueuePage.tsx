import { useState } from 'react';
import { useDrawings } from '@/hooks/useDrawings';
import { useAuth } from '@/hooks/useAuth';

import { DashboardHeader } from '@/components/DashboardHeader';
import { DrawingTable } from '@/components/DrawingTable';
import { RejectDialog } from '@/components/RejectDialog';

import { createNotification } from '@/lib/notifications';

import {
  Inbox,
  Clock,
  Users,
  AlertTriangle,
} from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';

export default function ReviewQueuePage() {
  const { profile, user } = useAuth();
  const { data: allDrawings = [] } = useDrawings();

  const queryClient = useQueryClient();

  const queue = allDrawings.filter(
    (d) => d.status === 'under-review'
  );

  const pendingDH = allDrawings.filter(
    (d) => d.status === 'pending-dept-head'
  );

  const getAgingDays = (dateStr: string) => {
    const diff =
      Date.now() - new Date(dateStr).getTime();

    return Math.max(
      0,
      Math.floor(diff / (1000 * 60 * 60 * 24))
    );
  };

  const overdue = queue.filter(
    (d) =>
      d.review_started &&
      getAgingDays(d.review_started) > 2
  );

  const [rejectDrawing, setRejectDrawing] =
    useState<{
      id: string;
      no: string;
    } | null>(null);

  const handleApprove = async (id: string) => {
    const drawing = allDrawings.find(
      (d) => d.id === id
    );

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
      await supabase
        .from('drawing_comments')
        .insert({
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

    toast.success(
      'Drawing forwarded to Dept Head for final approval'
    );

    queryClient.invalidateQueries({
      queryKey: ['drawings'],
    });
  };

  return (
    <div className="flex flex-col h-full">

      <DashboardHeader
        title="Review Queue"
        subtitle={`${profile?.full_name ?? ''} • Review and approval operations`}
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                In Review Queue
              </p>

              <Inbox className="h-5 w-5 text-blue-500" />
            </div>

            <h3 className="mt-3 text-3xl font-bold">
              {queue.length}
            </h3>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Pending Dept Head
              </p>

              <Clock className="h-5 w-5 text-yellow-500" />
            </div>

            <h3 className="mt-3 text-3xl font-bold">
              {pendingDH.length}
            </h3>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Overdue (&gt;48h)
              </p>

              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>

            <h3 className="mt-3 text-3xl font-bold">
              {overdue.length}
            </h3>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Total Active
              </p>

              <Users className="h-5 w-5 text-slate-500" />
            </div>

            <h3 className="mt-3 text-3xl font-bold">
              {
                allDrawings.filter(
                  (d) => d.status !== 'approved'
                ).length
              }
            </h3>
          </div>
        </div>

        {/* Review Table */}
        <div className="rounded-xl border bg-card">

          <div className="border-b px-6 py-4">
            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-lg font-semibold">
                  Technical Review Queue
                </h2>

                <p className="text-sm text-muted-foreground mt-1">
                  Review, approve, or reject submitted drawings
                </p>
              </div>

              <div className="text-sm text-muted-foreground">
                Pending Reviews: {queue.length}
              </div>

            </div>
          </div>

          <div className="p-6">

            <DrawingTable
              drawings={queue}
              showAging
              renderActions={(d) => (
                <div className="flex gap-2 justify-end">

                  <Button
                    size="sm"
                    className="bg-[hsl(var(--status-approved))] hover:bg-[hsl(var(--status-approved))]/90 text-primary-foreground"
                    onClick={() => handleApprove(d.id)}
                  >
                    Approve
                  </Button>

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() =>
                      setRejectDrawing({
                        id: d.id,
                        no: d.drawing_no,
                      })
                    }
                  >
                    Reject
                  </Button>

                </div>
              )}
            />

          </div>
        </div>
      </div>

      {rejectDrawing && (
        <RejectDialog
          open={!!rejectDrawing}
          onOpenChange={() =>
            setRejectDrawing(null)
          }
          designerId={
            allDrawings.find(
              (d) => d.id === rejectDrawing.id
            )?.designer_id ?? ''
          }
          drawingId={rejectDrawing.id}
          drawingNo={rejectDrawing.no}
          revertStatus="rejected"
        />
      )}
    </div>
  );
}