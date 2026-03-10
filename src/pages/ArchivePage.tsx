import { useState } from 'react';
import { mockDrawings } from '@/data/mockData';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DrawingTable } from '@/components/DrawingTable';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function ArchivePage() {
  const [search, setSearch] = useState('');
  const archived = mockDrawings.filter(d => d.status === 'approved');
  const filtered = archived.filter(d =>
    d.drawingNo.toLowerCase().includes(search.toLowerCase()) ||
    d.designName.toLowerCase().includes(search.toLowerCase()) ||
    d.project.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader title="Archive" subtitle="Historical revisions and approved documents" />
      <div className="flex-1 overflow-auto p-6 space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search archive..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <DrawingTable drawings={filtered} />
      </div>
    </div>
  );
}
