-- Enable RLS
ALTER TABLE absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE absence_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE quarterly_checkins ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role (optional, but cleaner if reused)
-- ignoring for now to keep it standard SQL

-- 1. Absences Policies
CREATE POLICY "University users can select their own students' absences"
ON absences FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM students s
    JOIN users u ON u.university_id = s.university_id
    WHERE s.id = absences.student_id
    AND u.id = auth.uid()
    AND u.role = 'university'
    AND s.deleted_at IS NULL
  )
);

CREATE POLICY "Admin and Agency have full access to absences"
ON absences FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'nepal_agency')
  )
);

-- 2. Absence Files Policies
CREATE POLICY "University users can view their own students' absence files"
ON absence_files FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM absences a
    JOIN students s ON s.id = a.student_id
    JOIN users u ON u.university_id = s.university_id
    WHERE a.id = absence_files.absence_id
    AND u.id = auth.uid()
    AND u.role = 'university'
  )
);

CREATE POLICY "Admin and Agency have full access to absence files"
ON absence_files FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'nepal_agency')
  )
);

-- 3. Quarterly Checkins Policies
CREATE POLICY "University users can view their own students' checkins"
ON quarterly_checkins FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM students s
    JOIN users u ON u.university_id = s.university_id
    WHERE s.id = quarterly_checkins.student_id
    AND u.id = auth.uid()
    AND u.role = 'university'
  )
);

CREATE POLICY "Admin and Agency have full access to checkins"
ON quarterly_checkins FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'nepal_agency')
  )
);

-- 4. Storage Policies (absence-files bucket)
-- Allow Admin/Agency to Insert (Upload)
CREATE POLICY "Admin/Agency can upload absence files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'absence-files' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'nepal_agency')
  )
);

-- Allow Admin/Agency to Delete
CREATE POLICY "Admin/Agency can delete absence files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'absence-files' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'nepal_agency')
  )
);

-- Allow University to Select (if direct access is needed, otherwise signed URLs handle it)
-- Note: Signed URLs bypass RLS for the expiry duration, so strict RLS on SELECT is less critical if no public access.
-- But we can add it for completeness if they try to access via authenticated client directly.
CREATE POLICY "University can view own students' files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'absence-files' AND
  EXISTS (
    SELECT 1 FROM absence_files af
    JOIN absences a ON a.id = af.absence_id
    JOIN students s ON s.id = a.student_id
    JOIN users u ON u.university_id = s.university_id
    WHERE af.file_path = storage.objects.name
    AND u.id = auth.uid()
    AND u.role = 'university'
  )
);

CREATE POLICY "Admin/Agency can view all files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'absence-files' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'nepal_agency')
  )
);
