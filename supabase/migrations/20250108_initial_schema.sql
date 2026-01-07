-- 외국인 유학생 리스크 관리 ERP 데이터베이스 스키마
-- 초기 마이그레이션

-- ===========================================
-- 1. 사용자 정의 타입 (ENUM)
-- ===========================================

CREATE TYPE user_role AS ENUM ('admin', 'nepal_agency', 'university');
CREATE TYPE student_program AS ENUM ('language', 'bachelor', 'master', 'phd');
CREATE TYPE student_status AS ENUM ('enrolled', 'graduated', 'completed', 'withdrawn', 'expelled');
CREATE TYPE absence_reason AS ENUM ('illness', 'personal', 'other');
CREATE TYPE audit_action_type AS ENUM ('login', 'logout', 'download');
CREATE TYPE contact_field AS ENUM ('phone', 'address', 'email');

-- ===========================================
-- 2. 대학교 테이블
-- ===========================================

CREATE TABLE universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 3. 대학교 담당자 연락처 테이블
-- ===========================================

CREATE TABLE university_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (university_id, email)
);

-- 대학교당 최소 1명, 최대 2명 제약 (트리거로 처리)

-- ===========================================
-- 4. 사용자 테이블 (Supabase Auth 확장)
-- ===========================================

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role user_role NOT NULL,
  university_id UUID REFERENCES universities(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 5. 학생 테이블
-- ===========================================

CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES universities(id) ON DELETE RESTRICT,
  student_no TEXT NOT NULL,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  program student_program NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  status student_status NOT NULL DEFAULT 'enrolled',
  consent_file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ, -- Soft delete
  
  -- 대학교 + 프로그램 + 학번으로 고유 식별
  UNIQUE (university_id, program, student_no)
);

-- 인덱스
CREATE INDEX idx_students_university ON students(university_id);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_deleted_at ON students(deleted_at) WHERE deleted_at IS NOT NULL;

-- ===========================================
-- 6. 결석 테이블
-- ===========================================

CREATE TABLE absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  absence_date DATE NOT NULL,
  reason absence_reason NOT NULL,
  note TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 같은 학생의 같은 날짜 결석 중복 방지
  UNIQUE (student_id, absence_date)
);

-- 인덱스
CREATE INDEX idx_absences_student ON absences(student_id);
CREATE INDEX idx_absences_date ON absences(absence_date);

-- ===========================================
-- 7. 결석 증빙 파일 테이블
-- ===========================================

CREATE TABLE absence_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  absence_id UUID NOT NULL REFERENCES absences(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL, -- Storage에 저장된 경로 (UUID 파일명)
  original_name TEXT NOT NULL, -- 원본 파일명 (메타데이터)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 8. Quarterly Check-in 테이블
-- ===========================================

CREATE TABLE quarterly_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  check_in_date DATE NOT NULL,
  phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  address_verified BOOLEAN NOT NULL DEFAULT FALSE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  checked_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_checkins_student ON quarterly_checkins(student_id);
CREATE INDEX idx_checkins_date ON quarterly_checkins(check_in_date);

-- ===========================================
-- 9. 연락처 변경 로그 테이블
-- ===========================================

CREATE TABLE contact_change_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  field_name contact_field NOT NULL,
  old_value TEXT,
  new_value TEXT NOT NULL,
  changed_by UUID NOT NULL REFERENCES users(id),
  check_in_date DATE, -- Quarterly Check-in 시 변경된 경우
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_contact_logs_student ON contact_change_logs(student_id);

-- ===========================================
-- 10. 감사 로그 테이블
-- ===========================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action_type audit_action_type NOT NULL,
  details JSONB, -- 추가 정보 (다운로드한 파일명 등)
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action_type);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- ===========================================
-- 11. updated_at 자동 갱신 트리거
-- ===========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 12. Row Level Security (RLS) 정책
-- ===========================================

-- 테이블별 RLS 활성화
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE university_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE absences ENABLE ROW LEVEL SECURITY;
ALTER TABLE absence_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE quarterly_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_change_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 사용자 역할 조회 함수
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
BEGIN
  RETURN (SELECT role FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 사용자의 대학 ID 조회 함수
CREATE OR REPLACE FUNCTION get_user_university_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT university_id FROM users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========== universities 정책 ==========

-- 관리자: 전체 CRUD
CREATE POLICY "Admin full access on universities"
  ON universities FOR ALL
  USING (get_user_role() = 'admin');

-- 네팔 유학원: 조회만
CREATE POLICY "Nepal agency can view universities"
  ON universities FOR SELECT
  USING (get_user_role() = 'nepal_agency');

-- 대학교: 자신의 대학만 조회
CREATE POLICY "University can view own record"
  ON universities FOR SELECT
  USING (get_user_role() = 'university' AND id = get_user_university_id());

-- ========== students 정책 ==========

-- 관리자: 전체 CRUD
CREATE POLICY "Admin full access on students"
  ON students FOR ALL
  USING (get_user_role() = 'admin');

-- 네팔 유학원: 전체 CRUD (모든 학생 관리)
CREATE POLICY "Nepal agency full access on students"
  ON students FOR ALL
  USING (get_user_role() = 'nepal_agency');

-- 대학교: 소속 학생만 조회
CREATE POLICY "University can view own students"
  ON students FOR SELECT
  USING (get_user_role() = 'university' AND university_id = get_user_university_id());

-- ========== absences 정책 ==========

-- 관리자: 전체 CRUD
CREATE POLICY "Admin full access on absences"
  ON absences FOR ALL
  USING (get_user_role() = 'admin');

-- 네팔 유학원: 전체 CRUD
CREATE POLICY "Nepal agency full access on absences"
  ON absences FOR ALL
  USING (get_user_role() = 'nepal_agency');

-- 대학교: 소속 학생의 결석만 조회
CREATE POLICY "University can view own students absences"
  ON absences FOR SELECT
  USING (
    get_user_role() = 'university' 
    AND student_id IN (
      SELECT id FROM students WHERE university_id = get_user_university_id()
    )
  );

-- ========== quarterly_checkins 정책 ==========

-- 관리자: 전체 CRUD
CREATE POLICY "Admin full access on quarterly_checkins"
  ON quarterly_checkins FOR ALL
  USING (get_user_role() = 'admin');

-- 네팔 유학원: 전체 CRUD
CREATE POLICY "Nepal agency full access on quarterly_checkins"
  ON quarterly_checkins FOR ALL
  USING (get_user_role() = 'nepal_agency');

-- 대학교: 조회 불가 (필요시 추가)

-- ========== audit_logs 정책 ==========

-- 관리자만 조회 가능
CREATE POLICY "Admin can view audit logs"
  ON audit_logs FOR SELECT
  USING (get_user_role() = 'admin');

-- 삽입은 모든 인증된 사용자 허용 (로그인 기록 등)
CREATE POLICY "Authenticated users can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
