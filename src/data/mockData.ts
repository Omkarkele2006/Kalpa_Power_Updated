export type UserRole = 'designer' | 'line-manager' | 'dept-head' | 'site-engineer' | 'vendor-client';

export type DrawingStatus = 'working' | 'under-review' | 'pending-dept-head' | 'approved' | 'rejected' | 'archived';

export interface Drawing {
  id: string;
  drawing_no: string;       // was: drawingNo
  design_name: string;      // was: designName
  revision: number;
  created_at: string;       // was: date
  status: DrawingStatus;
  profiles?: { full_name: string } | null;  // joined from profiles table
  project: string;
  file_url: string | null;
  file_type: 'pdf' | 'cad' | 'both' | null;  // was: fileType
  file_name?: string | null;
  rejection_comment?: string;
  review_started?: string | null;
  approved_by?: string | null;
  approved_date?: string | null;
  stamp_applied: boolean;
  designer_id: string;
  archived_at?: string | null;
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
    designer_id: 'mock-user-1',
    id: '1',
    drawing_no: 'SLR-001',
    design_name: 'Panel_Layout_Block_A',
    revision: 3,
    created_at: '2026-03-08',
    status: 'approved',
    profiles:{full_name: 'Rajesh Patel'},
    project: 'Al Dhafra Solar 2GW',
    file_url: 'https://example.com/drawings/SLR-001.pdf',
    file_type: 'both',
    approved_by: 'Dr. Sara Sharma',
    approved_date: '2026-03-09',
    stamp_applied: true,
  },
  {
    designer_id: 'mock-user-2',
    id: '2',
    drawing_no: 'SLR-002',
    design_name: 'Inverter_Station_Detail',
    revision: 1,
    created_at: '2026-03-07',
    status: 'under-review',
    profiles:{full_name: 'Rajesh Patel'},
    project: 'Al Dhafra Solar 2GW',
    file_url: 'https://example.com/drawings/SLR-002.pdf',
    file_type: 'both',
    review_started: '2026-03-08',
    stamp_applied:false,
  },
  {
    designer_id: 'mock-user-3',
    id: '3',
    drawing_no: 'SLR-003',
    design_name: 'Cable_Tray_Routing',
    revision: 2,
    created_at: '2026-03-06',
    status: 'rejected',
    profiles:{full_name: 'Karan Singh'},
    project: 'Al Dhafra Solar 2GW',
        file_url: 'https://example.com/drawings/SLR-003.pdf',
    file_type: 'pdf',
    rejection_comment: 'Cable tray dimensions do not meet IEC 61439 standards. Revise Section C clearances.',
    stamp_applied:false
  },
  {
    designer_id: 'mock-user-4',
    id: '4',
    drawing_no: 'SLR-004',
    design_name: 'Foundation_Detail_Tracker',
    revision: 1,
    created_at: '2026-03-09',
    status: 'working',
    profiles:{full_name: 'Karan Singh'},
    project: 'NEOM Solar Phase 1',
    file_url: 'https://example.com/drawings/SLR-004.pdf',
    file_type: 'cad',
    stamp_applied:false,
  },
  {
    designer_id: 'mock-user-5',
    id: '5',
    drawing_no: 'SLR-005',
    design_name: 'Substation_SLD',
    revision: 4,
    created_at: '2026-03-05',
    status: 'approved',
    profiles:{full_name: 'Raj Patel'},
    project: 'NEOM Solar Phase 1',
    file_url:'https://example.com/drawings/SLR-006.pdf',

    file_type: 'both',
    approved_by: 'Dr. Sara Sharma',
    approved_date: '2026-03-07',
    stamp_applied: true,
  },
  {
    designer_id: 'mock-user-6',
    id: '6',
    drawing_no: 'SLR-006',
    design_name: 'Grounding_Grid_Layout',
    revision: 1,
    created_at: '2026-03-10',
    status: 'pending-dept-head',
    profiles:{full_name: 'Raj Patel'},
    project: 'Al Dhafra Solar 2GW',
    file_url: 'https://example.com/drawings/SLR-007.pdf',

    file_type: 'both',
    review_started: '2026-03-09',
    stamp_applied:false,
  },
  {
    designer_id: 'mock-user-7',
    id: '7',
    drawing_no: 'SLR-007',
    design_name: 'AC_Collection_Network',
    revision: 2,
    created_at: '2026-03-04',
    status: 'approved',
    profiles:{full_name: 'Rajesh Kumar'},
    project: 'NEOM Solar Phase 1',
    file_url: 'https://example.com/drawings/SLR-008.pdf',
    file_type: 'both',
    approved_by: 'Dr. Sara Sharma',
    approved_date: '2026-03-06',
    stamp_applied: true,
  },
  {
    designer_id: 'mock-user-8',
    id: '8',
    drawing_no: 'SLR-008',
    design_name: 'Transformer_Pad_Detail',
    revision: 1,
    created_at: '2026-03-10',
    status: 'under-review',
    profiles:{full_name: 'Karan Singh'},
    project: 'Al Dhafra Solar 2GW',
    file_url:'https://example.com/drawings/SLR-009.pdf',

    file_type: 'cad',
    review_started: '2026-03-10',
    stamp_applied: false,
  },
  {
    designer_id: 'mock-user-8',
    id: '9',
    drawing_no: 'SLR-009',
    design_name: 'SCADA_Network_Diagram',
    revision: 1,
    created_at: '2026-03-09',
    status: 'working',
    profiles:{full_name: 'Raj Patel'},
    project: 'NEOM Solar Phase 1',
    file_url:'https://example.com/drawings/SLR-0010.pdf',

    file_type: 'pdf',
    stamp_applied: false,
  },
  {
    designer_id: 'mock-user-8',
    id: '10',
    drawing_no: 'SLR-010',
    design_name: 'Perimeter_Fence_Layout',
    revision: 3,
    created_at: '2026-03-03',
    status: 'approved',
    profiles:{full_name: 'Rajesh Kumar'},
    project: 'Al Dhafra Solar 2GW',
    file_url:'https://example.com/drawings/SLR-0011.pdf',
    file_type: 'both',
    approved_by: 'Eng. Parth Sharma',
    approved_date: '2026-03-05',
    stamp_applied: true,
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
  return `${d.drawing_no}_${d.design_name}_Rev${String(d.revision).padStart(2, '0')}_${d.created_at.replace(/-/g, '')}.${d.file_type === 'cad' ? 'dwg' : 'pdf'}`;
}

export function getAgingDays(dateStr: string): number {
  const diff = new Date().getTime() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}
