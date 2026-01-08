# Security Checklist

본 문서는 FRISK ERP 시스템의 보안 점검 항목을 정리한 체크리스트입니다.

## ✅ 인증 및 권한

- [x] **Supabase Auth 사용**: 안전한 세션 관리 및 JWT 기반 인증
- [x] **역할 기반 접근 제어 (RBAC)**: admin, nepal_agency, university 역할별 권한 분리
- [x] **미들웨어 보호**: 보호된 경로에 대한 인증 확인
- [x] **서버 사이드 권한 검증**: API 라우트에서 역할 확인

## ✅ 데이터 보호

- [x] **Row Level Security (RLS)**: 모든 테이블에 RLS 정책 적용
- [x] **Private Storage Bucket**: 파일은 비공개 버킷에 저장
- [x] **Signed URL**: 파일 접근 시 24시간 만료 서명된 URL 사용
- [x] **UUID 파일명**: 업로드 파일명은 UUID로 난독화
- [x] **Soft Delete**: 학생 데이터 삭제 시 deleted_at 사용 (복구 가능)

## ✅ 보안 헤더

- [x] **HSTS**: Strict-Transport-Security 적용
- [x] **X-Frame-Options**: SAMEORIGIN (클릭재킹 방지)
- [x] **X-Content-Type-Options**: nosniff
- [x] **X-XSS-Protection**: 1; mode=block
- [x] **Referrer-Policy**: origin-when-cross-origin
- [x] **Permissions-Policy**: 불필요한 권한 비활성화

## ✅ API 보안

- [x] **인증 필수**: 모든 API 엔드포인트에서 인증 확인
- [x] **입력 검증**: 필수 필드 및 형식 검증
- [x] **에러 메시지**: 민감 정보 노출 최소화

## ✅ 파일 업로드 보안

- [x] **파일 크기 제한**: 최대 10MB
- [x] **파일 타입 제한**: PDF, JPEG, PNG, WebP만 허용
- [x] **서버 사이드 검증**: 클라이언트와 서버 양측에서 검증

## ✅ 감사 및 로깅

- [x] **로그인/로그아웃 기록**: audit_logs 테이블에 저장
- [x] **IP 주소 기록**: 접속 IP 기록
- [x] **다운로드 기록**: 파일 다운로드 감사 로그
- [x] **연락처 변경 기록**: contact_change_logs 테이블에 이력 저장

## ✅ 이메일 보안

- [x] **민감 정보 제외**: 이메일에 진단서, 질병명 등 미포함
- [x] **기본 정보만 전송**: 학생명, 학번, 결석일, 사유 코드만 포함

## ⚠️ 운영 시 주의사항

### 환경 변수 관리
```
NEXT_PUBLIC_SUPABASE_URL=<your-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
RESEND_API_KEY=<your-resend-key>
NEXT_PUBLIC_APP_URL=<your-production-url>
```

### Supabase 설정
1. RLS 정책이 모든 테이블에 활성화되어 있는지 확인
2. Storage 버킷 (consent-files, absence-files)이 Private으로 설정되어 있는지 확인
3. 버킷별 RLS 정책이 적용되어 있는지 확인

### 정기 점검
- [ ] 분기별 보안 패치 적용
- [ ] 의존성 패키지 취약점 검사 (`npm audit`)
- [ ] 접근 로그 분석
- [ ] 미사용 계정 비활성화

## 데이터 보존 정책

| 데이터 유형 | 보존 기간 | 비고 |
|------------|----------|------|
| 학생 기본 정보 | 영구 | 졸업/제적 후에도 유지 |
| 결석 기록 | 5년 | 비자 연장 관련 |
| 감사 로그 | 1년 | 정기적 아카이빙 권장 |
| 분기 점검 기록 | 3년 | - |

---

*최종 업데이트: 2026년 1월*
