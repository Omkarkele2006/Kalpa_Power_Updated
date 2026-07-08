import { useState } from 'react';

import { useDrawings } from '@/hooks/useDrawings';
import { useAuth } from '@/hooks/useAuth';

import { DashboardHeader } from '@/components/DashboardHeader';
import { DrawingTable } from '@/components/DrawingTable';
import { RejectDialog } from '@/components/RejectDialog';

import {
  CheckCircle,
  Clock,
  XCircle,
  BarChart3,
} from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import { createNotification } from '@/lib/notifications';

import { useQueryClient } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';

import { Drawing } from '@/data/mockData';

import {
  PDFDocument,
  rgb,
  StandardFonts,
} from 'pdf-lib';

import {
  deleteStorageFile,
  getApprovedPath,
  getSiblingStoragePath,
  getSignedUrl,
  moveToApproved,
} from '@/lib/storageUtils';

export default function ApprovalsPage() {
  const { profile, user } = useAuth();

  const { data: allDrawings = [] } =
    useDrawings();

  const queryClient = useQueryClient();

  const pending = allDrawings.filter(
    (d) => d.status === 'pending-dept-head'
  );

  const approved = allDrawings.filter(
    (d) => d.status === 'approved'
  );

  const rejected = allDrawings.filter(
    (d) => d.status === 'rejected'
  );

  const total = allDrawings.length;

  const approvalRate =
    total > 0
      ? Math.round((approved.length / total) * 100)
      : 0;

  const [rejectDrawing, setRejectDrawing] =
    useState<{
      id: string;
      no: string;
    } | null>(null);

  const handleApprove = async (
    drawing: Drawing
  ) => {
    if (!drawing.folder_path) {
      toast.error(
        'Cannot approve drawing: missing storage path.'
      );
      return;
    }

    const sourcePath = drawing.folder_path;

    const approvedPath =
      getApprovedPath(sourcePath);

    const isPdf =
      drawing.file_type !== 'cad';

    const toastId = toast.loading(
      'Approving drawing...'
    );

    try {
      let createdApprovedPaths: string[] = [];

      const cleanupApprovedArtifacts =
        async () => {
          await Promise.allSettled(
            createdApprovedPaths.map((p) =>
              deleteStorageFile(p)
            )
          );
        };

      try {
        if (isPdf) {
          const signedUrl =
            await getSignedUrl(sourcePath);

          const response = await fetch(
            signedUrl
          );

          if (!response.ok) {
            throw new Error(
              `Could not fetch PDF: ${response.status}`
            );
          }

          const pdfBytes =
            await response.arrayBuffer();

          const pdfDoc =
            await PDFDocument.load(pdfBytes);

          const boldFont =
            await pdfDoc.embedFont(
              StandardFonts.HelveticaBold
            );

          const regularFont =
            await pdfDoc.embedFont(
              StandardFonts.Helvetica
            );

          const firstPage =
            pdfDoc.getPages()[0];

          const { width } =
            firstPage.getSize();

          const stampMargin = 24;

          const stampWidth = Math.min(
            280,
            width * 0.34
          );

          const stampLines = [
            'APPROVED',
            'Kalpa Power Pvt. Ltd.',
            `Approved By: ${profile?.full_name ?? 'Department Head'}`,
            'Designation: Department Head',
            `Approval Date: ${new Date().toLocaleDateString('en-IN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              timeZone: 'Asia/Kolkata',
            })}`,
            `Approval Time: ${new Date().toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
              timeZone: 'Asia/Kolkata',
            })} IST`,
            `Document Revision: R${drawing.revision}`,
            'Status: Approved',
          ];

          const stampLineHeight = 12;

          const stampHeight =
            stampLineHeight *
              stampLines.length +
            24;

          const stampX =
            width -
            stampMargin -
            stampWidth;

          const stampY = stampMargin;

          firstPage.drawRectangle({
            x: stampX,
            y: stampY,
            width: stampWidth,
            height: stampHeight,
            borderColor: rgb(0, 0.35, 0.15),
            color: rgb(1, 1, 1),
            borderWidth: 1.8,
          });

          firstPage.drawText(
            stampLines[0],
            {
              x: stampX + 12,
              y:
                stampY +
                stampHeight -
                28,
              size: 16,
              font: boldFont,
              color: rgb(0, 0.35, 0.15),
            }
          );

          stampLines
            .slice(1)
            .forEach((line, index) => {
              firstPage.drawText(line, {
                x: stampX + 12,
                y:
                  stampY +
                  stampHeight -
                  34 -
                  ((index + 1) *
                    stampLineHeight),
                size: 9,
                font: regularFont,
                color: rgb(
                  0.15,
                  0.15,
                  0.15
                ),
              });
            });

          const stampedBytes =
            await pdfDoc.save();

          const { error: uploadError } =
            await supabase.storage
              .from('drawing-files')
              .upload(
                approvedPath,
                stampedBytes,
                {
                  upsert: true,
                  contentType:
                    'application/pdf',
                }
              );

          if (uploadError) {
            throw new Error(
              'Upload failed: ' +
                uploadError.message
            );
          }

          createdApprovedPaths.push(
            approvedPath
          );

          if (
            drawing.file_type === 'both'
          ) {
            const cadSourcePath =
              getSiblingStoragePath(
                sourcePath
              );

            const cadApprovedPath =
              getSiblingStoragePath(
                approvedPath
              );

            if (
              cadSourcePath &&
              cadApprovedPath
            ) {
              await moveToApproved(
                cadSourcePath
              );

              createdApprovedPaths.push(
                cadApprovedPath
              );
            }
          }
        } else {
          await moveToApproved(
            sourcePath
          );

          createdApprovedPaths.push(
            approvedPath
          );
        }
      } catch (storageError) {
        await cleanupApprovedArtifacts();
        throw storageError;
      }

      const { data: urlData } =
        supabase.storage
          .from('drawing-files')
          .getPublicUrl(approvedPath);

      const { error: updateError } =
        await supabase
          .from('drawings')
          .update({
            status: 'approved' as any,
            approved_by: user?.id,
            approved_date:
              new Date().toISOString(),
            folder_path: approvedPath,
            file_url:
              urlData.publicUrl,
            stamp_applied: isPdf,
          })
          .eq('id', drawing.id);

      if (updateError) {
        throw updateError;
      }

      if (sourcePath !== approvedPath) {
        try {
          await deleteStorageFile(
            sourcePath
          );
        } catch (deleteErr) {
          console.warn(deleteErr);
        }
      }

      if (user) {
        await supabase
          .from('drawing_comments')
          .insert({
            drawing_id: drawing.id,
            author_id: user.id,
            comment: `Approved by ${profile?.full_name}`,
            action: 'approve',
          });
      }

      await createNotification({
        userId: drawing.designer_id,
        title: 'Drawing Approved',
        message: `${drawing.drawing_no} approved successfully`,
        type: 'approved',
        drawingId: drawing.id,
      });

      toast.dismiss(toastId);

      toast.success(
        isPdf
          ? 'Drawing approved and PDF stamped!'
          : 'Drawing approved!'
      );

      queryClient.invalidateQueries({
        queryKey: ['drawings'],
      });
    } catch (err: any) {
      toast.dismiss();

      toast.error(
        'Error: ' + err.message
      );

      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-full">

      <DashboardHeader
        title="Approvals"
        subtitle={`${profile?.full_name ?? ''} • Final approval operations`}
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Awaiting Approval
              </p>

              <Clock className="h-5 w-5 text-yellow-500" />
            </div>

            <h3 className="mt-3 text-3xl font-bold">
              {pending.length}
            </h3>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Approved
              </p>

              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>

            <h3 className="mt-3 text-3xl font-bold">
              {approved.length}
            </h3>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Rejected
              </p>

              <XCircle className="h-5 w-5 text-red-500" />
            </div>

            <h3 className="mt-3 text-3xl font-bold">
              {rejected.length}
            </h3>
          </div>

          <div className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Approval Rate
              </p>

              <BarChart3 className="h-5 w-5 text-slate-500" />
            </div>

            <h3 className="mt-3 text-3xl font-bold">
              {approvalRate}%
            </h3>

            <p className="text-xs text-muted-foreground mt-1">
              {approved.length} of {total} drawings
            </p>
          </div>
        </div>

        {/* Approval Table */}
        <div className="rounded-xl border bg-card">

          <div className="border-b px-6 py-4">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-lg font-semibold">
                  Pending Final Approvals
                </h2>

                <p className="text-sm text-muted-foreground mt-1">
                  Review and approve finalized drawings
                </p>
              </div>

              <div className="text-sm text-muted-foreground">
                Awaiting Approval: {pending.length}
              </div>

            </div>
          </div>

          <div className="p-6">

            <DrawingTable
              drawings={pending}
              renderActions={(d) => (
                <div className="flex gap-2 justify-end">

                  <Button
                    size="sm"
                    className="bg-[hsl(var(--status-approved))] hover:bg-[hsl(var(--status-approved))]/90 text-primary-foreground"
                    onClick={() =>
                      handleApprove(
                        d as unknown as Drawing
                      )
                    }
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
              (d) =>
                d.id === rejectDrawing.id
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