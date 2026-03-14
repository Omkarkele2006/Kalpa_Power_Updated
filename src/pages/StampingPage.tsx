import { useDrawings } from '@/hooks/useDrawings';
import { DashboardHeader } from '@/components/DashboardHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { Stamp, FileText, FileCode, CheckCircle } from 'lucide-react';

export default function StampingPage() {
  const { data: allDrawings = [] } = useDrawings();
  const approved = allDrawings.filter(d => d.status === 'approved');

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader title="Stamping & Release" subtitle="PDF stamping and CAD metadata updates" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-lg border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-[hsl(var(--status-approved))]" />
              <h3 className="font-semibold">PDF Stamping</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Upon approval, an "APPROVED" stamp overlay is applied to the PDF with date, approver name, and project reference.
            </p>
            <div className="rounded-lg border-2 border-dashed border-[hsl(var(--status-approved))]/30 bg-[hsl(var(--status-approved-bg))] p-6 text-center">
              <div className="inline-flex flex-col items-center gap-2">
                <div className="rounded-lg border-2 border-[hsl(var(--status-approved))] p-4">
                  <Stamp className="h-10 w-10 text-[hsl(var(--status-approved))]" />
                </div>
                <p className="text-xs font-bold text-[hsl(var(--status-approved))] uppercase tracking-wider">APPROVED</p>
                <p className="text-[10px] text-muted-foreground">Stamp applied automatically on Dept Head approval</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileCode className="h-5 w-5 text-[hsl(var(--status-wip))]" />
              <h3 className="font-semibold">CAD Title Block Update</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              CAD (.dwg) files are updated via AutoLISP script to set the Title Block "Status" attribute.
            </p>
            <div className="rounded-lg bg-muted p-4 font-mono text-xs space-y-1">
              <p className="text-muted-foreground">; AutoLISP Title Block Update</p>
              <p>(setq status_attr <span className="text-[hsl(var(--status-approved))]">"APPROVED"</span>)</p>
              <p>(setq approved_by <span className="text-[hsl(var(--status-wip))]">"Dept Head Name"</span>)</p>
              <p>(setq approval_date <span className="text-[hsl(var(--status-pending))]">"2026-03-09"</span>)</p>
              <p>(command "ATTEDIT" "Y" "" "" "" ...)</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Stamped Documents</h2>
          <div className="rounded-lg border bg-card divide-y">
            {approved.length === 0 && (
              <p className="p-8 text-center text-muted-foreground text-sm">No stamped documents yet</p>
            )}
            {approved.map(d => (
              <div key={d.id} className="flex items-center justify-between p-4 animate-fade-in">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-[hsl(var(--status-approved))]" />
                  <div>
                    <p className="text-sm font-medium font-mono">{d.drawing_no} — {d.design_name.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-muted-foreground">{d.file_name ?? 'No file'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <StatusBadge status={d.status} />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {d.stamp_applied ? '✓ Stamp applied' : 'Pending stamp'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
