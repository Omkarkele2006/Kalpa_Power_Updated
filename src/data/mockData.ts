export type UserRole = 'designer' | 'line-manager' | 'dept-head' | 'site-engineer' | 'vendor-client';

export type DrawingStatus = 'working' | 'under-review' | 'pending-dept-head' | 'approved' | 'rejected' | 'archived';

export interface Drawing {
  id: string;
  drawing_no: string;       // e.g. GM-RT-DWG-02-0011-2026
  design_name: string;      // human-readable description
  revision: number;         // 0-based: R0, R1, R2…
  created_at: string;
  status: DrawingStatus;
  profiles?: { full_name: string } | null;  // joined from profiles table
  project: string;          // full project name
  project_number?: string | null;  // XXXX segment e.g. '0011'
  drawing_code?: string | null;    // aa segment e.g. '02'
  file_url: string | null;
  file_type: 'pdf' | 'cad' | 'both' | null;
  file_name?: string | null;
  folder_path?: string | null;     // Supabase storage path for signed URL / archive move
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

