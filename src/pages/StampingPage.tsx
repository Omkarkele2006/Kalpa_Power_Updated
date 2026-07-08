import { useMemo } from 'react';

import { useDrawings } from '@/hooks/useDrawings';
import { useAuth } from '@/hooks/useAuth';

import { DashboardHeader } from '@/components/DashboardHeader';
import { StatusBadge } from '@/components/StatusBadge';

import {
  Stamp,
  FileText,
  CheckCircle,
  Archive,
  ShieldCheck,
  FolderKanban,
} from 'lucide-react';

export default function StampingPage() {
  const { profile } = useAuth();

  const { data: allDrawings = [] } =
    useDrawings();

  const approved = useMemo(() => {
    return allDrawings.filter(
      (d) => d.status === 'approved'
    );
  }, [allDrawings]);

  const archived = useMemo(() => {
    return allDrawings.filter(
      (d) =>
        d.folder_path?.includes('/archive/') ||
        d.status === 'archived'
    );
  }, [allDrawings]);

  const stampedCount = approved.filter(
    (d) => d.stamp_applied
  ).length;

  return (
    <div className="flex flex-col h-full">

      <DashboardHeader
        title="Released Documents"
        subtitle={`${profile?.full_name ?? ''} • Approved drawings, release records, and revision history`}
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">

        {/* Top Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

          <div className="rounded-xl border bg-card p-5">

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Released Drawings
              </p>

              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>

            <h3 className="mt-3 text-3xl font-bold">
              {approved.length}
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              Latest approved revisions
            </p>

          </div>

          <div className="rounded-xl border bg-card p-5">

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                PDF Stamps Applied
              </p>

              <Stamp className="h-5 w-5 text-blue-500" />
            </div>

            <h3 className="mt-3 text-3xl font-bold">
              {stampedCount}
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              Approved PDFs stamped automatically
            </p>

          </div>

          <div className="rounded-xl border bg-card p-5">

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Archived Revisions
              </p>

              <Archive className="h-5 w-5 text-amber-500" />
            </div>

            <h3 className="mt-3 text-3xl font-bold">
              {archived.length}
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              Previous approved revisions retained
            </p>

          </div>

          <div className="rounded-xl border bg-card p-5">

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Release Integrity
              </p>

              <ShieldCheck className="h-5 w-5 text-emerald-500" />
            </div>

            <h3 className="mt-3 text-3xl font-bold">
              100%
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              Controlled approval lifecycle
            </p>

          </div>

        </div>

        {/* Workflow Information */}
        <div className="rounded-xl border bg-card">

          <div className="border-b px-6 py-4">

            <div className="flex items-center gap-2">

              <FolderKanban className="h-5 w-5 text-primary" />

              <h2 className="text-lg font-semibold">
                Release Workflow
              </h2>

            </div>

            <p className="text-sm text-muted-foreground mt-1">
              Approved drawings are automatically released,
              stamped, and archived according to the revision lifecycle.
            </p>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">

            <div className="rounded-lg border bg-muted/30 p-5">

              <div className="flex items-center gap-2 mb-3">

                <div className="rounded-md bg-yellow-100 dark:bg-yellow-900/20 p-2">
                  <FileText className="h-4 w-4 text-yellow-700 dark:text-yellow-400" />
                </div>

                <h3 className="font-medium">
                  Review Completion
                </h3>

              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                Drawings reviewed and approved by the
                Department Head are finalized for release.
              </p>

            </div>

            <div className="rounded-lg border bg-muted/30 p-5">

              <div className="flex items-center gap-2 mb-3">

                <div className="rounded-md bg-green-100 dark:bg-green-900/20 p-2">
                  <Stamp className="h-4 w-4 text-green-700 dark:text-green-400" />
                </div>

                <h3 className="font-medium">
                  Automatic PDF Stamping
                </h3>

              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                Approved PDF drawings receive digital
                approval stamps with revision metadata,
                approver details, and IST timestamp.
              </p>

            </div>

            <div className="rounded-lg border bg-muted/30 p-5">

              <div className="flex items-center gap-2 mb-3">

                <div className="rounded-md bg-amber-100 dark:bg-amber-900/20 p-2">
                  <Archive className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                </div>

                <h3 className="font-medium">
                  Revision Archival
                </h3>

              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                Older approved revisions are preserved in
                archive storage to maintain complete
                engineering traceability.
              </p>

            </div>

          </div>

        </div>

        {/* Released Documents */}
        <div className="rounded-xl border bg-card">

          <div className="border-b px-6 py-4">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-lg font-semibold">
                  Released Documents
                </h2>

                <p className="text-sm text-muted-foreground mt-1">
                  Latest approved and published drawing revisions
                </p>
              </div>

              <div className="text-sm text-muted-foreground">
                Total Released: {approved.length}
              </div>

            </div>

          </div>

          <div className="divide-y">

            {approved.length === 0 && (
              <div className="py-16 text-center text-muted-foreground">
                No released documents available.
              </div>
            )}

            {approved.map((drawing) => (
              <div
                key={drawing.id}
                className="flex items-center justify-between p-5 animate-fade-in"
              >

                <div className="flex items-start gap-4">

                  <div className="rounded-lg bg-green-100 dark:bg-green-900/20 p-2">
                    <CheckCircle className="h-5 w-5 text-green-700 dark:text-green-400" />
                  </div>

                  <div>

                    <p className="font-mono text-sm font-medium">
                      {drawing.drawing_no}
                    </p>

                    <p className="text-sm mt-1">
                      {drawing.design_name?.replace(/_/g, ' ')}
                    </p>

                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">

                      <span>
                        Rev {drawing.revision}
                      </span>

                      <span>•</span>

                      <span>
                        {drawing.projects?.project_name ??
                          'Unknown Project'}
                      </span>

                      <span>•</span>

                      <span>
                        {drawing.file_name ??
                          'No file attached'}
                      </span>

                    </div>

                  </div>

                </div>

                <div className="text-right">

                  <StatusBadge
                    status={drawing.status}
                  />

                  <p className="text-xs text-muted-foreground mt-2">

                    {drawing.stamp_applied
                      ? '✓ Approval stamp applied'
                      : 'Release pending stamp'}

                  </p>

                </div>

              </div>
            ))}

          </div>

        </div>

        {/* Archived Revisions */}
        <div className="rounded-xl border bg-card">

          <div className="border-b px-6 py-4">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="text-lg font-semibold">
                  Archived Revisions
                </h2>

                <p className="text-sm text-muted-foreground mt-1">
                  Historical approved revisions retained for audit traceability
                </p>
              </div>

              <div className="text-sm text-muted-foreground">
                Archived: {archived.length}
              </div>

            </div>

          </div>

          <div className="divide-y">

            {archived.length === 0 && (
              <div className="py-16 text-center text-muted-foreground">
                No archived revisions available.
              </div>
            )}

            {archived.map((drawing) => (
              <div
                key={drawing.id}
                className="flex items-center justify-between p-5"
              >

                <div className="flex items-start gap-4">

                  <div className="rounded-lg bg-amber-100 dark:bg-amber-900/20 p-2">
                    <Archive className="h-5 w-5 text-amber-700 dark:text-amber-400" />
                  </div>

                  <div>

                    <p className="font-mono text-sm font-medium">
                      {drawing.drawing_no}
                    </p>

                    <p className="text-sm mt-1">
                      {drawing.design_name?.replace(/_/g, ' ')}
                    </p>

                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">

                      <span>
                        Rev {drawing.revision}
                      </span>

                      <span>•</span>

                      <span>
                        Historical archived revision
                      </span>

                    </div>

                  </div>

                </div>

                <div className="text-right">

                  <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                    Archived
                  </span>

                </div>

              </div>
            ))}

          </div>

        </div>

      </div>
    </div>
  );
}