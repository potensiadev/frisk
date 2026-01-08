# Deployment Guide

본 문서는 FRISK ERP 시스템의 배포 가이드입니다.

## 사전 요구사항

### 1. Supabase 프로젝트 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. `docs/schema.md`의 SQL 스크립트 실행하여 테이블 생성
3. Storage 버킷 생성:
   - `consent-files` (Private)
   - `absence-files` (Private)
4. RLS 정책 적용 (schema.md 참조)

### 2. Resend 설정 (이메일)

1. [Resend](https://resend.com)에서 계정 생성
2. API 키 발급
3. 발신 도메인 설정 (선택)

### 3. Vercel 설정

1. [Vercel](https://vercel.com)에서 계정 생성
2. GitHub 저장소 연결

## 환경 변수 설정

### Vercel 환경 변수

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
RESEND_API_KEY=re_xxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 로컬 개발 (.env.local)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
RESEND_API_KEY=re_xxxxxxxxxxxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 배포 단계

### 1. 코드 배포

```bash
# 변경사항 커밋
git add -A
git commit -m "Production deployment"

# 배포 (Vercel 자동 배포)
git push origin main
```

### 2. 초기 관리자 계정 생성

Supabase Dashboard에서:

1. Authentication > Users > Add User
2. 이메일, 비밀번호 입력
3. `public.users` 테이블에 역할 추가:

```sql
INSERT INTO public.users (id, email, role)
VALUES ('user-auth-id', 'admin@example.com', 'admin');
```

### 3. 대학교 및 유학원 계정 생성

관리자 로그인 후:
1. `/admin/universities` - 대학교 등록
2. `/admin/users` - 사용자 생성 (역할 지정)

## 도메인 설정

### Vercel 도메인 연결

1. Vercel Dashboard > Settings > Domains
2. 커스텀 도메인 추가
3. DNS 레코드 설정 (CNAME 또는 A 레코드)

### HTTPS 자동 설정

Vercel이 자동으로 SSL 인증서를 발급합니다.

## 모니터링

### Vercel Analytics

```javascript
// next.config.ts에 이미 설정됨
// Vercel Dashboard에서 확인 가능
```

### Supabase 모니터링

- Database: Table Editor에서 데이터 확인
- Auth: Authentication 메뉴에서 사용자 관리
- Storage: Buckets에서 파일 확인
- Logs: Project Settings > API > Logs

## 백업

### 데이터베이스 백업

Supabase Pro 플랜 사용 시:
- 자동 일일 백업
- Point-in-time recovery

### 수동 백업

```sql
-- Supabase SQL Editor에서 실행
-- 또는 pg_dump 사용
```

## 롤백

### Vercel 롤백

1. Vercel Dashboard > Deployments
2. 이전 배포 선택
3. "Promote to Production" 클릭

### 데이터베이스 롤백

1. Supabase Dashboard > Database > Backups
2. 복원할 시점 선택

## 문제 해결

### 일반적인 오류

| 오류 | 원인 | 해결 |
|------|------|------|
| 401 Unauthorized | 인증 토큰 만료 | 재로그인 |
| 403 Forbidden | 권한 부족 | 역할 확인 |
| 500 Server Error | 서버 오류 | 로그 확인 |

### 로그 확인

```bash
# Vercel 로그
vercel logs

# 또는 Vercel Dashboard > Functions > Logs
```

## 성능 최적화

### 이미 적용된 최적화

- [x] Next.js 이미지 최적화
- [x] 압축 활성화
- [x] 보안 헤더 적용
- [x] React Server Components 사용

### 추가 권장사항

- [ ] CDN 캐싱 설정
- [ ] 데이터베이스 인덱스 최적화
- [ ] API 응답 캐싱

---

## 체크리스트

### 배포 전

- [ ] `.env.local`의 모든 환경 변수가 Vercel에 설정됨
- [ ] Supabase RLS 정책 활성화 확인
- [ ] Storage 버킷 Private 설정 확인
- [ ] 관리자 계정 생성 완료

### 배포 후

- [ ] 로그인 테스트
- [ ] 역할별 접근 권한 테스트
- [ ] 파일 업로드 테스트
- [ ] 이메일 발송 테스트 (Resend 설정 시)
- [ ] PDF 리포트 생성 테스트

---

*최종 업데이트: 2026년 1월*
