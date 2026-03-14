export type DrawingStatus = 'working' | 'under-review' | 'pending-dept-head' | 'approved' | 'rejected';

export type UserRole = 'designer' | 'line-manager' | 'dept-head' | 'site-engineer' | 'vendor-client';

export interface Drawing {
  id: string;
  drawingNo: string;
  designName: string;
  revision: number;
  date: string;
  status: DrawingStatus;
  designer: string;
  project: string;
  fileType: 'pdf' | 'cad' | 'both';
  rejectionComment?: string;
  reviewStarted?: string;
  approvedBy?: string;
  approvedDate?: string;
  stampApplied?: boolean;
}

export interface Notification {
  id: string;
  type: 'approval' | 'rejection' | 'submission' | 'info';
  message: string;
  timestamp: string;
  read: boolean;
  drawingId?: string;
}

export const mockDrawings: Drawing[] = [
  {
    id: '1',
    drawingNo: 'SLR-001',
    designName: 'Panel_Layout_Block_A',
    revision: 3,
    date: '2026-03-08',
    status: 'approved',
    designer: 'Rajesh Patel',
    project: 'Al Dhafra Solar 2GW',
    fileType: 'both',
    approvedBy: 'Dr. Sara Sharma',
    approvedDate: '2026-03-09',
    stampApplied: true,
  },
  {
    id: '2',
    drawingNo: 'SLR-002',
    designName: 'Inverter_Station_Detail',
    revision: 1,
    date: '2026-03-07',
    status: 'under-review',
    designer: 'Rajesh Patel',
    project: 'Al Dhafra Solar 2GW',
    fileType: 'both',
    reviewStarted: '2026-03-08',
  },
  {
    id: '3',
    drawingNo: 'SLR-003',
    designName: 'Cable_Tray_Routing',
    revision: 2,
    date: '2026-03-06',
    status: 'rejected',
    designer: 'Karan Singh',
    project: 'Al Dhafra Solar 2GW',
    fileType: 'pdf',
    rejectionComment: 'Cable tray dimensions do not meet IEC 61439 standards. Revise Section C clearances.',
  },
  {
    id: '4',
    drawingNo: 'SLR-004',
    designName: 'Foundation_Detail_Tracker',
    revision: 1,
    date: '2026-03-09',
    status: 'working',
    designer: 'Karan Singh',
    project: 'NEOM Solar Phase 1',
    fileType: 'cad',
  },
  {
    id: '5',
    drawingNo: 'SLR-005',
    designName: 'Substation_SLD',
    revision: 4,
    date: '2026-03-05',
    status: 'approved',
    designer: 'Raj Patel',
    project: 'NEOM Solar Phase 1',
    fileType: 'both',
    approvedBy: 'Dr. Sara Sharma',
    approvedDate: '2026-03-07',
    stampApplied: true,
  },
  {
    id: '6',
    drawingNo: 'SLR-006',
    designName: 'Grounding_Grid_Layout',
    revision: 1,
    date: '2026-03-10',
    status: 'pending-dept-head',
    designer: 'Raj Patel',
    project: 'Al Dhafra Solar 2GW',
    fileType: 'both',
    reviewStarted: '2026-03-09',
  },
  {
    id: '7',
    drawingNo: 'SLR-007',
    designName: 'AC_Collection_Network',
    revision: 2,
    date: '2026-03-04',
    status: 'approved',
    designer: 'Rajesh Kumar',
    project: 'NEOM Solar Phase 1',
    fileType: 'both',
    approvedBy: 'Dr. Sara Sharma',
    approvedDate: '2026-03-06',
    stampApplied: true,
  },
  {
    id: '8',
    drawingNo: 'SLR-008',
    designName: 'Transformer_Pad_Detail',
    revision: 1,
    date: '2026-03-10',
    status: 'under-review',
    designer: 'Karan Singh',
    project: 'Al Dhafra Solar 2GW',
    fileType: 'cad',
    reviewStarted: '2026-03-10',
  },
  {
    id: '9',
    drawingNo: 'SLR-009',
    designName: 'SCADA_Network_Diagram',
    revision: 1,
    date: '2026-03-09',
    status: 'working',
    designer: 'Raj Patel',
    project: 'NEOM Solar Phase 1',
    fileType: 'pdf',
  },
  {
    id: '10',
    drawingNo: 'SLR-010',
    designName: 'Perimeter_Fence_Layout',
    revision: 3,
    date: '2026-03-03',
    status: 'approved',
    designer: 'Rajesh Kumar',
    project: 'Al Dhafra Solar 2GW',
    fileType: 'both',
    approvedBy: 'Eng. Parth Sharma',
    approvedDate: '2026-03-05',
    stampApplied: true,
  },
];

export const mockNotifications: Notification[] = [
  { id: '1', type: 'approval', message: 'SLR-001 Panel_Layout_Block_A approved by Dr. Sara Sharma', timestamp: '2026-03-09T14:30:00', read: false },
  { id: '2', type: 'rejection', message: 'SLR-003 Cable_Tray_Routing rejected — clearances do not meet IEC 61439', timestamp: '2026-03-08T10:15:00', read: false },
  { id: '3', type: 'submission', message: 'SLR-006 Grounding_Grid_Layout submitted for Dept Head review', timestamp: '2026-03-09T09:00:00', read: true },
  { id: '4', type: 'approval', message: 'SLR-005 Substation_SLD approved by Dr. Sara Sharma', timestamp: '2026-03-07T16:45:00', read: true },
  { id: '5', type: 'info', message: 'SLR-008 Transformer_Pad_Detail is under technical review by Line Manager', timestamp: '2026-03-10T08:30:00', read: false },
  { id: '6', type: 'rejection', message: 'Line Manager notified: SLR-003 was rejected at Dept Head level', timestamp: '2026-03-08T10:16:00', read: true },
];

export const roleLabels: Record<UserRole, string> = {
  'designer': 'Designer',
  'line-manager': 'Line Manager',
  'dept-head': 'Dept Head',
  'site-engineer': 'Site Engineer',
  'vendor-client': 'Vendor / Client',
};

export const roleUsers: Record<UserRole, { name: string; title: string }> = {
  'designer': { name: 'Rajesh Patel', title: 'Senior CAD Designer' },
  'line-manager': { name: 'Eng. Parth Sharma', title: 'Design Line Manager' },
  'dept-head': { name: 'Dr. Sara Sharma', title: 'Engineering Dept Head' },
  'site-engineer': { name: 'Neelam Patil', title: 'Site Engineer' },
  'vendor-client': { name: 'SolarTech Corp.', title: 'EPC Contractor' },
};

export function getFileName(d: Drawing): string {
  return `${d.drawingNo}_${d.designName}_Rev${String(d.revision).padStart(2, '0')}_${d.date.replace(/-/g, '')}.${d.fileType === 'cad' ? 'dwg' : 'pdf'}`;
}

export function getAgingDays(dateStr: string): number {
  const diff = new Date().getTime() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}
