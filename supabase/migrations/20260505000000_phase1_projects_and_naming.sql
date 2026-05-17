-- ============================================================
-- Phase 1 Migration: Projects table + Drawing naming columns
-- ============================================================

-- 1. Extend drawing_status enum to include 'archived'
--    (ALTER TYPE ADD VALUE is not transactional, must run outside a transaction block)
ALTER TYPE public.drawing_status ADD VALUE IF NOT EXISTS 'archived';

-- 2. Create projects lookup table
CREATE TABLE public.projects (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT        NOT NULL,
  project_number TEXT        UNIQUE NOT NULL,  -- the 'XXXX' in GM-RT-DWG-aa-XXXX-YYYY
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read projects (needed for the dropdown)
CREATE POLICY "Authenticated users can view projects"
  ON public.projects FOR SELECT TO authenticated USING (true);

-- Only dept-heads can create/edit projects
CREATE POLICY "Dept heads can manage projects"
  ON public.projects FOR ALL TO authenticated
  USING     (public.has_role(auth.uid(), 'dept-head'))
  WITH CHECK (public.has_role(auth.uid(), 'dept-head'));

-- 3. Seed sample projects (replace with real Kalpa data later)
INSERT INTO public.projects (name, project_number) VALUES
  ('Al Dhafra Solar 2GW', '0011'),
  ('NEOM Solar Phase 1',  '0012');

-- 4. Add new columns to the drawings table
--    Using IF NOT EXISTS guards so re-running this migration won't error.
ALTER TABLE public.drawings
  ADD COLUMN IF NOT EXISTS project_number TEXT,       -- mirrors projects.project_number
  ADD COLUMN IF NOT EXISTS drawing_code   TEXT,       -- the 'aa' segment (e.g. '02')
  ADD COLUMN IF NOT EXISTS folder_path    TEXT,       -- storage path e.g. '0011/working/GM-RT-DWG-02-0011-2026_R0.pdf'
  ADD COLUMN IF NOT EXISTS archived_at    TIMESTAMPTZ; -- set when a revision is superseded

-- 5. Unique constraint: one drawing_no + revision combination per project
--    Prevents duplicate revisions if two users upload simultaneously.
ALTER TABLE public.drawings
  ADD CONSTRAINT unique_drawing_revision UNIQUE (drawing_no, revision);
