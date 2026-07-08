import { useDrawings } from '@/hooks/useDrawings';
import { useAuth } from '@/hooks/useAuth';

import { DashboardHeader } from '@/components/DashboardHeader';
import { StatsCard } from '@/components/StatsCard';

import {
  CheckCircle,
  Clock,
  XCircle,
  BarChart3,
} from 'lucide-react';

export default function DeptHeadDashboard() {
  const { profile } = useAuth();

  const { data: allDrawings = [] } =
    useDrawings();

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

  const recentPending = pending.slice(0, 5);

  return (
    <div className="flex flex-col h-full">

      <DashboardHeader
        title="Dept Head Dashboard"
        subtitle={`${profile?.full_name ?? ''} • Final Approval Authority`}
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">

        {/* Top Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          <StatsCard
            title="Awaiting Approval"
            value={pending.length}
            icon={Clock}
            variant="pending"
          />

          <StatsCard
            title="Approved"
            value={approved.length}
            icon={CheckCircle}
            variant="approved"
          />

          <StatsCard
            title="Rejected"
            value={rejected.length}
            icon={XCircle}
            variant="rejected"
          />

          <StatsCard
            title="Approval Rate"
            value={`${approvalRate}%`}
            icon={BarChart3}
            trend={`${approved.length} of ${total} drawings`}
          />

        </div>

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Pending Approval Summary */}
          <div className="xl:col-span-2 rounded-xl border bg-card">

            <div className="border-b px-6 py-4">

              <div className="flex items-center justify-between">

                <div>
                  <h2 className="text-lg font-semibold">
                    Pending Approval Summary
                  </h2>

                  <p className="text-sm text-muted-foreground mt-1">
                    Latest drawings awaiting final approval
                  </p>
                </div>

                <div className="text-sm text-muted-foreground">
                  Showing {Math.min(recentPending.length, 5)} of {pending.length}
                </div>

              </div>
            </div>

            <div className="divide-y">

              {recentPending.length > 0 ? (
                recentPending.map((drawing) => (
                  <div
                    key={drawing.id}
                    className="px-6 py-4 flex items-center justify-between"
                  >

                    <div className="min-w-0">

                      <p className="font-mono text-sm font-medium truncate">
                        {drawing.drawing_no}
                      </p>

                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">

                        <span>
                          Rev {drawing.revision}
                        </span>

                        <span>•</span>

                        <span>
                          {drawing.projects?.project_name ??
                            'Unknown Project'}
                        </span>

                      </div>

                    </div>

                    <div className="flex items-center gap-2">

                      <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                        Pending Dept Head
                      </span>

                    </div>

                  </div>
                ))
              ) : (
                <div className="py-16 text-center text-muted-foreground">
                  No drawings currently awaiting approval.
                </div>
              )}

            </div>
          </div>

          {/* Approval Insights */}
          <div className="rounded-xl border bg-card">

            <div className="border-b px-6 py-4">

              <h2 className="text-lg font-semibold">
                Approval Insights
              </h2>

              <p className="text-sm text-muted-foreground mt-1">
                Final approval workflow overview
              </p>

            </div>

            <div className="p-6 space-y-5">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm font-medium">
                    Awaiting Final Approval
                  </p>

                  <p className="text-xs text-muted-foreground mt-1">
                    Drawings pending department head action
                  </p>
                </div>

                <div className="text-2xl font-bold">
                  {pending.length}
                </div>

              </div>

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm font-medium">
                    Approved Drawings
                  </p>

                  <p className="text-xs text-muted-foreground mt-1">
                    Successfully finalized and stamped
                  </p>
                </div>

                <div className="text-2xl font-bold text-green-600">
                  {approved.length}
                </div>

              </div>

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm font-medium">
                    Rejected Drawings
                  </p>

                  <p className="text-xs text-muted-foreground mt-1">
                    Returned for revision workflow
                  </p>
                </div>

                <div className="text-2xl font-bold text-red-500">
                  {rejected.length}
                </div>

              </div>

              <div className="pt-2 border-t">

                <p className="text-xs text-muted-foreground leading-relaxed">
                  Use the Approvals module to review finalized
                  submissions, apply PDF approval stamps,
                  and publish approved drawing revisions.
                </p>

              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}