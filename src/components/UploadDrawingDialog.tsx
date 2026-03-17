import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Upload, FileText, FileCode } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export function UploadDrawingDialog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [drawingNo, setDrawingNo] = useState('');
  const [designName, setDesignName] = useState('');
  const [project, setProject] = useState('');
  const [fileType, setFileType] = useState<'pdf' | 'cad' | 'both'>('pdf');
  const pdfRef = useRef<HTMLInputElement>(null);
  const cadRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const pdfFile = pdfRef.current?.files?.[0];
      const cadFile = cadRef.current?.files?.[0];

      if (!pdfFile && !cadFile) {
        toast.error('Please select at least one file');
        setLoading(false);
        return;
      }

      let fileUrl = '';
      let fileName = '';

      // Upload the primary file (PDF preferred for display)
      const primaryFile = pdfFile || cadFile!;
      const ext = primaryFile.name.split('.').pop();
      const path = `${user.id}/${drawingNo}_${designName}_Rev01_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('drawing-files')
        .upload(path, primaryFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('drawing-files').getPublicUrl(path);
      fileUrl = urlData.publicUrl;
      fileName = primaryFile.name;

      // If both files, upload the second
      if (pdfFile && cadFile) {
        const cadExt = cadFile.name.split('.').pop();
        const cadPath = `${user.id}/${drawingNo}_${designName}_Rev01_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.${cadExt}`;
        await supabase.storage.from('drawing-files').upload(cadPath, cadFile, { upsert: true });
      }

      // Determine actual file type
      let actualFileType: 'pdf' | 'cad' | 'both' = fileType;
      if (pdfFile && cadFile) actualFileType = 'both';
      else if (cadFile) actualFileType = 'cad';
      else actualFileType = 'pdf';

      // Insert drawing record
      const { error: insertError } = await supabase.from('drawings').insert({
        drawing_no: drawingNo,
        design_name: designName,
        project,
        file_type: actualFileType,
        file_url: fileUrl,
        file_name: fileName,
        designer_id: user.id,
        status: 'working',
        revision: 1,
      });

      if (insertError) throw insertError;

      toast.success('Drawing uploaded successfully');
      queryClient.invalidateQueries({ queryKey: ['drawings'] });
      setOpen(false);
      setDrawingNo('');
      setDesignName('');
      setProject('');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
          <div className="space-y-2">
            <Label htmlFor="drawingNo">Drawing Number</Label>
            <Input id="drawingNo" value={drawingNo} onChange={e => setDrawingNo(e.target.value)} placeholder="SLR-011" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="designName">Design Name</Label>
            <Input id="designName" value={designName} onChange={e => setDesignName(e.target.value)} placeholder="Panel_Layout_Block_B" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="project">Project</Label>
            <Input id="project" value={project} onChange={e => setProject(e.target.value)} placeholder="Al Dhafra Solar 2GW" required />
          </div>
          <div className="space-y-2">
            <Label>File Type</Label>
            <Select value={fileType} onValueChange={v => setFileType(v as 'pdf' | 'cad' | 'both')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf"><div className="flex items-center gap-2"><FileText className="h-4 w-4" /> PDF Only</div></SelectItem>
                <SelectItem value="cad"><div className="flex items-center gap-2"><FileCode className="h-4 w-4" /> CAD Only (.dwg)</div></SelectItem>
                <SelectItem value="both"><div className="flex items-center gap-2"><FileText className="h-4 w-4" /><FileCode className="h-4 w-4" /> Both</div></SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(fileType === 'pdf' || fileType === 'both') && (
            <div className="space-y-2">
              <Label>PDF File</Label>
              <Input ref={pdfRef} type="file" accept=".pdf" required={fileType === 'pdf'} />
            </div>
          )}
          {(fileType === 'cad' || fileType === 'both') && (
            <div className="space-y-2">
              <Label>CAD File (.dwg)</Label>
              <Input ref={cadRef} type="file" accept=".dwg,.dxf" required={fileType === 'cad'} />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Uploading...' : 'Upload Drawing'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
