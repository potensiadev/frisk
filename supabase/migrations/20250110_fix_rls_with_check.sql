-- RLS 정책 WITH CHECK 절 추가
-- FOR ALL 정책에 WITH CHECK를 명시적으로 추가하여 INSERT 작업이 정상 동작하도록 수정

-- ===========================================
-- 1. university_contacts 테이블 RLS 정책 수정
-- ===========================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Admin full access on university_contacts" ON university_contacts;

-- WITH CHECK 포함한 새 정책 생성
CREATE POLICY "Admin full access on university_contacts"
  ON university_contacts FOR ALL
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- ===========================================
-- 2. universities 테이블 RLS 정책 수정
-- ===========================================

DROP POLICY IF EXISTS "Admin full access on universities" ON universities;

CREATE POLICY "Admin full access on universities"
  ON universities FOR ALL
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- ===========================================
-- 3. users 테이블 RLS 정책 수정
-- ===========================================

DROP POLICY IF EXISTS "Admin full access on users" ON users;

CREATE POLICY "Admin full access on users"
  ON users FOR ALL
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- ===========================================
-- 4. students 테이블 RLS 정책 수정
-- ===========================================

DROP POLICY IF EXISTS "Admin full access on students" ON students;

CREATE POLICY "Admin full access on students"
  ON students FOR ALL
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

DROP POLICY IF EXISTS "Nepal agency full access on students" ON students;

CREATE POLICY "Nepal agency full access on students"
  ON students FOR ALL
  USING (get_user_role() = 'nepal_agency')
  WITH CHECK (get_user_role() = 'nepal_agency');

-- ===========================================
-- 5. absences 테이블 RLS 정책 수정
-- ===========================================

DROP POLICY IF EXISTS "Admin full access on absences" ON absences;

CREATE POLICY "Admin full access on absences"
  ON absences FOR ALL
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

DROP POLICY IF EXISTS "Nepal agency full access on absences" ON absences;

CREATE POLICY "Nepal agency full access on absences"
  ON absences FOR ALL
  USING (get_user_role() = 'nepal_agency')
  WITH CHECK (get_user_role() = 'nepal_agency');

-- ===========================================
-- 6. absence_files 테이블 RLS 정책 수정
-- ===========================================

DROP POLICY IF EXISTS "Admin full access on absence_files" ON absence_files;

CREATE POLICY "Admin full access on absence_files"
  ON absence_files FOR ALL
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

DROP POLICY IF EXISTS "Nepal agency full access on absence_files" ON absence_files;

CREATE POLICY "Nepal agency full access on absence_files"
  ON absence_files FOR ALL
  USING (get_user_role() = 'nepal_agency')
  WITH CHECK (get_user_role() = 'nepal_agency');

-- ===========================================
-- 7. quarterly_checkins 테이블 RLS 정책 수정
-- ===========================================

DROP POLICY IF EXISTS "Admin full access on quarterly_checkins" ON quarterly_checkins;

CREATE POLICY "Admin full access on quarterly_checkins"
  ON quarterly_checkins FOR ALL
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

DROP POLICY IF EXISTS "Nepal agency full access on quarterly_checkins" ON quarterly_checkins;

CREATE POLICY "Nepal agency full access on quarterly_checkins"
  ON quarterly_checkins FOR ALL
  USING (get_user_role() = 'nepal_agency')
  WITH CHECK (get_user_role() = 'nepal_agency');

-- ===========================================
-- 8. contact_change_logs 테이블 RLS 정책 수정
-- ===========================================

DROP POLICY IF EXISTS "Admin full access on contact_change_logs" ON contact_change_logs;

CREATE POLICY "Admin full access on contact_change_logs"
  ON contact_change_logs FOR ALL
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- ===========================================
-- 9. audit_logs 테이블 RLS 정책 수정
-- ===========================================

DROP POLICY IF EXISTS "Admin full access on audit_logs" ON audit_logs;

CREATE POLICY "Admin full access on audit_logs"
  ON audit_logs FOR ALL
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');
