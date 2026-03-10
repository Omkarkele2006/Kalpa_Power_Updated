import { Drawing, getFileName, getAgingDays } from '@/data/mockData';
import { StatusBadge } from './StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, FileCode, Clock } from 'lucide-react';

interface DrawingTableProps {
  drawings: Drawing[];
  showDesigner?: boolean;
  showAging?: boolean;
  showActions?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export function DrawingTable({ drawings, showDesigner = true, showAging = false, showActions = false, onApprove, onReject }: DrawingTableProps) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Drawing</TableHead>
            <TableHead className="font-semibold">Project</TableHead>
            {showDesigner && <TableHead className="font-semibold">Designer</TableHead>}
            <TableHead className="font-semibold">Rev</TableHead>
            <TableHead className="font-semibold">Type</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            {showAging && <TableHead className="font-semibold">Aging</TableHead>}
            {showActions && <TableHead className="font-semibold text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {drawings.map((d) => (
            <TableRow key={d.id} className="animate-fade-in hover:bg-muted/30 transition-colors">
              <TableCell>
                <div>
                  <span className="font-mono text-sm font-medium">{d.drawingNo}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">{d.designName.replace(/_/g, ' ')}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{getFileName(d)}</p>
                </div>
              </TableCell>
              <TableCell className="text-sm">{d.project}</TableCell>
              {showDesigner && <TableCell className="text-sm">{d.designer}</TableCell>}
              <TableCell className="font-mono text-sm">R{d.revision}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-muted-foreground">
                  {d.fileType === 'cad' ? <FileCode className="h-4 w-4" /> : d.fileType === 'pdf' ? <FileText className="h-4 w-4" /> : (
                    <><FileText className="h-3.5 w-3.5" /><FileCode className="h-3.5 w-3.5" /></>
                  )}
                </div>
              </TableCell>
              <TableCell><StatusBadge status={d.status} /></TableCell>
              {showAging && (
                <TableCell>
                  {d.reviewStarted && (
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className={getAgingDays(d.reviewStarted) > 2 ? 'text-status-rejected font-medium' : 'text-muted-foreground'}>
                        {getAgingDays(d.reviewStarted)}d
                      </span>
                    </div>
                  )}
                </TableCell>
              )}
              {showActions && (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {onApprove && (
                      <button onClick={() => onApprove(d.id)} className="rounded-md bg-status-approved px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity">
                        Approve
                      </button>
                    )}
                    {onReject && (
                      <button onClick={() => onReject(d.id)} className="rounded-md bg-status-rejected px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity">
                        Reject
                      </button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
          {drawings.length === 0 && (
            <TableRow>
              <TableCell colSpan={10} className="py-12 text-center text-muted-foreground">No drawings found</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
