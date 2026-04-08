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
import { Drawing } from '@/data/mockData';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

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

  // const handleApprove = async (id: string) => {
  //   const { error } = await supabase.from('drawings').update({
  //     status: 'approved' as any,
  //     approved_by: user?.id,
  //     approved_date: new Date().toISOString(),
  //     stamp_applied: true,
  //   }).eq('id', id);
  //   if (error) { toast.error(error.message); return; }

  //   if (user) {
  //     await supabase.from('drawing_comments').insert({
  //       drawing_id: id, author_id: user.id,
  //       comment: 'Approved by Dept Head — stamp applied',
  //       action: 'approve',
  //     });
  //   }
  //   toast.success('Drawing approved — PDF stamp applied and moved to Approved Folder');
  //   queryClient.invalidateQueries({ queryKey: ['drawings'] });
  // };

// const handleApprove = async (drawing: Drawing) => {
//   const { error } = await supabase.from('drawings').update({
//     status: 'approved' as any,
//     approved_by: user?.id,
//     approved_date: new Date().toISOString(),
//   }).eq('id', drawing.id);

//   if (error) { toast.error("Approval failed"); return; }

//   const { data, error: stampError } = await supabase.functions.invoke('apply-stamp', {
//     body: {
//       drawingId: drawing.id,
//       filePath: drawing.file_url,
//       approvedBy: profile?.full_name,
//       date: new Date().toLocaleDateString()
//     },
//     headers: {
//     Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
//   }
//   });

//   console.log('Stamp result:', data);
//   console.log('Stamp error:', stampError);

//   if (stampError) {
//     toast.error('Stamp failed: ' + stampError.message);
//   } else {
//     toast.success('Approved and stamped!');
//   }

//   queryClient.invalidateQueries({ queryKey: ['drawings'] });
// };

//   const handleReject = async (drawingId: string) => {
//     // Update status back to working
//     await supabase.from('drawings').update({ status: 'working' }).eq('id', drawingId);

//     // Trigger Realtime Notification
//     await supabase.channel('approval-alerts').send({
//       type: 'broadcast',
//       event: 'rejection',
//       payload: { message: `Dept Head rejected drawing ${drawingId}` },
//     });

//     toast.error("Rejected. Line Manager has been notified.");
//   };


const handleApprove = async (drawing: Drawing) => {
  try {
    // 1. Update DB status
    const { error } = await supabase.from('drawings').update({
      status: 'approved' as any,
      approved_by: user?.id,
      approved_date: new Date().toISOString(),
    }).eq('id', drawing.id);

    if (error) { toast.error("Approval failed: " + error.message); return; }

    // 2. If it's a CAD-only file, skip stamping
    if (drawing.file_type === 'cad' || !drawing.file_url) {
      toast.success('Drawing approved!');
      queryClient.invalidateQueries({ queryKey: ['drawings'] });
      return;
    }

    // 3. Client-side PDF stamp
    const toastId = toast.loading('Applying stamp to PDF...');

    // Fetch the PDF — needs bucket to be public
    const response = await fetch(drawing.file_url);
    if (!response.ok) throw new Error(`Could not fetch PDF: ${response.status}`);
    
    const pdfBytes = await response.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const firstPage = pdfDoc.getPages()[0];
    const { width, height } = firstPage.getSize();

    // Stamp box — top right
    firstPage.drawRectangle({
      x: width - 190,
      y: height - 95,
      width: 175,
      height: 80,
      borderColor: rgb(0, 0.55, 0.27),
      borderWidth: 2,
    });
    firstPage.drawText('APPROVED', {
      x: width - 178,
      y: height - 38,
      size: 22,
      font,
      color: rgb(0, 0.55, 0.27),
    });
    firstPage.drawText(`By: ${profile?.full_name ?? 'Dept Head'}`, {
      x: width - 178,
      y: height - 58,
      size: 9,
      font,
      color: rgb(0.15, 0.15, 0.15),
    });
    firstPage.drawText(`Date: ${new Date().toLocaleDateString()}`, {
      x: width - 178,
      y: height - 72,
      size: 9,
      font,
      color: rgb(0.15, 0.15, 0.15),
    });

    const stampedBytes = await pdfDoc.save();

    // 4. Upload stamped version to approved/ subfolder
    // const originalPath = drawing.file_url.split('/drawing-files/')[1];
    const originalPath = drawing.file_url.split('/drawing-files/')[1];

    // Remove any query params from the path
    const cleanPath = originalPath.split('?')[0];
    const decodedPath = decodeURIComponent(cleanPath);


    // const fileName = cleanPath.split('/').pop();
    const fileName = decodedPath.split('/').pop();

    // const userId = cleanPath.split('/')[0];
    const userId = decodedPath.split('/')[0];

    const safeFileName = fileName!.replace(/\s+/g, '_');


    // const stampedPath = `${userId}/approved/${fileName}`;
    const stampedPath = `${userId}/approved/${safeFileName}`;


    const { error: uploadError } = await supabase.storage
      .from('drawing-files')
      .upload(stampedPath, stampedBytes, {
        upsert: true,
        contentType: 'application/pdf',
      });

    if (uploadError) throw new Error('Upload failed: ' + uploadError.message);

    // 5. Get new URL and update DB
    const { data: urlData } = supabase.storage
      .from('drawing-files')
      .getPublicUrl(stampedPath);

    await supabase.from('drawings').update({
      stamp_applied: true,
      file_url: urlData.publicUrl,
    }).eq('id', drawing.id);

    // 6. Add approval comment
    if (user) {
      await supabase.from('drawing_comments').insert({
        drawing_id: drawing.id,
        author_id: user.id,
        comment: `Approved by ${profile?.full_name} — PDF stamp applied`,
        action: 'approve',
      });
    }

    toast.dismiss(toastId);
    toast.success('Drawing approved and PDF stamped!');
    queryClient.invalidateQueries({ queryKey: ['drawings'] });

  } catch (err: any) {
    toast.dismiss();
    toast.error('Error: ' + err.message);
    console.error('Approve error:', err);
  }
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
          {/* <DrawingTable
            drawings={pending}
            showAging
            renderActions={(d) => (
              <div className="flex gap-2 justify-end">
                <Button size="sm" className="bg-[hsl(var(--status-approved))] hover:bg-[hsl(var(--status-approved))]/90 text-primary-foreground" onClick={() => handleApprove(d.id)}>Approve</Button>
                <Button size="sm" variant="destructive" onClick={() => setRejectDrawing({ id: d.id, no: d.drawing_no })}>Reject</Button>
              </div>
            )}
          /> */}

          <DrawingTable
            drawings={pending}
            renderActions={(d) => (
              <div className="flex gap-2 justify-end">
                {/* ADD VIEW BUTTON HERE */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(d.file_url, '_blank')}
                >
                  View PDF
                </Button>

                <Button size="sm" className="..." onClick={() => handleApprove(d as unknown as Drawing)}>Approve</Button>
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
