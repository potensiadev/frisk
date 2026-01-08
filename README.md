# 외국인 유학생 리스크 관리 ERP

네팔 유학생 관리 및 대학교 국제처 리포팅 시스템

## 기술 스택

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Backend/DB**: Supabase (PostgreSQL + Auth + Storage + RLS)
- **이메일**: Resend
- **PDF 생성**: react-pdf
- **배포**: Vercel

## 설정

### 환경 변수

`.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Resend (이메일 발송)
RESEND_API_KEY=your-resend-api-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router 페이지
│   ├── (auth)/            # 인증 관련 페이지 (로그인)
│   ├── (dashboard)/       # 대시보드 페이지
│   │   ├── admin/         # 관리자 대시보드
│   │   ├── agency/        # 네팔 유학원 대시보드
│   │   └── university/    # 대학교 국제처 대시보드
│   └── api/               # API 라우트
├── components/            # 재사용 가능한 컴포넌트
│   ├── ui/               # UI 기본 컴포넌트
│   └── forms/            # 폼 컴포넌트
├── lib/                   # 유틸리티 및 라이브러리
│   ├── supabase/         # Supabase 클라이언트
│   ├── email/            # 이메일 발송
│   └── pdf/              # PDF 생성
├── hooks/                 # 커스텀 훅
└── types/                 # TypeScript 타입 정의
```

## 사용자 역할

| 역할 | 접근 경로 | 권한 |
|------|-----------|------|
| 관리자 (admin) | `/admin` | 전체 Read/Write |
| 네팔 유학원 (nepal_agency) | `/agency` | 학생/결석 Write |
| 대학교 국제처 (university) | `/university` | 소속 학생 Read Only |

## 개발 명령어

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm run start

# ESLint 실행
npm run lint

# Prettier 포맷팅
npm run format

# Prettier 체크 (CI용)
npm run format:check
```

## Vercel 배포

### 1. Vercel 프로젝트 연결

```bash
# Vercel CLI 설치 (최초 1회)
npm i -g vercel

# 프로젝트 연결
vercel link
```

### 2. 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 설정하세요:

| 변수명 | 설명 | 환경 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | All |
| `NEXT_PUBLIC_APP_URL` | 앱 URL | Production |
| `RESEND_API_KEY` | Resend API 키 (이메일용) | All |

### 3. 배포

```bash
# 프리뷰 배포
vercel

# 프로덕션 배포
vercel --prod
```

## 데이터베이스 마이그레이션

Supabase 대시보드의 SQL Editor에서 다음 순서로 실행:

1. `supabase/migrations/20250108_initial_schema.sql`
2. `supabase/migrations/20250108_add_missing_rls_policies.sql`
