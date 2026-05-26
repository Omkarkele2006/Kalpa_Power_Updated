-- Add profile fields for enhanced user profile management
-- These columns support enterprise-grade profile information

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS mobile TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS designation TEXT,
  ADD COLUMN IF NOT EXISTS employee_id TEXT;

-- Index on employee_id for faster lookups if used in org structures
CREATE INDEX IF NOT EXISTS idx_profiles_employee_id ON public.profiles(employee_id);

-- No changes needed to RLS — existing "Users can update own profile" policy covers all columns
