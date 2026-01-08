-- 누락된 RLS 정책 추가
-- Phase 0/1 코드 리뷰에서 발견된 보안 취약점 수정

-- ===========================================
-- 1. users 테이블 RLS 정책
-- ===========================================

-- 관리자: 전체 CRUD
CREATE POLICY "Admin full access on users"
  ON users FOR ALL
  USING (get_user_role() = 'admin');

-- 일반 사용자: 자신의 데이터만 조회
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- ===========================================
-- 2. university_contacts 테이블 RLS 정책
-- ===========================================

-- 관리자: 전체 CRUD
CREATE POLICY "Admin full access on university_contacts"
  ON university_contacts FOR ALL
  USING (get_user_role() = 'admin');

-- 네팔 유학원: 조회만
CREATE POLICY "Nepal agency can view university_contacts"
  ON university_contacts FOR SELECT
  USING (get_user_role() = 'nepal_agency');

-- 대학교: 자신의 대학 담당자만 조회
CREATE POLICY "University can view own contacts"
  ON university_contacts FOR SELECT
  USING (
    get_user_role() = 'university'
    AND university_id = get_user_university_id()
  );

-- ===========================================
-- 3. absence_files 테이블 RLS 정책
-- ===========================================

-- 관리자: 전체 CRUD
CREATE POLICY "Admin full access on absence_files"
  ON absence_files FOR ALL
  USING (get_user_role() = 'admin');

-- 네팔 유학원: 전체 CRUD
CREATE POLICY "Nepal agency full access on absence_files"
  ON absence_files FOR ALL
  USING (get_user_role() = 'nepal_agency');

-- 대학교: 소속 학생의 결석 증빙만 조회
CREATE POLICY "University can view own students absence_files"
  ON absence_files FOR SELECT
  USING (
    get_user_role() = 'university'
    AND absence_id IN (
      SELECT a.id FROM absences a
      JOIN students s ON a.student_id = s.id
      WHERE s.university_id = get_user_university_id()
        AND s.deleted_at IS NULL
    )
  );

-- ===========================================
-- 4. contact_change_logs 테이블 RLS 정책
-- ===========================================

-- 관리자: 전체 CRUD
CREATE POLICY "Admin full access on contact_change_logs"
  ON contact_change_logs FOR ALL
  USING (get_user_role() = 'admin');

-- 네팔 유학원: 전체 CRUD
CREATE POLICY "Nepal agency full access on contact_change_logs"
  ON contact_change_logs FOR ALL
  USING (get_user_role() = 'nepal_agency');

-- ===========================================
-- 5. students 테이블 RLS 정책 수정 (Soft Delete 반영)
-- ===========================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Admin full access on students" ON students;
DROP POLICY IF EXISTS "Nepal agency full access on students" ON students;
DROP POLICY IF EXISTS "University can view own students" ON students;

-- 관리자: 전체 CRUD (삭제된 데이터도 접근 가능 - 복구/영구삭제 위함)
CREATE POLICY "Admin full access on students"
  ON students FOR ALL
  USING (get_user_role() = 'admin');

-- 네팔 유학원: 삭제되지 않은 학생만 CRUD
CREATE POLICY "Nepal agency access on active students"
  ON students FOR ALL
  USING (get_user_role() = 'nepal_agency' AND deleted_at IS NULL);

-- 대학교: 삭제되지 않은 소속 학생만 조회
CREATE POLICY "University can view own active students"
  ON students FOR SELECT
  USING (
    get_user_role() = 'university'
    AND university_id = get_user_university_id()
    AND deleted_at IS NULL
  );

-- ===========================================
-- 6. absences 테이블 RLS 정책 수정 (Soft Delete 반영)
-- ===========================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "University can view own students absences" ON absences;

-- 대학교: 삭제되지 않은 소속 학생의 결석만 조회
CREATE POLICY "University can view own active students absences"
  ON absences FOR SELECT
  USING (
    get_user_role() = 'university'
    AND student_id IN (
      SELECT id FROM students
      WHERE university_id = get_user_university_id()
        AND deleted_at IS NULL
    )
  );

-- ===========================================
-- 7. quarterly_checkins 테이블 RLS 정책 보완
-- ===========================================

-- 대학교: 소속 학생의 점검 기록 조회 (선택적 - PRD에서는 조회 불가로 명시)
-- 현재는 조회 불가로 유지

-- ===========================================
-- 8. 대학교 담당자 최소 1명, 최대 2명 제약 트리거
-- ===========================================

-- 담당자 수 검증 함수
CREATE OR REPLACE FUNCTION check_university_contacts_limit()
RETURNS TRIGGER AS $$
DECLARE
  contact_count INTEGER;
BEGIN
  -- INSERT 시 최대 2명 초과 체크
  IF TG_OP = 'INSERT' THEN
    SELECT COUNT(*) INTO contact_count
    FROM university_contacts
    WHERE university_id = NEW.university_id;

    IF contact_count >= 2 THEN
      RAISE EXCEPTION 'University can have maximum 2 contacts';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 담당자 삭제 시 최소 1명 유지 검증 함수
CREATE OR REPLACE FUNCTION check_university_contacts_minimum()
RETURNS TRIGGER AS $$
DECLARE
  contact_count INTEGER;
BEGIN
  -- DELETE 시 최소 1명 유지 체크
  SELECT COUNT(*) INTO contact_count
  FROM university_contacts
  WHERE university_id = OLD.university_id
    AND id != OLD.id;

  IF contact_count < 1 THEN
    RAISE EXCEPTION 'University must have at least 1 contact';
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER check_contacts_limit_trigger
  BEFORE INSERT ON university_contacts
  FOR EACH ROW
  EXECUTE FUNCTION check_university_contacts_limit();

CREATE TRIGGER check_contacts_minimum_trigger
  BEFORE DELETE ON university_contacts
  FOR EACH ROW
  EXECUTE FUNCTION check_university_contacts_minimum();
