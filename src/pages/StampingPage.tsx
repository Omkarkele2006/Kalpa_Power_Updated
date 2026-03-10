import { mockDrawings, getFileName } from '@/data/mockData';
import { DashboardHeader } from '@/components/DashboardHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { Stamp, FileText, FileCode, CheckCircle } from 'lucide-react';

export default function StampingPage() {
  const approved = mockDrawings.filter(d => d.status === 'approved');

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader title="Stamping & Release" subtitle="PDF stamping and CAD metadata updates" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PDF Stamping */}
          <div className="rounded-lg border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-status-approved" />
              <h3 className="font-semibold">PDF Stamping</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Upon approval, an "APPROVED" stamp overlay is applied to the PDF with date, approver name, and project reference. Uses transparent PNG overlay via document processing.
            </p>
            <div className="rounded-lg border-2 border-dashed border-status-approved/30 bg-status-approved-bg p-6 text-center">
              <div className="inline-flex flex-col items-center gap-2">
                <div className="rounded-lg border-2 border-status-approved p-4">
                  <Stamp className="h-10 w-10 text-status-approved" />
                </div>
                <p className="text-xs font-bold text-status-approved uppercase tracking-wider">APPROVED</p>
                <p className="text-[10px] text-muted-foreground">Dr. Sara Al-Rashid • 2026-03-09</p>
                <p className="text-[10px] text-muted-foreground">Al Dhafra Solar 2GW</p>
              </div>
            </div>
          </div>

          {/* CAD Metadata */}
          <div className="rounded-lg border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileCode className="h-5 w-5 text-status-wip" />
              <h3 className="font-semibold">CAD Title Block Update</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              CAD (.dwg) files are updated via AutoLISP script to set the Title Block "Status" attribute to "APPROVED" and populate "Approved By" field.
            </p>
            <div className="rounded-lg bg-muted p-4 font-mono text-xs space-y-1">
              <p className="text-muted-foreground">; AutoLISP Title Block Update</p>
              <p>(setq status_attr <span className="text-status-approved">"APPROVED"</span>)</p>
              <p>(setq approved_by <span className="text-status-wip">"Dr. Sara Al-Rashid"</span>)</p>
              <p>(setq approval_date <span className="text-status-pending">"2026-03-09"</span>)</p>
              <p>(command "ATTEDIT" "Y" "" "" "" ...)</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Stamped Documents</h2>
          <div className="rounded-lg border bg-card divide-y">
            {approved.map(d => (
              <div key={d.id} className="flex items-center justify-between p-4 animate-fade-in">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-status-approved" />
                  <div>
                    <p className="text-sm font-medium font-mono">{d.drawingNo} — {d.designName.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-muted-foreground">{getFileName(d)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <StatusBadge status={d.status} />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {d.stampApplied ? '✓ Stamp applied' : 'Pending stamp'}
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
