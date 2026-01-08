-- Create storage bucket for consent files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'consent-files',
  'consent-files',
  false,
  5242880, -- 5MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for consent files bucket

-- Policy: Authenticated users can upload files
CREATE POLICY "Authenticated users can upload consent files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'consent-files');

-- Policy: Users can read consent files (agency can see all, university only their students)
CREATE POLICY "Users can view consent files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'consent-files'
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
      WHERE u.id = auth.uid()
      AND u.role = 'university'
      AND storage.objects.name LIKE s.id || '/%'
    )
  )
);

-- Policy: Agency and admin can delete consent files
CREATE POLICY "Agency and admin can delete consent files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'consent-files'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'nepal_agency')
  )
);

-- Policy: Agency and admin can update consent files
CREATE POLICY "Agency and admin can update consent files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'consent-files'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'nepal_agency')
  )
);
