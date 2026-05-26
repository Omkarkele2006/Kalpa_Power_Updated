import { useMemo } from 'react';
import { useDrawings, useDrawingComments } from '@/hooks/useDrawings';
import { useAuth } from '@/hooks/useAuth';

import { DashboardHeader } from '@/components/DashboardHeader';
import { DrawingTable } from '@/components/DrawingTable';
import { SubmitForReviewButton } from '@/components/SubmitForReviewButton';
import { UploadDrawingDialog } from '@/components/UploadDrawingDialog';

import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export default function MyDrawingsPage() {
  const { user, profile } = useAuth();
  const { data: allDrawings = [], isLoading } = useDrawings();

  const myDrawings = useMemo(() => {
    return allDrawings.filter(
      (drawing) => drawing.designer_id === user?.id
    );
  }, [allDrawings, user?.id]);

  const stats = useMemo(() => {
    return {
      working: myDrawings.filter((d) => d.status === 'working').length,
      review: myDrawings.filter(
        (d) =>
          d.status === 'under-review' ||
          d.status === 'pending-dept-head'
      ).length,
      approved: myDrawings.filter(
        (d) => d.status === 'approved'
      ).length,
      rejected: myDrawings.filter(
        (d) => d.status === 'rejected'
      ).length,
    };
  }, [myDrawings]);

  const rejectedDrawings = myDrawings.filter(
    (d) => d.status === 'rejected'
  );

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader
        title="My Drawings"
        subtitle={`${profile?.full_name ?? ''} • Manage drawings and revisions`}
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">

        {/* Top Action Bar */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1">

            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Work in Progress
                </p>
                <FileText className="h-5 w-5 text-blue-500" />
              </div>

              <h3 className="mt-3 text-3xl font-bold">
                {stats.working}
              </h3>
            </div>

            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Under Review
                </p>
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>

              <h3 className="mt-3 text-3xl font-bold">
                {stats.review}
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
                {stats.approved}
              </h3>
            </div>

            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Needs Revision
                </p>
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>

              <h3 className="mt-3 text-3xl font-bold">
                {stats.rejected}
              </h3>
            </div>

          </div>

          {/* Upload Button */}
          <div className="flex justify-end">
            <UploadDrawingDialog />
          </div>
        </div>

        {/* Rejection Feedback */}
        {rejectedDrawings.length > 0 && (
          <RejectionFeedback drawings={rejectedDrawings} />
        )}

        {/* Main Drawings Table */}
        <div className="rounded-xl border bg-card">

          <div className="border-b px-6 py-4">
            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-lg font-semibold">
                  Drawing Records
                </h2>

                <p className="text-sm text-muted-foreground mt-1">
                  Manage revisions, approvals, and submissions
                </p>
              </div>

              <div className="text-sm text-muted-foreground">
                Total Drawings: {myDrawings.length}
              </div>

            </div>
          </div>

          <div className="p-6">

            {isLoading ? (
              <div className="py-16 text-center text-muted-foreground">
                Loading drawings...
              </div>
            ) : (
              <DrawingTable
                drawings={myDrawings}
                showDesigner={false}
                renderActions={(drawing) =>
                  drawing.status === 'working' ? (
                    <SubmitForReviewButton
                      drawingId={drawing.id}
                      drawingNo={drawing.drawing_no}
                    />
                  ) : null
                }
              />
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

function RejectionFeedback({
  drawings,
}: {
  drawings: any[];
}) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 animate-fade-in">

      <h3 className="flex items-center gap-2 text-sm font-semibold text-destructive">
        <AlertTriangle className="h-4 w-4" />
        Rejection Feedback
      </h3>

      <div className="mt-3 space-y-3">
        {drawings.map((drawing) => (
          <RejectionItem
            key={drawing.id}
            drawingId={drawing.id}
            drawingNo={drawing.drawing_no}
          />
        ))}
      </div>
    </div>
  );
}

function RejectionItem({
  drawingId,
  drawingNo,
}: {
  drawingId: string;
  drawingNo: string;
}) {
  const { data: comments = [] } = useDrawingComments(drawingId);

  const rejections = comments.filter(
    (comment: any) => comment.action === 'reject'
  );

  return (
    <div className="rounded-lg bg-background border p-4">

      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-medium">
          {drawingNo}
        </span>

        <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">
          Rejected
        </span>
      </div>

      {rejections.length > 0 ? (
        <div className="mt-3 space-y-2">

          {rejections.map((comment: any) => (
            <div key={comment.id}>
              <p className="text-sm text-muted-foreground">
                {comment.comment}
              </p>

              <p className="text-xs text-muted-foreground mt-1">
                — {(comment as any).profiles?.full_name ?? 'Reviewer'}
              </p>
            </div>
          ))}

        </div>
      ) : (
        <p className="text-sm text-muted-foreground mt-2">
          No rejection comments available.
        </p>
      )}
    </div>
  );
}