import { StatusBadge } from './StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, FileCode, Clock } from 'lucide-react';
import type { ReactNode } from 'react';
import {Button} from '@/components/ui/button';
import { Download } from 'lucide-react';
import { getSignedUrl } from '@/lib/storageUtils';

interface DrawingRow {
  id: string;
  drawing_no: string;
  design_name: string;
  revision: number;
  project: string;
  status: string;
  file_type: string | null;
  review_started: string | null;
  created_at: string;
  designer_id: string;
  profiles?: { full_name: string } | null;
  [key: string]: any;
  file_url: string | null;
  folder_path?: string | null;
  stamp_applied: boolean;
}

interface DrawingTableProps {
  drawings: DrawingRow[];
  showDesigner?: boolean;
  showAging?: boolean;
  renderActions?: (d: DrawingRow) => ReactNode;
}

function getAgingDays(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export function DrawingTable({ drawings, showDesigner = true, showAging = false, renderActions }: DrawingTableProps) {
  const openStorageFile = async (storagePath: string | null | undefined, fallbackUrl: string | null | undefined) => {
    const targetUrl = storagePath ? await getSignedUrl(storagePath) : fallbackUrl;
    if (!targetUrl) {
      console.error('[DrawingTable] No file URL available to open');
      return;
    }

    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.location.href = targetUrl;
    }
  };

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
            {(renderActions || drawings.some(d => d.folder_path || d.file_url)) && <TableHead className="font-semibold text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {drawings.map((d) => {
            const hasFile = !!d.folder_path || !!d.file_url;
            const fileLabel = d.status === 'approved'
              ? d.stamp_applied ? 'View Stamped' : 'View Approved'
              : 'Preview';

            return (
              <TableRow key={d.id} className="animate-fade-in hover:bg-muted/30 transition-colors">
                <TableCell>
                  <div>
                    <span className="font-mono text-sm font-medium">{d.drawing_no}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{d.design_name.replace(/_/g, ' ')}</p>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{d.project}</TableCell>
                {showDesigner && <TableCell className="text-sm">{d.profiles?.full_name ?? '—'}</TableCell>}
                <TableCell className="font-mono text-sm">R{d.revision}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    {d.file_type === 'cad' ? <FileCode className="h-4 w-4" /> : d.file_type === 'pdf' ? <FileText className="h-4 w-4" /> : (
                      <><FileText className="h-3.5 w-3.5" /><FileCode className="h-3.5 w-3.5" /></>
                    )}
                  </div>
                </TableCell>
                <TableCell><StatusBadge status={d.status as any} /></TableCell>
                {showAging && (
                  <TableCell>
                    {d.review_started && (
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className={getAgingDays(d.review_started) > 2 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
                          {getAgingDays(d.review_started)}d
                        </span>
                      </div>
                    )}
                  </TableCell>
                )}
                {(renderActions || hasFile) && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {hasFile && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openStorageFile(d.folder_path, d.file_url)}
                          disabled={!d.folder_path && !d.file_url}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          {fileLabel}
                        </Button>
                      )}
                      {renderActions?.(d)}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
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
