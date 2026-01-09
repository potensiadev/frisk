-- 이메일 발송 로그 테이블
-- 이메일 발송 성공/실패 기록 및 추적

-- ===========================================
-- 1. email_logs 테이블 생성
-- ===========================================

CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 발송 정보
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  university_id UUID REFERENCES universities(id) ON DELETE SET NULL,
  university_name TEXT,

  -- 이메일 내용
  subject TEXT NOT NULL,
  email_type TEXT NOT NULL, -- 'absence_notification', 'quarterly_report', 'system_alert' 등

  -- 발송 결과
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
  message_id TEXT, -- Resend에서 반환하는 메시지 ID
  error_message TEXT, -- 실패 시 에러 메시지

  -- 시간 기록
  sent_at TIMESTAMPTZ, -- 발송 성공 시간
  failed_at TIMESTAMPTZ, -- 발송 실패 시간
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 추가 메타데이터 (JSON)
  metadata JSONB DEFAULT '{}'::jsonb
);

-- ===========================================
-- 2. 인덱스 생성
-- ===========================================

-- 상태별 조회
CREATE INDEX idx_email_logs_status ON email_logs(status);

-- 이메일 타입별 조회
CREATE INDEX idx_email_logs_email_type ON email_logs(email_type);

-- 대학교별 조회
CREATE INDEX idx_email_logs_university_id ON email_logs(university_id);

-- 수신자 이메일 조회
CREATE INDEX idx_email_logs_recipient_email ON email_logs(recipient_email);

-- 날짜별 조회 (최근 로그)
CREATE INDEX idx_email_logs_created_at ON email_logs(created_at DESC);

-- ===========================================
-- 3. RLS 정책
-- ===========================================

ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- 관리자: 전체 조회
CREATE POLICY "Admin full access on email_logs"
  ON email_logs FOR ALL
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- 네팔 유학원: 조회만
CREATE POLICY "Nepal agency can view email_logs"
  ON email_logs FOR SELECT
  USING (get_user_role() = 'nepal_agency');

-- 대학교: 자신의 대학 관련 로그만 조회
CREATE POLICY "University can view own email_logs"
  ON email_logs FOR SELECT
  USING (
    get_user_role() = 'university'
    AND university_id = get_user_university_id()
  );

-- ===========================================
-- 4. 서비스 역할용 INSERT 정책 (API에서 로그 기록용)
-- ===========================================

-- 서버에서 로그를 기록할 수 있도록 별도 정책
-- 참고: service_role은 RLS를 우회하므로 이 정책은 anon/authenticated 사용자를 위한 것
CREATE POLICY "Allow insert for authenticated users"
  ON email_logs FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
