import { useDrawings } from '@/hooks/useDrawings';
import { useAuth } from '@/hooks/useAuth';

import { DashboardHeader } from '@/components/DashboardHeader';
import { StatsCard } from '@/components/StatsCard';

import {
  Inbox,
  Clock,
  Users,
  AlertTriangle,
} from 'lucide-react';

export default function LineManagerDashboard() {
  const { profile } = useAuth();
  const { data: allDrawings = [] } = useDrawings();

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

  const recentQueue = queue.slice(0, 5);

  return (
    <div className="flex flex-col h-full">

      <DashboardHeader
        title="Line Manager Dashboard"
        subtitle={`${profile?.full_name ?? ''} • Technical Review Overview`}
      />

      <div className="flex-1 overflow-auto p-6 space-y-6">

        {/* Top Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          <StatsCard
            title="In My Queue"
            value={queue.length}
            icon={Inbox}
            variant="wip"
          />

          <StatsCard
            title="Pending Dept Head"
            value={pendingDH.length}
            icon={Clock}
            variant="pending"
          />

          <StatsCard
            title="Overdue (>48h)"
            value={overdue.length}
            icon={AlertTriangle}
            variant="rejected"
          />

          <StatsCard
            title="Total Active"
            value={
              allDrawings.filter(
                (d) => d.status !== 'approved'
              ).length
            }
            icon={Users}
          />
        </div>

        {/* Dashboard Summary Section */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Queue Summary */}
          <div className="xl:col-span-2 rounded-xl border bg-card">

            <div className="border-b px-6 py-4">
              <div className="flex items-center justify-between">

                <div>
                  <h2 className="text-lg font-semibold">
                    Review Queue Summary
                  </h2>

                  <p className="text-sm text-muted-foreground mt-1">
                    Latest drawings awaiting technical review
                  </p>
                </div>

                <div className="text-sm text-muted-foreground">
                  Showing {Math.min(recentQueue.length, 5)} of {queue.length}
                </div>

              </div>
            </div>

            <div className="divide-y">

              {recentQueue.length > 0 ? (
                recentQueue.map((drawing) => (
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
                        Under Review
                      </span>

                    </div>

                  </div>
                ))
              ) : (
                <div className="py-16 text-center text-muted-foreground">
                  No drawings currently awaiting review.
                </div>
              )}

            </div>
          </div>

          {/* Review Insights */}
          <div className="rounded-xl border bg-card">

            <div className="border-b px-6 py-4">
              <h2 className="text-lg font-semibold">
                Review Insights
              </h2>

              <p className="text-sm text-muted-foreground mt-1">
                Current workflow overview
              </p>
            </div>

            <div className="p-6 space-y-5">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm font-medium">
                    Pending Technical Reviews
                  </p>

                  <p className="text-xs text-muted-foreground mt-1">
                    Drawings awaiting line manager action
                  </p>
                </div>

                <div className="text-2xl font-bold">
                  {queue.length}
                </div>

              </div>

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm font-medium">
                    Awaiting Dept Head
                  </p>

                  <p className="text-xs text-muted-foreground mt-1">
                    Approved and forwarded drawings
                  </p>
                </div>

                <div className="text-2xl font-bold">
                  {pendingDH.length}
                </div>

              </div>

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm font-medium">
                    Overdue Reviews
                  </p>

                  <p className="text-xs text-muted-foreground mt-1">
                    Reviews pending more than 48 hours
                  </p>
                </div>

                <div className="text-2xl font-bold text-red-500">
                  {overdue.length}
                </div>

              </div>

              <div className="pt-2 border-t">

                <p className="text-xs text-muted-foreground leading-relaxed">
                  Use the Review Queue module to review submitted
                  drawings, provide feedback, and forward approved
                  revisions to the Department Head.
                </p>

              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}