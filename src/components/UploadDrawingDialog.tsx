import { useState, useEffect, useRef, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { toast } from 'sonner';
import { Upload, FileText, FileCode, Hash, Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { DRAWING_TYPE_CODES, generateDrawingNumber } from '@/data/drawingCodes';
import { copyToArchive, getSiblingStoragePath } from '@/lib/storageUtils';

export function UploadDrawingDialog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- Form state ---
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedCode, setSelectedCode] = useState('');     // 'aa' segment
  const [designName, setDesignName] = useState('');         // free-text description
  const [fileType, setFileType] = useState<'pdf' | 'cad' | 'both'>('pdf');

  const pdfRef = useRef<HTMLInputElement>(null);
  const cadRef = useRef<HTMLInputElement>(null);

  // --- Derived: look up the selected project object ---
  const selectedProject = useMemo(
    () => projects.find(p => p.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
  );

  // --- Auto-generated document number (read-only preview) ---
  const drawingNo = useMemo(() => {
    if (!selectedCode || !selectedProject) return '';
    return generateDrawingNumber(selectedCode, selectedProject.project_number);
  }, [selectedCode, selectedProject]);

  // --- Reset all fields and close ---
  const resetAndClose = () => {
    setSelectedProjectId('');
    setSelectedCode('');
    setDesignName('');
    setFileType('pdf');
    if (pdfRef.current) pdfRef.current.value = '';
    if (cadRef.current) cadRef.current.value = '';
    setOpen(false);
  };

  // ── Fetch next expected revision for the badge preview ────────────────────
  // This is purely for display; actual logic runs on submit.
  const [expectedRevision, setExpectedRevision] = useState<number | null>(null);

  // Update expected revision whenever drawingNo changes
  const fetchExpectedRevision = async (dn: string, projNumber: string) => {
    const { data: working } = await supabase
      .from('drawings')
      .select('revision')
      .eq('drawing_no', dn)
      .eq('project_number', projNumber)
      .in('status', ['working', 'rejected'])
      .limit(1)
      .maybeSingle();
    if (working) { setExpectedRevision(working.revision); return; }

    const { data: approved } = await supabase
      .from('drawings')
      .select('revision')
      .eq('drawing_no', dn)
      .eq('project_number', projNumber)
      .eq('status', 'approved')
      .order('revision', { ascending: false })
      .limit(1)
      .maybeSingle();
    setExpectedRevision(approved ? approved.revision + 1 : 0);
  };

  // Trigger fetch when drawingNo or project change
  useEffect(() => {
    if (drawingNo && selectedProject) {
      fetchExpectedRevision(drawingNo, selectedProject.project_number);
    } else {
      setExpectedRevision(null);
    }
  }, [drawingNo, selectedProject?.id]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedProject) return;

    if (!drawingNo) {
      toast.error('Please select a project and drawing type to generate the document number.');
      return;
    }

    setLoading(true);

    try {
      const pdfFile = pdfRef.current?.files?.[0];
      const cadFile = cadRef.current?.files?.[0];

      if (!pdfFile && !cadFile) {
        toast.error('Please select at least one file.');
        setLoading(false);
        return;
      }

      // ── Step 1: Determine mode (overwrite vs new revision) ─────────────────
      //
      // BUSINESS RULE:
      //   working/rejected row exists  → OVERWRITE same revision (designer still owns it)
      //   only approved row exists     → CREATE next revision (R0→R1), archive approved
      //   no row at all               → CREATE R0

      // RLS Policy: "Designers can update own working drawings"
      // requires status = 'working' at time of UPDATE.
      // Only query working status to comply with RLS.
      const { data: existingWorkingRow } = await supabase
        .from('drawings')
        .select('id, revision, folder_path, file_type, status')
        .eq('drawing_no', drawingNo)
        .eq('project_number', selectedProject.project_number)
        .eq('status', 'working')
        .order('revision', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data: lastApprovedRow } = await supabase
        .from('drawings')
        .select('id, revision, folder_path, file_type')
        .eq('drawing_no', drawingNo)
        .eq('project_number', selectedProject.project_number)
        .eq('status', 'approved')
        .order('revision', { ascending: false })
        .limit(1)
        .maybeSingle();

      const isOverwrite = !!existingWorkingRow;
      const revisionNumber = isOverwrite
        ? existingWorkingRow!.revision
        : (lastApprovedRow?.revision ?? -1) + 1;

      const revStr = `R${revisionNumber}`;
      const primaryFile = pdfFile || cadFile!;
      const ext = primaryFile.name.split('.').pop()?.toLowerCase() ?? 'pdf';
      const storagePath = `${selectedProject.project_number}/working/${drawingNo}_${revStr}.${ext}`;
      const cadPath = pdfFile && cadFile
        ? `${selectedProject.project_number}/working/${drawingNo}_${revStr}.${cadFile.name.split('.').pop()?.toLowerCase() ?? 'dwg'}`
        : null;

      const cleanupNewFiles = async () => {
        const paths = [storagePath, cadPath].filter(Boolean) as string[];
        if (paths.length) await supabase.storage.from('drawing-files').remove(paths);
      };

      // ── Step 2 (overwrite only): remove old storage file if path changes ───
      // e.g. designer changed file extension, or a rejected row has stale path
      if (isOverwrite) {
        const oldPath = existingWorkingRow!.folder_path?.trim().replace(/^\/+/, '');
        if (oldPath && oldPath !== storagePath) {
          const { data: rmData } = await supabase.storage.from('drawing-files').remove([oldPath]);
          if (!rmData || rmData.length === 0) {
            console.warn('[Upload] Old file not found in storage (safe to continue):', oldPath);
          }
        }
      }

      // ── Step 3 (new revision only): archive old approved row ──────────────
      // ONLY runs when we are creating a brand-new revision after a prior approval.
      if (!isOverwrite && lastApprovedRow?.folder_path) {
        try {
          const archivePath = await copyToArchive(lastApprovedRow.folder_path);

          if (lastApprovedRow.file_type === 'both') {
            const siblingPath = getSiblingStoragePath(lastApprovedRow.folder_path);
            if (siblingPath) {
              try { await copyToArchive(siblingPath); }
              catch (sibErr: any) {
                if (/download|404|not found/i.test(String(sibErr.message))) {
                  console.warn('[Upload] Sibling CAD not found for archive (skipping):', siblingPath);
                } else throw sibErr;
              }
            }
          }

          const { error: archiveDbErr } = await supabase
            .from('drawings')
            .update({ status: 'archived' as any, archived_at: new Date().toISOString(), folder_path: archivePath })
            .eq('id', lastApprovedRow.id);

          if (archiveDbErr) throw new Error(`Archive DB update failed: ${archiveDbErr.message}`);
        } catch (archiveErr: any) {
          throw new Error(`Could not archive previous approved revision: ${archiveErr.message}`);
        }
      }

      // ── Step 4: Upload file(s) to storage ─────────────────────────────────
      const { error: uploadErr } = await supabase.storage
        .from('drawing-files')
        .upload(storagePath, primaryFile, { upsert: true });
      if (uploadErr) throw new Error('File upload failed: ' + uploadErr.message);

      if (cadPath && pdfFile && cadFile) {
        const { error: cadErr } = await supabase.storage
          .from('drawing-files')
          .upload(cadPath, cadFile, { upsert: true });
        if (cadErr) {
          await cleanupNewFiles();
          throw new Error('CAD upload failed: ' + cadErr.message);
        }
      }

      // ── Step 5: Determine file type ────────────────────────────────────────
      const actualFileType: 'pdf' | 'cad' | 'both' =
        pdfFile && cadFile ? 'both' : cadFile ? 'cad' : 'pdf';

      const { data: urlData } = supabase.storage
        .from('drawing-files')
        .getPublicUrl(storagePath);

      // ── Step 6: DB — UPDATE existing row OR INSERT new row ────────────────
      if (isOverwrite) {
        // In-place update: same revision, same DB row — just refresh file metadata.
        // Also resets status from 'rejected' → 'working' if designer is re-uploading.
        const { error: updateErr } = await supabase
          .from('drawings')
          .update({
            file_url:    urlData.publicUrl,
            file_name:   primaryFile.name,
            folder_path: storagePath,
            file_type:   actualFileType,
            status:      'working' as any,
          })
          .eq('id', existingWorkingRow!.id);

        if (updateErr) {
          await cleanupNewFiles();
          throw new Error('Database update failed: ' + updateErr.message);
        }
      } else {
        // New revision: INSERT a fresh row.
        const { error: insertErr } = await supabase.from('drawings').insert({
          drawing_no:     drawingNo,
          design_name:    designName,
          project:        selectedProject.name,
          project_number: selectedProject.project_number,
          drawing_code:   selectedCode,
          file_type:      actualFileType,
          file_url:       urlData.publicUrl,
          file_name:      primaryFile.name,
          folder_path:    storagePath,
          designer_id:    user.id,
          status:         'working' as any,
          revision:       revisionNumber,
        });

        if (insertErr) {
          await cleanupNewFiles();
          throw new Error('Database insert failed: ' + insertErr.message);
        }
      }

      const successMsg = isOverwrite
        ? `${drawingNo} — ${revStr} draft updated`
        : revisionNumber === 0
          ? `${drawingNo} — R0 uploaded successfully`
          : `${drawingNo} — ${revStr} created (R${revisionNumber - 1} archived)`;

      toast.success(successMsg);
      queryClient.invalidateQueries({ queryKey: ['drawings'] });
      resetAndClose();

    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
      console.error('[Upload] Error:', err);
    } finally {
      setLoading(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetAndClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Upload className="h-4 w-4 mr-2" /> Upload Drawing
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload New Drawing</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleUpload} className="space-y-4">

          {/* ── Project selector ── */}
          <div className="space-y-2">
            <Label htmlFor="project-select">Project</Label>
            <Select
              value={selectedProjectId}
              onValueChange={setSelectedProjectId}
              disabled={projectsLoading}
            >
              <SelectTrigger id="project-select">
                <SelectValue placeholder={projectsLoading ? 'Loading projects…' : 'Select project'} />
              </SelectTrigger>
              <SelectContent>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="font-mono text-xs text-muted-foreground mr-2">[{p.project_number}]</span>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ── Drawing type code selector ── */}
          <div className="space-y-2">
            <Label htmlFor="code-select">Drawing Type</Label>
            <Select value={selectedCode} onValueChange={setSelectedCode}>
              <SelectTrigger id="code-select">
                <SelectValue placeholder="Select discipline / type" />
              </SelectTrigger>
              <SelectContent>
                {DRAWING_TYPE_CODES.map(c => (
                  <SelectItem key={c.code} value={c.code}>
                    <span className="font-mono text-xs text-muted-foreground mr-2">{c.code}</span>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ── Auto-generated document number (read-only) ── */}
          <div className="space-y-2">
            <Label>Generated Document Number</Label>
            <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2 min-h-[36px]">
              <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
              {drawingNo ? (
                <span className="font-mono text-sm font-semibold tracking-wide">{drawingNo}</span>
              ) : (
                <span className="text-sm text-muted-foreground italic">
                  Select project and drawing type above
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Format: <span className="font-mono">GM-RT-DWG-[type]-[project]-[year]</span>
            </p>
          </div>

          {/* ── Design / drawing description ── */}
          <div className="space-y-2">
            <Label htmlFor="designName">Design Description</Label>
            <Input
              id="designName"
              value={designName}
              onChange={e => setDesignName(e.target.value)}
              placeholder="e.g. Panel Layout Block B, Inverter Station Detail"
              required
            />
            <p className="text-[11px] text-muted-foreground">
              This is the human-readable title — not part of the document number.
            </p>
          </div>

          {/* ── File type selector ── */}
          <div className="space-y-2">
            <Label>File Type</Label>
            <Select value={fileType} onValueChange={v => setFileType(v as 'pdf' | 'cad' | 'both')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" /> PDF Only
                  </div>
                </SelectItem>
                <SelectItem value="cad">
                  <div className="flex items-center gap-2">
                    <FileCode className="h-4 w-4" /> CAD Only (.dwg / .dxf)
                  </div>
                </SelectItem>
                <SelectItem value="both">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <FileCode className="h-4 w-4" /> Both PDF + CAD
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ── File inputs (conditional on file type) ── */}
          {(fileType === 'pdf' || fileType === 'both') && (
            <div className="space-y-2">
              <Label>PDF File</Label>
              <Input ref={pdfRef} type="file" accept=".pdf" required={fileType === 'pdf'} />
            </div>
          )}
          {(fileType === 'cad' || fileType === 'both') && (
            <div className="space-y-2">
              <Label>CAD File (.dwg / .dxf)</Label>
              <Input ref={cadRef} type="file" accept=".dwg,.dxf" required={fileType === 'cad'} />
            </div>
          )}

          {/* ── Revision preview badge ── */}
          {drawingNo && (
            <div className="rounded-md border border-dashed p-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Will be uploaded as:</span>
              <Badge variant="outline" className="font-mono">
                {expectedRevision !== null ? `${drawingNo}_R${expectedRevision}` : `${drawingNo}_R…`}
              </Badge>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !drawingNo || !designName}
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading…</>
            ) : (
              <><Upload className="h-4 w-4 mr-2" /> Upload Drawing</>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
