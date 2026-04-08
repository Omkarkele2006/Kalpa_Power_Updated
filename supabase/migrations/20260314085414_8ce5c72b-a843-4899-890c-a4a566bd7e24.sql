
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('designer', 'line-manager', 'dept-head', 'site-engineer', 'vendor-client');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to insert their own role" 
ON public.user_roles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to view their own role" 
ON public.user_roles 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);


-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own role at signup" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Drawing status enum
CREATE TYPE public.drawing_status AS ENUM ('working', 'under-review', 'pending-dept-head', 'approved', 'rejected');

-- Drawings table
CREATE TABLE public.drawings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drawing_no TEXT NOT NULL,
  design_name TEXT NOT NULL,
  revision INT NOT NULL DEFAULT 1,
  project TEXT NOT NULL,
  status drawing_status NOT NULL DEFAULT 'working',
  designer_id UUID REFERENCES auth.users(id) NOT NULL,
  file_url TEXT,
  file_name TEXT,
  file_type TEXT CHECK (file_type IN ('pdf', 'cad', 'both')),
  stamp_applied BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES auth.users(id),
  approved_date TIMESTAMPTZ,
  review_started TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.drawings ENABLE ROW LEVEL SECURITY;

-- Designers see own drawings; reviewers see all
CREATE POLICY "Designers see own drawings" ON public.drawings FOR SELECT TO authenticated
  USING (
    auth.uid() = designer_id
    OR public.has_role(auth.uid(), 'line-manager')
    OR public.has_role(auth.uid(), 'dept-head')
    OR public.has_role(auth.uid(), 'site-engineer')
    OR (public.has_role(auth.uid(), 'vendor-client') AND status = 'approved')
  );

CREATE POLICY "Designers can insert drawings" ON public.drawings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = designer_id AND public.has_role(auth.uid(), 'designer'));

CREATE POLICY "Designers can update own working drawings" ON public.drawings FOR UPDATE TO authenticated
  USING (auth.uid() = designer_id AND status = 'working');

CREATE POLICY "Line managers can update under-review drawings" ON public.drawings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'line-manager') AND status = 'under-review');

CREATE POLICY "Dept heads can update pending drawings" ON public.drawings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'dept-head') AND status = 'pending-dept-head');

-- Drawing comments for rejections
CREATE TABLE public.drawing_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drawing_id UUID REFERENCES public.drawings(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id) NOT NULL,
  comment TEXT NOT NULL,
  action TEXT CHECK (action IN ('approve', 'reject', 'comment')) NOT NULL DEFAULT 'comment',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.drawing_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view comments" ON public.drawing_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert comments" ON public.drawing_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

-- Storage bucket for drawing files
INSERT INTO storage.buckets (id, name, public, file_size_limit) VALUES ('drawing-files', 'drawing-files', false, 262144000);

CREATE POLICY "Authenticated users can upload drawing files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'drawing-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Authenticated users can view drawing files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'drawing-files');

CREATE POLICY "Users can update own drawing files" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'drawing-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Trigger for auto-creating profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_drawings_updated_at BEFORE UPDATE ON public.drawings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
