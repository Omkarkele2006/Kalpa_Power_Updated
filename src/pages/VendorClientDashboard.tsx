import { mockDrawings } from '@/data/mockData';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DrawingTable } from '@/components/DrawingTable';
import { Shield, FileCheck } from 'lucide-react';
import { StatsCard } from '@/components/StatsCard';

export default function VendorClientDashboard() {
  const finalApproved = mockDrawings.filter(d => d.status === 'approved' && d.stampApplied);
  const projects = [...new Set(finalApproved.map(d => d.project))];

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader title="External Portal" subtitle="SolarTech Corp. • Guest Access" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="rounded-lg border border-status-wip/30 bg-status-wip-bg p-4 flex items-start gap-3">
          <Shield className="h-5 w-5 text-status-wip shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-status-wip">Restricted Access</p>
            <p className="text-muted-foreground mt-0.5">You are viewing final approved milestone documents only. All documents are stamped and read-only.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatsCard title="Final Documents" value={finalApproved.length} icon={FileCheck} variant="approved" />
          <StatsCard title="Projects" value={projects.length} icon={Shield} />
        </div>

        {projects.map(project => (
          <div key={project}>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">{project}</h2>
            <DrawingTable drawings={finalApproved.filter(d => d.project === project)} showDesigner={false} />
          </div>
        ))}
      </div>
    </div>
  );
}
