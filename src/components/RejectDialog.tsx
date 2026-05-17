import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createNotification } from '@/lib/notifications';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { Database } from '@/integrations/supabase/types';

type DrawingStatus = Database['public']['Enums']['drawing_status'];

interface RejectDialogProps {
  open: boolean;
  designerId: string;
  onOpenChange: (open: boolean) => void;
  drawingId: string;
  drawingNo: string;
  /** The status to revert to — 'working' from line-manager rejection, 'working' from dept-head rejection */
  revertStatus: DrawingStatus;
}

export function RejectDialog({ open, onOpenChange, drawingId, drawingNo, revertStatus, designerId }: RejectDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReject = async () => {
    if (!user || !comment.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    setLoading(true);
    try {
      // Insert rejection comment
      const { error: commentError } = await supabase.from('drawing_comments').insert({
        drawing_id: drawingId,
        author_id: user.id,
        comment: comment.trim(),
        action: 'reject',
      });
      if (commentError) throw commentError;

      // Update drawing status back to working
      const { error: updateError } = await supabase.from('drawings').update({
        status: revertStatus,
      }).eq('id', drawingId);
      if (updateError) throw updateError;

      await createNotification({
        userId: designerId,
        title: 'Drawing Rejected',
        message: `${drawingNo} has been rejected — please review the feedback and resubmit.`,
        type: 'rejected',
        drawingId: drawingId,
      });

      toast.error(`${drawingNo} rejected — Designer has been notified`);
      queryClient.invalidateQueries({ queryKey: ['drawings'] });
      onOpenChange(false);
      setComment('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-destructive">Reject {drawingNo}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Rejection Comment <span className="text-destructive">*</span></Label>
            <Textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Provide specific feedback for the designer (e.g., 'Cable tray dimensions do not meet IEC 61439 standards. Revise Section C clearances.')"
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground">This comment will be visible to the Designer and Line Manager.</p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={loading || !comment.trim()}>
              {loading ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
