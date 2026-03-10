import { useState } from 'react';
import { mockDrawings, getFileName } from '@/data/mockData';
import { DashboardHeader } from '@/components/DashboardHeader';
import { DrawingTable } from '@/components/DrawingTable';
import { Input } from '@/components/ui/input';
import { Search, QrCode, CheckCircle, XCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function SiteEngineerDashboard() {
  const approved = mockDrawings.filter(d => d.status === 'approved');
  const [search, setSearch] = useState('');
  const [qrInput, setQrInput] = useState('');
  const [qrResult, setQrResult] = useState<'latest' | 'outdated' | null>(null);

  const filtered = approved.filter(d =>
    d.drawingNo.toLowerCase().includes(search.toLowerCase()) ||
    d.designName.toLowerCase().includes(search.toLowerCase())
  );

  const handleQrCheck = () => {
    const found = approved.find(d => getFileName(d).includes(qrInput) || d.drawingNo === qrInput.toUpperCase());
    setQrResult(found ? 'latest' : 'outdated');
  };

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader title="Approved Documents" subtitle="Omar Al-Farsi • Site Engineer" />
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search approved drawings..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <DrawingTable drawings={filtered} showDesigner={false} />
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border bg-card p-5">
              <h3 className="flex items-center gap-2 text-sm font-semibold mb-3">
                <QrCode className="h-4 w-4" /> QR Version Verify
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Scan or enter drawing number to verify if a printed copy is the latest version.
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. SLR-001"
                  value={qrInput}
                  onChange={e => { setQrInput(e.target.value); setQrResult(null); }}
                  className="text-sm"
                />
                <button onClick={handleQrCheck} className="shrink-0 rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity">
                  Verify
                </button>
              </div>
              {qrResult && (
                <div className={`mt-3 flex items-center gap-2 rounded-lg p-3 text-sm font-medium ${
                  qrResult === 'latest' ? 'status-approved' : 'status-rejected'
                }`}>
                  {qrResult === 'latest' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                  {qrResult === 'latest' ? 'This is the latest approved version.' : 'This version may be outdated or not found.'}
                </div>
              )}
            </div>

            {approved.length > 0 && (
              <div className="rounded-lg border bg-card p-5">
                <h3 className="text-sm font-semibold mb-3">Sample QR Code</h3>
                <p className="text-xs text-muted-foreground mb-3">
                  QR for: {getFileName(approved[0])}
                </p>
                <div className="flex justify-center rounded-lg bg-card p-4">
                  <QRCodeSVG
                    value={`DOCCTRL:${approved[0].drawingNo}:R${approved[0].revision}:${approved[0].date}`}
                    size={140}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
