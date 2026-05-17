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
import { createNotification } from '@/lib/notifications';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Drawing } from '@/data/mockData';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { copyToApproved, deleteStorageFile, getApprovedPath, getSiblingStoragePath, getSignedUrl, moveToApproved } from '@/lib/storageUtils';

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
  if (!drawing.folder_path) {
    toast.error('Cannot approve drawing: missing storage path.');
    return;
  }

  const sourcePath = drawing.folder_path;
  const approvedPath = getApprovedPath(sourcePath);
  const isPdf = drawing.file_type !== 'cad';

  console.debug('[DeptHead] approving drawing', {
    drawingId: drawing.id,
    drawing_no: drawing.drawing_no,
    project_number: drawing.project_number,
    sourcePath,
    approvedPath,
    file_type: drawing.file_type,
  });

  const toastId = toast.loading('Approving drawing...');

  try {
    // ── Step 1: Stamp PDF if needed and write to approved/ ──────────────────
    let createdApprovedPaths: string[] = [];
    const cleanupApprovedArtifacts = async () => {
      await Promise.allSettled(createdApprovedPaths.map((p) => deleteStorageFile(p)));
    };

    try {
      if (isPdf) {
        const signedUrl = await getSignedUrl(sourcePath);
        const response = await fetch(signedUrl);
        if (!response.ok) throw new Error(`Could not fetch PDF: ${response.status}`);

        const pdfBytes = await response.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const firstPage = pdfDoc.getPages()[0];
        const { width } = firstPage.getSize();

        const stampMargin = 24;
        const stampWidth = Math.min(280, width * 0.34);
        const stampLines = [
          'APPROVED',
          'Kalpa Power Pvt. Ltd.',
          `Approved By: ${profile?.full_name ?? 'Department Head'}`,
          'Designation: Department Head',
          `Approval Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Kolkata' })}`,
          `Approval Time: ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })} IST`,
          `Document Revision: R${drawing.revision}`,
          'Status: Approved',
        ];
        const stampLineHeight = 12;
        const stampHeight = stampLineHeight * stampLines.length + 24;
        const stampX = width - stampMargin - stampWidth;
        const stampY = stampMargin;

        firstPage.drawRectangle({
          x: stampX, y: stampY, width: stampWidth, height: stampHeight,
          borderColor: rgb(0, 0.35, 0.15), color: rgb(1, 1, 1), borderWidth: 1.8,
        });

        firstPage.drawText(stampLines[0], {
          x: stampX + 12, y: stampY + stampHeight - 28,
          size: 16, font: boldFont, color: rgb(0, 0.35, 0.15),
        });

        firstPage.drawLine({
          start: { x: stampX + 10, y: stampY + stampHeight - 34 },
          end:   { x: stampX + stampWidth - 10, y: stampY + stampHeight - 34 },
          thickness: 1, color: rgb(0, 0.35, 0.15),
        });

        stampLines.slice(1).forEach((line, index) => {
          firstPage.drawText(line, {
            x: stampX + 12,
            y: stampY + stampHeight - 34 - ((index + 1) * stampLineHeight),
            size: 9, font: regularFont, color: rgb(0.15, 0.15, 0.15),
          });
        });

        const stampedBytes = await pdfDoc.save();
        const { error: uploadError } = await supabase.storage
          .from('drawing-files')
          .upload(approvedPath, stampedBytes, { upsert: true, contentType: 'application/pdf' });
        if (uploadError) throw new Error('Upload failed: ' + uploadError.message);
        createdApprovedPaths.push(approvedPath);

        if (drawing.file_type === 'both') {
          const cadSourcePath = getSiblingStoragePath(sourcePath);
          const cadApprovedPath = getSiblingStoragePath(approvedPath);
          if (cadSourcePath && cadApprovedPath) {
            await moveToApproved(cadSourcePath);
            createdApprovedPaths.push(cadApprovedPath);
          }
        }
      } else {
        // CAD-only: copy to approved/ without stamping
        await moveToApproved(sourcePath);
        createdApprovedPaths.push(approvedPath);
      }
    } catch (storageError) {
      await cleanupApprovedArtifacts();
      throw storageError;
    }

    // ── Step 2: Update DB FIRST with new approved path ──────────────────────
    // CRITICAL: Update DB before deleting working file. If this fails,
    // we still have the working file and can retry without data loss.
    const { data: urlData } = supabase.storage.from('drawing-files').getPublicUrl(approvedPath);

    const { error: updateError } = await supabase.from('drawings').update({
      status:        'approved' as any,
      approved_by:   user?.id,
      approved_date: new Date().toISOString(),
      folder_path:   approvedPath,
      file_url:      urlData.publicUrl,
      stamp_applied: isPdf,
    }).eq('id', drawing.id);

    if (updateError) {
      await cleanupApprovedArtifacts();
      throw updateError;
    }

    // ── Step 3: Delete working file now that DB is safely updated ──────────
    // Only delete after DB confirms the approved path.
    if (sourcePath !== approvedPath) {
      try {
        await deleteStorageFile(sourcePath);
      } catch (deleteErr) {
        console.warn('[DeptHead] Failed to delete working file after approval (non-blocking):', deleteErr);
        // Do not throw — the important data is already in approved/
      }
    }

    // ── Step 4: Audit comment ──────────────────────────────────────────────
    if (user) {
      await supabase.from('drawing_comments').insert({
        drawing_id: drawing.id,
        author_id:  user.id,
        comment: `Approved by ${profile?.full_name} — ${isPdf ? 'PDF stamp applied' : 'Final approval granted'}`,
        action: 'approve',
      });
    }

    toast.dismiss(toastId);
    await createNotification({
  userId: drawing.designer_id,
  title: 'Drawing Approved',
  message: `${drawing.drawing_no} approved successfully`,
  type: 'approved',
  drawingId: drawing.id,
});
    toast.success(isPdf ? 'Drawing approved and PDF stamped!' : 'Drawing approved!');
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
