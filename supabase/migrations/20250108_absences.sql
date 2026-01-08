-- Phase 4: Absence Management Tables and Policies

-- Create absences table
CREATE TABLE IF NOT EXISTS public.absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  absence_date DATE NOT NULL,
  reason absence_reason NOT NULL,
  note TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, absence_date)
);

-- Create absence_files table
CREATE TABLE IF NOT EXISTS public.absence_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  absence_id UUID NOT NULL REFERENCES absences(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  original_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for absences
CREATE INDEX IF NOT EXISTS idx_absences_student ON public.absences(student_id);
CREATE INDEX IF NOT EXISTS idx_absences_date ON public.absences(absence_date);
CREATE INDEX IF NOT EXISTS idx_absences_created_by ON public.absences(created_by);

-- Indexes for absence_files
CREATE INDEX IF NOT EXISTS idx_absence_files_absence ON public.absence_files(absence_id);

-- Enable RLS
ALTER TABLE public.absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absence_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for absences

-- Admin can do everything
CREATE POLICY "Admin can access all absences"
ON public.absences
FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Nepal agency can do everything
CREATE POLICY "Agency can access all absences"
ON public.absences
FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'nepal_agency')
);

-- University can read absences for their students only
CREATE POLICY "University can read own student absences"
ON public.absences
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.students s ON s.university_id = u.university_id
    WHERE u.id = auth.uid()
    AND u.role = 'university'
    AND s.id = absences.student_id
  )
);

-- RLS Policies for absence_files

-- Admin can do everything
CREATE POLICY "Admin can access all absence files"
ON public.absence_files
FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Nepal agency can do everything
CREATE POLICY "Agency can access all absence files"
ON public.absence_files
FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'nepal_agency')
);

-- University can read absence files for their students only
CREATE POLICY "University can read own student absence files"
ON public.absence_files
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.students s ON s.university_id = u.university_id
    JOIN public.absences a ON a.student_id = s.id
    WHERE u.id = auth.uid()
    AND u.role = 'university'
    AND a.id = absence_files.absence_id
  )
);

-- Storage bucket for absence evidence files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'absence-files',
  'absence-files',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for absence files bucket

-- Authenticated users can upload absence files
CREATE POLICY "Authenticated users can upload absence files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'absence-files');

-- Users can read absence files based on role
CREATE POLICY "Users can view absence files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'absence-files'
  AND (
    -- Admin and agency can see all
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'nepal_agency')
    )
    OR
    -- University can only see their students' files
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.students s ON s.university_id = u.university_id
      JOIN public.absences a ON a.student_id = s.id
      JOIN public.absence_files af ON af.absence_id = a.id
      WHERE u.id = auth.uid()
      AND u.role = 'university'
      AND storage.objects.name LIKE af.file_path || '%'
    )
  )
);

-- Agency and admin can delete absence files
CREATE POLICY "Agency and admin can delete absence files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'absence-files'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'nepal_agency')
  )
);
